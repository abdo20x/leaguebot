import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextChannel
} from "discord.js";
import { storage } from "../../storage";
import { createTransactionEmbed, createTransactionActionButtons } from "../embeds";
import { findChannel } from "../utils";
import client from "../index";

// Offer command
const offerCommand = {
  data: new SlashCommandBuilder()
    .setName('offer')
    .setDescription('Make a transfer offer for a player')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('The player to make an offer for')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The amount to offer (in currency)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleOfferCommand(interaction);
  }
};

// Arabic version - عرض command
const offerArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('عرض')
    .setDescription('تقديم عرض انتقال للاعب')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('اللاعب المراد تقديم عرض له')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('المبلغ المعروض (بالعملة)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleOfferCommand(interaction);
  }
};

// Handle offer command
async function handleOfferCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get command parameters
    const user = interaction.options.getUser('player');
    const amount = interaction.options.getInteger('amount');
    
    if (!user || amount === null) {
      await interaction.editReply({ content: 'يجب تحديد اللاعب والمبلغ المعروض.' });
      return;
    }
    
    if (amount < 0) {
      await interaction.editReply({ content: 'يجب أن يكون المبلغ المعروض موجباً.' });
      return;
    }
    
    // Check if the user is a coach
    const member = interaction.member;
    if (!member || !('roles' in member)) {
      await interaction.editReply({ content: 'فشل في التحقق من صلاحياتك.' });
      return;
    }
    
    // Find all coach assignments for this member
    const coachAssignments = await storage.getCoachAssignmentsByUser(serverId, interaction.user.id);
    if (coachAssignments.length === 0) {
      await interaction.editReply({ content: 'يجب أن تكون مدرباً لفريق لاستخدام هذا الأمر.' });
      return;
    }
    
    // Get the team for the first coach assignment
    const sourceTeamId = coachAssignments[0].teamId;
    const sourceTeam = await storage.getTeam(sourceTeamId);
    
    if (!sourceTeam) {
      await interaction.editReply({ content: 'لم يتم العثور على الفريق المرتبط بك.' });
      return;
    }
    
    // Check if the team has enough currency
    if ((sourceTeam.currency || 0) < amount) {
      await interaction.editReply({ 
        content: `لا يملك فريقك أموالاً كافية لتقديم هذا العرض. رصيدك الحالي: ${sourceTeam.currency || 0} عملة` 
      });
      return;
    }
    
    // Check if player exists and is on a team
    const player = await storage.getPlayerByUserId(serverId, user.id);
    if (!player) {
      await interaction.editReply({ content: `${user} ليس لاعباً مسجلاً في الدوري.` });
      return;
    }
    
    // Cannot make offers for players on your own team
    if (player.teamId === sourceTeamId) {
      await interaction.editReply({ content: `${user} هو لاعب في فريقك بالفعل.` });
      return;
    }
    
    // Get the player's current team
    const targetTeam = player.teamId ? await storage.getTeam(player.teamId) : null;
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      serverId,
      transactionType: 'offer',
      amount,
      status: 'pending',
      sourceTeamId: sourceTeam.id,
      targetTeamId: player.teamId || null,
      playerId: player.id,
      reason: `${interaction.user.username} من ${sourceTeam.name} قدم عرضاً لـ ${user.username}${targetTeam ? ` من ${targetTeam.name}` : ''}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Get coach username for display
    const coachUsername = `<@${interaction.user.id}>`;
    
    // Create the offer embed
    const offerDescription = targetTeam 
      ? `${sourceTeam.emoji} ${sourceTeam.name} has made an offer for <@${player.userId}> from ${targetTeam.emoji} ${targetTeam.name}`
      : `${sourceTeam.emoji} ${sourceTeam.name} has made an offer for <@${player.userId}>`;
    
    const embed = createTransactionEmbed(
      'offer',
      amount,
      offerDescription,
      sourceTeam,
      targetTeam || undefined,
      player,
      coachUsername
    );
    
    // Add action buttons
    const actionButtons = createTransactionActionButtons(transaction.id);
    
    // Send to transactions channel if configured
    const channels = await storage.getChannels(serverId);
    let messageSent = false;
    
    if (channels && channels.transactions) {
      try {
        const transactionsChannel = await findChannel(client, serverId, channels.transactions);
        
        if (transactionsChannel && transactionsChannel.type === 0) { // TextChannel
          const textChannel = transactionsChannel as TextChannel;
          await textChannel.send({ embeds: [embed], components: [actionButtons] });
          messageSent = true;
        }
      } catch (error) {
        console.error('Error sending to transactions channel:', error);
      }
    }
    
    // If not sent to a specific channel, just send as a reply
    if (!messageSent) {
      await interaction.channel?.send({ embeds: [embed], components: [actionButtons] });
    }
    
    // Confirm to the user
    await interaction.editReply({ 
      content: `تم تقديم عرض بمبلغ ${amount} لـ ${user.username}. بانتظار الموافقة من المدرب المسؤول.`
    });
    
    // Notify the target team's coach if possible
    if (targetTeam) {
      try {
        const targetCoachAssignments = await storage.getCoachAssignmentsByTeam(targetTeam.id);
        for (const assignment of targetCoachAssignments) {
          const guild = interaction.guild;
          if (guild) {
            try {
              const targetCoachMember = await guild.members.fetch(assignment.userId);
              await targetCoachMember.send({ 
                content: `تم تقديم عرض من ${sourceTeam.name} لـ ${user.username} من فريقك. يرجى مراجعة قناة المعاملات للموافقة أو الرفض.`,
                embeds: [embed]
              });
            } catch (error) {
              console.error(`Failed to notify coach ${assignment.userId}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error notifying target coaches:', error);
      }
    }
    
  } catch (error) {
    console.error('Error handling offer command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر. الرجاء المحاولة مرة أخرى.' });
  }
}

export const offerCommands = [
  offerCommand,
  offerArabicCommand
];