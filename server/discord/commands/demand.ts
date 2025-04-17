// Demand commands - طلب for signing or releasing players
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  GuildMember,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  User,
  Role,
  ChannelType
} from "discord.js";
import { storage } from "../../storage";
import { createBaseEmbed, createTransactionEmbed } from "../embeds";
import { findChannel, getTeamByRoleId } from "../utils";

// Demand command - for requesting to sign or release
const demandCommand = {
  data: new SlashCommandBuilder()
    .setName('demand')
    .setDescription('Request to sign with a team or release from your current team')
    .addSubcommand(subcommand =>
      subcommand
        .setName('sign')
        .setDescription('Request to sign with a team')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('release')
        .setDescription('Request to be released from your current team')
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'sign') {
      await handleSignRequest(interaction);
    } else if (subcommand === 'release') {
      await handleReleaseRequest(interaction);
    }
  }
};

// Arabic version - طلب command (simplified, no subcommands)
const demandArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('طلب')
    .setDescription('طلب انضمام لفريق أو مغادرة فريقك الحالي')
    .addStringOption(option =>
      option.setName('نوع')
        .setDescription('نوع الطلب')
        .setRequired(true)
        .addChoices(
          { name: 'انضمام', value: 'انضمام' },
          { name: 'مغادرة', value: 'مغادرة' }
        )
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const requestType = interaction.options.getString('نوع');
    
    if (requestType === 'انضمام') {
      await handleSignRequest(interaction);
    } else if (requestType === 'مغادرة') {
      await handleReleaseRequest(interaction);
    }
  }
};

// Handle signing request
async function handleSignRequest(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  const user = interaction.user;
  const member = interaction.member as GuildMember;
  
  // Check if user already has a team
  const player = await storage.getPlayerByUserId(serverId, user.id);
  if (player && player.teamId) {
    const team = await storage.getTeam(player.teamId);
    await interaction.editReply({ 
      content: `أنت بالفعل عضو في فريق ${team?.name}. إذا كنت ترغب في الانتقال، يرجى استخدام أمر /طلب مغادرة أولاً.` 
    });
    return;
  }
  
  try {
    // Get all teams in the server
    const teams = await storage.getTeams(serverId);
    
    // Create embed for team selection
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📝 طلب انضمام لفريق')
      .setDescription('الرجاء اختيار الفريق الذي ترغب في الانضمام إليه:')
      .setFooter({ text: 'Win Lock Bot • نظام الانتقالات' });
    
    // Create select menu with available teams
    // Filter out full teams
    const availableTeams = teams.filter(team => (team.rosterCount || 0) < (team.rosterMax || 30));
    
    const options: StringSelectMenuOptionBuilder[] = availableTeams.map(team => 
      new StringSelectMenuOptionBuilder()
        .setLabel(`${team.name}`)
        .setValue(`${team.id}`)
        .setEmoji(team.emoji)
        .setDescription(`Roster: ${team.rosterCount || 0}/${team.rosterMax || 30}`)
    );
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('sign_team_select')
          .setPlaceholder('اختر الفريق')
          .addOptions(options)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error('Error handling sign request:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle release request
async function handleReleaseRequest(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  const user = interaction.user;
  const member = interaction.member as GuildMember;
  
  // Check if user has a team
  const player = await storage.getPlayerByUserId(serverId, user.id);
  if (!player || !player.teamId) {
    await interaction.editReply({ 
      content: 'أنت لست عضواً في أي فريق حالياً. لا يمكنك طلب المغادرة.' 
    });
    return;
  }
  
  try {
    // Get team info
    const team = await storage.getTeam(player.teamId);
    if (!team) {
      await interaction.editReply({ content: 'لم يتم العثور على معلومات الفريق.' });
      return;
    }
    
    // Get channels
    const channels = await storage.getChannels(serverId);
    if (!channels || !channels.transactions) {
      await interaction.editReply({ content: 'لم يتم إعداد قناة المعاملات في السيرفر. يرجى التواصل مع الإدارة.' });
      return;
    }
    
    // Create smaller, compact embed for release request
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setAuthor({ 
        name: `طلب مغادرة من ${user.username}`,
        iconURL: user.displayAvatarURL()
      })
      .setDescription(`${user} يطلب المغادرة من فريق ${team.emoji} ${team.name}`)
      .setFooter({ text: 'Win Lock Bot' });
    
    // Get transaction channel
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: 'خطأ في الحصول على معلومات السيرفر.' });
      return;
    }
    
    const transactionChannel = await findChannel(guild, channels.transactions);
    if (!transactionChannel || transactionChannel.type !== ChannelType.GuildText) {
      await interaction.editReply({ content: 'لم يتم العثور على قناة المعاملات.' });
      return;
    }
    
    // Find captain role for the team
    const captainRole = guild.roles.cache.find(role => 
      role.name.toLowerCase().includes('captain') && 
      role.name.toLowerCase().includes(team.name.toLowerCase())
    );
    
    // Send to transaction channel
    const message = {
      content: captainRole ? `<@&${captainRole.id}>` : undefined,
      embeds: [embed]
    };
    
    await (transactionChannel as TextChannel).send(message);
    
    // Create transaction record
    await storage.createTransaction({
      serverId,
      transactionType: 'release_request',
      playerId: player.id,
      sourceTeamId: team.id,
      status: 'pending',
      reason: 'Player requested release'
    });
    
    // Confirm to user with simpler message
    await interaction.editReply({ 
      content: `✅ تم إرسال طلب المغادرة من فريق ${team.emoji} ${team.name}. تم إشعار الكابتن.`
    });
  } catch (error) {
    console.error('Error handling release request:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى.' });
  }
}

