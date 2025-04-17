// Transfer Offer commands - عرض_شراء command for purchases
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  GuildMember,
  User,
  ChannelType
} from "discord.js";
import { storage } from "../../storage";
import { formatCurrency, findChannel } from "../utils";

// Transfer offer command
const transferOfferCommand = {
  data: new SlashCommandBuilder()
    .setName('transfer_offer')
    .setDescription('Send a transfer offer to a player')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('The player to offer a transfer to')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('team')
        .setDescription('Your team role')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('The transfer fee to offer')
        .setRequired(true)),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleTransferOffer(interaction);
  }
};

// Arabic version - عرض_شراء command
const transferOfferArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('عرض_شراء')
    .setDescription('إرسال عرض انتقال إلى لاعب')
    .addUserOption(option => 
      option.setName('اللاعب')
        .setDescription('اللاعب الذي تريد إرسال عرض له')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('الفريق')
        .setDescription('رول الفريق الخاص بك')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('المبلغ')
        .setDescription('قيمة عرض الانتقال')
        .setRequired(true)),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Create modified interaction with mapped options
    const targetPlayer = interaction.options.getUser('اللاعب');
    const teamRole = interaction.options.getRole('الفريق');
    const amount = interaction.options.getInteger('المبلغ');
    
    const modifiedInteraction = {
      ...interaction,
      options: {
        ...interaction.options,
        getUser: (name: string) => name === 'player' ? targetPlayer : null,
        getRole: (name: string) => name === 'team' ? teamRole : null,
        getInteger: (name: string) => name === 'amount' ? amount : null
      }
    } as ChatInputCommandInteraction;
    
    await handleTransferOffer(modifiedInteraction);
  }
};

// Handle transfer offer creation
async function handleTransferOffer(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  const targetPlayer = interaction.options.getUser('player');
  const teamRole = interaction.options.getRole('team');
  const amount = interaction.options.getInteger('amount');
  
  if (!targetPlayer || !teamRole || !amount) {
    await interaction.editReply({ content: 'جميع الخيارات مطلوبة: اللاعب، الفريق، والمبلغ.' });
    return;
  }
  
  // Check if user is captain or authorized
  const member = interaction.member as GuildMember;
  const isCaptain = member.roles.cache.some(role => 
    role.name.toLowerCase().includes('captain') &&
    role.name.toLowerCase().includes(teamRole.name.toLowerCase())
  );
  
  const isManager = member.permissions.has('ManageRoles');
  
  if (!isCaptain && !isManager) {
    await interaction.editReply({ 
      content: 'يجب أن تكون كابتن الفريق أو مدير لإرسال عروض الانتقال.' 
    });
    return;
  }
  
  try {
    // Get source team
    const sourceTeam = await storage.getTeamByRoleId(serverId, teamRole.id);
    if (!sourceTeam) {
      await interaction.editReply({ content: 'لم يتم العثور على معلومات الفريق المرسل.' });
      return;
    }
    
    // Check if team has enough currency
    if ((sourceTeam.currency || 0) < amount) {
      await interaction.editReply({ 
        content: `فريق ${sourceTeam.emoji} ${sourceTeam.name} لا يملك رصيد كافٍ. الرصيد الحالي: ${formatCurrency(sourceTeam.currency || 0)}`
      });
      return;
    }
    
    // Check if target is already in a team
    const targetPlayerData = await storage.getPlayerByUserId(serverId, targetPlayer.id);
    if (!targetPlayerData) {
      await interaction.editReply({ content: 'هذا اللاعب غير مسجل في النظام بعد.' });
      return;
    }
    
    let targetTeam;
    if (targetPlayerData.teamId) {
      targetTeam = await storage.getTeam(targetPlayerData.teamId);
      if (!targetTeam) {
        await interaction.editReply({ content: 'لم يتم العثور على معلومات فريق اللاعب الهدف.' });
        return;
      }
    }
    
    // Create transfer offer embed for DM
    const offerEmbed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`${sourceTeam.emoji} ${sourceTeam.name} - عرض انتقال`)
      .setDescription(`عرض انضمام 💰`)
      .addFields(
        { name: '• الفريق المقدم للعرض', value: `${sourceTeam.emoji} ${sourceTeam.name}`, inline: false },
        { name: 'المبلغ المعروض', value: `${formatCurrency(amount)}`, inline: false }
      )
      .setFooter({ text: 'Win Lock Bot • نظام الانتقالات • يرجى قبول أو رفض العرض باستخدام الأزرار أدناه' });
    
    // Add current team if applicable
    if (targetTeam) {
      offerEmbed.addFields(
        { name: 'الفريق الحالي', value: `${targetTeam.emoji} ${targetTeam.name}`, inline: false }
      );
    }
    
    // Create buttons for accept/reject
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_offer_${sourceTeam.id}_${amount}`)
          .setLabel('قبول العرض')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_offer_${sourceTeam.id}_${amount}`)
          .setLabel('رفض العرض')
          .setStyle(ButtonStyle.Danger)
      );
    
    // Send offer to player DM
    try {
      await targetPlayer.send({ embeds: [offerEmbed], components: [buttons] });
    } catch (error) {
      await interaction.editReply({ 
        content: 'تعذر إرسال العرض للاعب. تأكد من أن اللاعب يقبل الرسائل المباشرة.'
      });
      return;
    }
    
    // Record transaction
    await storage.createTransaction({
      serverId,
      transactionType: 'transfer_offer',
      sourceTeamId: sourceTeam.id,
      playerId: targetPlayerData.id,
      amount,
      status: 'pending',
      approvedBy: interaction.user.id,
      reason: 'Transfer offer'
    });
    
    // Notify transaction channel
    const channels = await storage.getChannels(serverId);
    if (channels?.transactions) {
      const guild = interaction.guild;
      if (guild) {
        const transactionChannel = await findChannel(guild, channels.transactions);
        if (transactionChannel && transactionChannel.type === ChannelType.GuildText) {
          // Create transaction notification embed
          const transactionEmbed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('🔄 عرض انتقال جديد')
            .setDescription(`${sourceTeam.emoji} ${sourceTeam.name} قدم عرض انتقال للاعب ${targetPlayer}`)
            .addFields(
              { name: 'المبلغ المعروض', value: formatCurrency(amount), inline: true },
              { name: 'الحالة', value: 'في انتظار رد اللاعب', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Win Lock Bot • نظام الانتقالات' });
          
          if (targetTeam) {
            transactionEmbed.addFields(
              { name: 'الفريق الحالي', value: `${targetTeam.emoji} ${targetTeam.name}`, inline: true }
            );
          }
          
          await (transactionChannel as TextChannel).send({ embeds: [transactionEmbed] });
        }
      }
    }
    
    // Confirm to user
    await interaction.editReply({ 
      content: `تم إرسال عرض الانتقال بنجاح إلى ${targetPlayer} بقيمة ${formatCurrency(amount)}.`
    });
  } catch (error) {
    console.error('Error processing transfer offer:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة عرض الانتقال. الرجاء المحاولة مرة أخرى.' });
  }
}

