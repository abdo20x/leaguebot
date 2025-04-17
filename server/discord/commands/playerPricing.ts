// Player pricing commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember,
  User,
  Role,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { storage } from "../../storage";
import { formatCurrency } from "../utils";

// Player pricing command
const playerPricingCommand = {
  data: new SlashCommandBuilder()
    .setName('playerpricing')
    .setDescription('Set and view player prices')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set price for a player')
        .addUserOption(option => 
          option.setName('player')
            .setDescription('The player to set price for')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('price')
            .setDescription('Price in coins')
            .setRequired(true)
            .setMinValue(1000000))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a player\'s price')
        .addUserOption(option => 
          option.setName('player')
            .setDescription('The player to view')
            .setRequired(true))
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'set') {
      await handleSetPlayerPrice(interaction);
    } else if (subcommand === 'view') {
      await handleViewPlayerPrice(interaction);
    }
  }
};

// Arabic command - تحديد اسعار الاعبين
const playerPricingArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('تحديد_اسعار')
    .setDescription('تحديد وعرض أسعار اللاعبين')
    .addSubcommandGroup(group =>
      group
        .setName('لاعب')
        .setDescription('تحديد سعر لاعب معين')
        .addSubcommand(subcommand =>
          subcommand
            .setName('تحديد')
            .setDescription('تحديد سعر لاعب')
            .addUserOption(option => 
              option.setName('اللاعب')
                .setDescription('اللاعب المراد تحديد سعره')
                .setRequired(true))
            .addIntegerOption(option => 
              option.setName('السعر')
                .setDescription('السعر بالعملات')
                .setRequired(true)
                .setMinValue(1000000))
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('عرض')
        .setDescription('عرض سعر لاعب')
        .addUserOption(option => 
          option.setName('اللاعب')
            .setDescription('اللاعب المراد عرض سعره')
            .setRequired(true))
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'تحديد') {
      await handleSetPlayerPrice(interaction);
    } else if (subcommand === 'عرض') {
      await handleViewPlayerPrice(interaction);
    }
  }
};

// Handler for setting player price
async function handleSetPlayerPrice(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  // Check if the user has permission (is admin or coach)
  const member = interaction.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    // Check if user has a coach role
    const coaches = await storage.getCoaches(serverId);
    const coachRoles = coaches.map(coach => coach.roleId);
    
    const hasCoachRole = member.roles.cache.some(role => coachRoles.includes(role.id));
    
    if (!hasCoachRole) {
      await interaction.editReply({ content: 'ليس لديك صلاحية لتحديد أسعار اللاعبين. يجب أن تكون مسؤولاً أو مدرباً.' });
      return;
    }
  }
  
  // Get the player and price from options
  const targetUser = interaction.options.getUser('player') || interaction.options.getUser('اللاعب');
  const price = interaction.options.getInteger('price') || interaction.options.getInteger('السعر');
  
  if (!targetUser || !price) {
    await interaction.editReply({ content: 'يرجى تحديد اللاعب والسعر.' });
    return;
  }
  
  try {
    // Check if the user is a player in the system
    let player = await storage.getPlayerByUserId(serverId, targetUser.id);
    
    if (!player) {
      // If not, create a new player entry
      player = await storage.createPlayer({
        serverId,
        userId: targetUser.id,
        username: targetUser.username,
        price: price,
        createdAt: new Date()
      });
      
      await interaction.editReply({ 
        content: `تم تسجيل اللاعب ${targetUser} وتحديد سعره بـ ${formatCurrency(price)} عملة.` 
      });
    } else {
      // Update existing player
      player = await storage.updatePlayer(player.id, {
        price: price,
        updatedAt: new Date()
      });
      
      await interaction.editReply({ 
        content: `تم تحديث سعر اللاعب ${targetUser} إلى ${formatCurrency(price)} عملة.` 
      });
    }
    
    // Create a rich embed with player details
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`تحديث سعر اللاعب`)
      .setDescription(`تم تحديد سعر اللاعب ${targetUser} بنجاح`)
      .addFields(
        { name: 'اللاعب', value: `${targetUser}`, inline: true },
        { name: 'السعر الجديد', value: formatCurrency(price), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Win Lock Bot' });
    
    // Update the reply with the embed
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error setting player price:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء تحديد سعر اللاعب. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handler for viewing player price
async function handleViewPlayerPrice(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  // Get the player from options
  const targetUser = interaction.options.getUser('player') || interaction.options.getUser('اللاعب');
  
  if (!targetUser) {
    await interaction.editReply({ content: 'يرجى تحديد اللاعب.' });
    return;
  }
  
  try {
    // Get the player from storage
    const player = await storage.getPlayerByUserId(serverId, targetUser.id);
    
    if (!player) {
      await interaction.editReply({ 
        content: `اللاعب ${targetUser} غير مسجل في النظام أو لم يتم تحديد سعر له.` 
      });
      return;
    }
    
    // Get the player's team if any
    let teamInfo = "لاعب حر";
    if (player.teamId) {
      const team = await storage.getTeam(player.teamId);
      if (team) {
        teamInfo = `${team.emoji} ${team.name}`;
      }
    }
    
    // Create a rich embed with player details
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle(`معلومات اللاعب`)
      .setDescription(`تفاصيل اللاعب ${targetUser}`)
      .addFields(
        { name: 'اللاعب', value: `${targetUser}`, inline: true },
        { name: 'السعر', value: player.price ? formatCurrency(player.price) : 'غير محدد', inline: true },
        { name: 'الفريق', value: teamInfo, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Win Lock Bot' });
    
    // Add thumbnail if user has avatar
    if (targetUser.avatarURL()) {
      embed.setThumbnail(targetUser.avatarURL() || '');
    }
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error viewing player price:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء عرض سعر اللاعب. الرجاء المحاولة مرة أخرى.' });
  }
}

export const playerPricingCommands = [
  playerPricingCommand,
  playerPricingArabicCommand
];