// Process team selection for signing
async function processTeamSelection(
  user: User, 
  serverId: string, 
  teamId: number
): Promise<void> {
  try {
    // Get team info
    const team = await storage.getTeam(teamId);
    if (!team) {
      await user.send('لم يتم العثور على معلومات الفريق.');
      return;
    }
    
    // Check roster capacity
    if ((team.rosterCount || 0) >= (team.rosterMax || 30)) {
      await user.send(`فريق ${team.emoji} ${team.name} مكتمل. يرجى التكلم مع كابتن الفريق.`);
      return;
    }
    
    // Get channels
    const channels = await storage.getChannels(serverId);
    if (!channels || !channels.transactions) {
      await user.send('لم يتم إعداد قناة المعاملات في السيرفر. يرجى التواصل مع الإدارة.');
      return;
    }
    
    // Get guild
    const guild = await user.client.guilds.fetch(serverId);
    
    // Find captain role for the team
    const captainRole = guild.roles.cache.find(role => 
      role.name.toLowerCase().includes('captain') && 
      role.name.toLowerCase().includes(team.name.toLowerCase())
    );
    
    // Create compact embed for sign request
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setAuthor({ 
        name: `طلب انضمام من ${user.username}`,
        iconURL: user.displayAvatarURL()
      })
      .setDescription(`${user} يطلب الانضمام إلى فريق ${team.emoji} ${team.name}`)
      .setFooter({ text: 'Win Lock Bot' });
    
    // Get transaction channel
    const transactionChannel = await findChannel(guild, channels.transactions);
    if (!transactionChannel || transactionChannel.type !== ChannelType.GuildText) {
      await user.send('لم يتم العثور على قناة المعاملات.');
      return;
    }
    
    // Send to transaction channel
    const message = {
      content: captainRole ? `<@&${captainRole.id}>` : undefined,
      embeds: [embed]
    };
    
    await (transactionChannel as TextChannel).send(message);
    
    // Create or get player
    let player = await storage.getPlayerByUserId(serverId, user.id);
    if (!player) {
      player = await storage.createPlayer({
        serverId,
        userId: user.id,
        username: user.username,
        joinedAt: new Date()
      });
    }
    
    // Create transaction record
    await storage.createTransaction({
      serverId,
      transactionType: 'sign_request',
      playerId: player.id,
      targetTeamId: team.id,
      status: 'pending',
      reason: 'Player requested signing'
    });
    
    // Confirm to user with simpler message
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ تم إرسال طلب الانضمام')
          .setDescription(`تم إرسال طلبك إلى فريق ${team.emoji} ${team.name}. تم إشعار الكابتن.`)
      ]
    });
  } catch (error) {
    console.error('Error processing team selection:', error);
    await user.send('حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى.');
  }
}

export const demandCommands = [
  demandCommand,
  demandArabicCommand
];