// Process offer response (handle button clicks)
async function processOfferResponse(
  user: User,
  serverId: string,
  teamId: number,
  amount: number,
  accept: boolean
): Promise<void> {
  try {
    // Get player data
    const player = await storage.getPlayerByUserId(serverId, user.id);
    if (!player) {
      await user.send('لم يتم العثور على بيانات اللاعب.');
      return;
    }
    
    // Get team data
    const sourceTeam = await storage.getTeam(teamId);
    if (!sourceTeam) {
      await user.send('لم يتم العثور على معلومات الفريق المقدم للعرض.');
      return;
    }
    
    // Get current team if applicable
    let currentTeam;
    if (player.teamId) {
      currentTeam = await storage.getTeam(player.teamId);
    }
    
    // Get pending transaction
    const pendingTransactions = await storage.getPendingTransactions(serverId);
    const transaction = pendingTransactions.find(t => 
      t.sourceTeamId === teamId && 
      t.playerId === player.id && 
      t.amount === amount &&
      t.transactionType === 'transfer_offer'
    );
    
    if (!transaction) {
      await user.send('لم يتم العثور على عرض الانتقال المعني. قد يكون العرض منتهي الصلاحية أو تم إلغاؤه.');
      return;
    }
    
    const guild = await user.client.guilds.fetch(serverId);
    
    // Handle accept/reject
    if (accept) {
      // Check if source team still has enough currency
      if ((sourceTeam.currency || 0) < amount) {
        await user.send(`عذراً، ${sourceTeam.emoji} ${sourceTeam.name} لم يعد لديه رصيد كافٍ لإتمام الصفقة.`);
        
        // Update transaction to failed
        await storage.updateTransaction(transaction.id, {
          status: 'failed',
          reason: 'Insufficient funds'
        });
        
        return;
      }
      
      // Process the transfer
      // 1. Update source team currency
      await storage.updateTeam(sourceTeam.id, {
        currency: (sourceTeam.currency || 0) - amount
      });
      
      // 2. Update target team currency if applicable
      if (currentTeam) {
        await storage.updateTeam(currentTeam.id, {
          currency: (currentTeam.currency || 0) + amount,
          rosterCount: ((currentTeam.rosterCount || 0) - 1)
        });
      }
      
      // 3. Update the player's team
      await storage.updatePlayer(player.id, {
        teamId: sourceTeam.id
      });
      
      // 4. Update source team roster count
      await storage.updateTeam(sourceTeam.id, {
        rosterCount: ((sourceTeam.rosterCount || 0) + 1)
      });
      
      // 5. Update transaction status
      await storage.updateTransaction(transaction.id, {
        status: 'approved',
        reason: 'Player accepted the offer'
      });
      
      // Attempt to update roles if in guild
      try {
        const guildMember = await guild.members.fetch(user.id);
        if (guildMember) {
          // Remove old team role if applicable
          if (currentTeam) {
            const currentRole = guild.roles.cache.get(currentTeam.roleId);
            if (currentRole) {
              await guildMember.roles.remove(currentRole);
            }
          }
          
          // Add new team role
          const newRole = guild.roles.cache.get(sourceTeam.roleId);
          if (newRole) {
            await guildMember.roles.add(newRole);
          }
        }
      } catch (roleError) {
        console.error('Error updating roles:', roleError);
        // Continue with the transfer even if role update fails
      }
      
      // Send confirmation to player
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ تم قبول عرض الانتقال')
            .setDescription(`لقد انتقلت بنجاح إلى فريق ${sourceTeam.emoji} ${sourceTeam.name} مقابل ${formatCurrency(amount)}.`)
            .setTimestamp()
            .setFooter({ text: 'Win Lock Bot • نظام الانتقالات' })
        ]
      });
      
      // Notify transaction channel
      const channels = await storage.getChannels(serverId);
      if (channels?.transactions) {
        const transactionChannel = await findChannel(guild, channels.transactions);
        if (transactionChannel && transactionChannel.type === ChannelType.GuildText) {
          // Create transaction completion embed
          const completionEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ اكتمال عملية الانتقال')
            .setDescription(`${user} قد انضم إلى فريق ${sourceTeam.emoji} ${sourceTeam.name}`)
            .addFields(
              { name: 'قيمة الانتقال', value: formatCurrency(amount), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Win Lock Bot • نظام الانتقالات' });
          
          if (currentTeam) {
            completionEmbed.addFields(
              { name: 'الفريق السابق', value: `${currentTeam.emoji} ${currentTeam.name}`, inline: true }
            );
          }
          
          await (transactionChannel as TextChannel).send({ embeds: [completionEmbed] });
        }
      }
    } else {
      // Reject the offer
      await storage.updateTransaction(transaction.id, {
        status: 'rejected',
        reason: 'Player rejected the offer'
      });
      
      // Send rejection confirmation to player
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ تم رفض عرض الانتقال')
            .setDescription(`لقد رفضت عرض الانتقال من فريق ${sourceTeam.emoji} ${sourceTeam.name} بقيمة ${formatCurrency(amount)}.`)
            .setTimestamp()
            .setFooter({ text: 'Win Lock Bot • نظام الانتقالات' })
        ]
      });
      
      // Notify transaction channel
      const channels = await storage.getChannels(serverId);
      if (channels?.transactions) {
        const transactionChannel = await findChannel(guild, channels.transactions);
        if (transactionChannel && transactionChannel.type === ChannelType.GuildText) {
          // Create rejection notification embed
          const rejectionEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ رفض عرض الانتقال')
            .setDescription(`${user} رفض عرض الانتقال من فريق ${sourceTeam.emoji} ${sourceTeam.name}`)
            .addFields(
              { name: 'قيمة العرض', value: formatCurrency(amount), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Win Lock Bot • نظام الانتقالات' });
          
          await (transactionChannel as TextChannel).send({ embeds: [rejectionEmbed] });
        }
      }
    }
  } catch (error) {
    console.error('Error processing offer response:', error);
    await user.send('حدث خطأ أثناء معالجة ردك على عرض الانتقال. الرجاء التواصل مع الإدارة.');
  }
}

export const transferOfferCommands = [
  transferOfferCommand,
  transferOfferArabicCommand
];