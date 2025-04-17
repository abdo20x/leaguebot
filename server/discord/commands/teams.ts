import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  Role
} from "discord.js";
import { storage } from "../../storage";
import { isValidEmoji } from "../utils";

// Teams add command
const teamsAddCommand = {
  data: new SlashCommandBuilder()
    .setName('teams')
    .setDescription('Manage teams in the league')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new team')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The team role')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('emoji')
            .setDescription('The team emoji')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all teams'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a team')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The team role to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit a team')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The team role to edit')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('emoji')
            .setDescription('The new team emoji')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'add':
        await handleTeamsAddCommand(interaction);
        break;
      case 'view':
        await handleTeamsViewCommand(interaction);
        break;
      case 'remove':
        await handleTeamsRemoveCommand(interaction);
        break;
      case 'edit':
        await handleTeamsEditCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
    }
  }
};

// Arabic version - فرق command
const teamsArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('فرق')
    .setDescription('إدارة الفرق في الدوري')
    .addSubcommand(subcommand =>
      subcommand
        .setName('اضافة')
        .setDescription('إضافة فريق جديد')
        .addRoleOption(option => 
          option.setName('رتبة')
            .setDescription('رتبة الفريق')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('رمز')
            .setDescription('رمز تعبيري للفريق')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('عرض')
        .setDescription('عرض جميع الفرق'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('حذف')
        .setDescription('حذف فريق')
        .addRoleOption(option => 
          option.setName('رتبة')
            .setDescription('رتبة الفريق المراد حذفها')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('تعديل')
        .setDescription('تعديل فريق')
        .addRoleOption(option => 
          option.setName('رتبة')
            .setDescription('رتبة الفريق المراد تعديلها')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('رمز')
            .setDescription('الرمز التعبيري الجديد للفريق')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'اضافة':
        await handleTeamsAddCommand(interaction);
        break;
      case 'عرض':
        await handleTeamsViewCommand(interaction);
        break;
      case 'حذف':
        await handleTeamsRemoveCommand(interaction);
        break;
      case 'تعديل':
        await handleTeamsEditCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'أمر فرعي غير معروف', ephemeral: true });
    }
  }
};

// Handle teams add command
async function handleTeamsAddCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the options
    const role = interaction.options.getRole('role') || interaction.options.getRole('رتبة');
    const emoji = interaction.options.getString('emoji') || interaction.options.getString('رمز');
    
    if (!role || !emoji) {
      await interaction.editReply({ content: 'يجب تحديد الرتبة والرمز التعبيري للفريق.' });
      return;
    }
    
    // Validate emoji
    if (!isValidEmoji(emoji)) {
      await interaction.editReply({ content: 'الرمز التعبيري غير صالح. يرجى استخدام رمز تعبيري قياسي.' });
      return;
    }
    
    // Check if team with this role already exists
    const existingTeam = await storage.getTeamByRoleId(serverId, role.id);
    if (existingTeam) {
      await interaction.editReply({ content: `يوجد بالفعل فريق يستخدم هذه الرتبة: ${role.name}` });
      return;
    }
    
    // Check if team with this emoji already exists
    const existingEmojiTeam = await storage.getTeamByEmoji(serverId, emoji);
    if (existingEmojiTeam) {
      await interaction.editReply({ content: `يوجد بالفعل فريق يستخدم هذا الرمز التعبيري: ${emoji}` });
      return;
    }
    
    // Create team
    const team = await storage.createTeam({
      serverId,
      teamId: `${serverId}-${role.id}`,
      name: role.name,
      emoji: emoji,
      roleId: role.id,
      currency: 50000000, // Default 50M currency
      rosterCount: 0,
      rosterMax: 22,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('تم إنشاء فريق جديد')
      .setDescription(`تم إنشاء فريق ${emoji} ${role.name} بنجاح.`)
      .addFields(
        { name: 'الرتبة', value: `<@&${role.id}>` },
        { name: 'الرمز التعبيري', value: emoji }
      );
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling teams add command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء الفريق. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle teams view command
async function handleTeamsViewCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get all teams
    const teams = await storage.getTeams(serverId);
    
    if (teams.length === 0) {
      await interaction.editReply({ content: 'لا توجد فرق مسجلة في هذا السيرفر.' });
      return;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('قائمة الفرق')
      .setDescription('جميع الفرق المسجلة في الدوري:');
    
    // Add teams to embed
    teams.forEach(team => {
      embed.addFields({
        name: `${team.emoji} ${team.name}`,
        value: `الرتبة: <@&${team.roleId}>\nاللاعبين: ${team.rosterCount || 0}/${team.rosterMax || 22}\nالرصيد: ${team.currency?.toLocaleString() || '0'}`
      });
    });
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling teams view command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء عرض الفرق. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle teams remove command
async function handleTeamsRemoveCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the role
    const role = interaction.options.getRole('role') || interaction.options.getRole('رتبة');
    
    if (!role) {
      await interaction.editReply({ content: 'يجب تحديد رتبة الفريق المراد حذفه.' });
      return;
    }
    
    // Check if team exists
    const team = await storage.getTeamByRoleId(serverId, role.id);
    if (!team) {
      await interaction.editReply({ content: `لا يوجد فريق يستخدم هذه الرتبة: ${role.name}` });
      return;
    }
    
    // Confirm deletion
    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_team_delete_${team.id}`)
          .setLabel('تأكيد الحذف')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_team_delete_${team.id}`)
          .setLabel('إلغاء')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('تأكيد حذف الفريق')
      .setDescription(`هل أنت متأكد من أنك تريد حذف فريق ${team.emoji} ${team.name}؟`)
      .addFields(
        { name: 'الرتبة', value: `<@&${role.id}>` },
        { name: 'الرمز التعبيري', value: team.emoji },
        { name: 'تحذير', value: 'سيتم حذف جميع البيانات المرتبطة بهذا الفريق، بما في ذلك اللاعبين والمعاملات.' }
      );
    
    const message = await interaction.editReply({ 
      embeds: [embed],
      components: [confirmRow]
    });
    
    // Set up collector for buttons
    const filter = (i: any) => {
      return i.user.id === interaction.user.id && 
        (i.customId === `confirm_team_delete_${team.id}` || 
         i.customId === `cancel_team_delete_${team.id}`);
    };
    
    const collector = message.createMessageComponentCollector({ 
      filter, 
      time: 30000,
      max: 1
    });
    
    collector.on('collect', async i => {
      if (i.customId === `confirm_team_delete_${team.id}`) {
        try {
          // Delete all players in the team
          const players = await storage.getPlayersByTeam(team.id);
          for (const player of players) {
            await storage.deletePlayer(player.id);
          }
          
          // Delete the team
          await storage.deleteTeam(team.id);
          
          const successEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('تم حذف الفريق')
            .setDescription(`تم حذف فريق ${team.emoji} ${team.name} بنجاح.`);
          
          await i.update({ 
            embeds: [successEmbed],
            components: []
          });
        } catch (error) {
          console.error('Error deleting team:', error);
          await i.update({ 
            content: 'حدث خطأ أثناء حذف الفريق. الرجاء المحاولة مرة أخرى.',
            embeds: [],
            components: []
          });
        }
      } else {
        // Cancel
        await i.update({ 
          content: 'تم إلغاء حذف الفريق.',
          embeds: [],
          components: []
        });
      }
    });
    
    collector.on('end', async collected => {
      if (collected.size === 0) {
        // Timeout
        await interaction.editReply({ 
          content: 'انتهت مهلة تأكيد حذف الفريق.',
          embeds: [],
          components: []
        });
      }
    });
    
  } catch (error) {
    console.error('Error handling teams remove command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء حذف الفريق. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle teams edit command
async function handleTeamsEditCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the options
    const role = interaction.options.getRole('role') || interaction.options.getRole('رتبة');
    const emoji = interaction.options.getString('emoji') || interaction.options.getString('رمز');
    
    if (!role || !emoji) {
      await interaction.editReply({ content: 'يجب تحديد الرتبة والرمز التعبيري الجديد للفريق.' });
      return;
    }
    
    // Validate emoji
    if (!isValidEmoji(emoji)) {
      await interaction.editReply({ content: 'الرمز التعبيري غير صالح. يرجى استخدام رمز تعبيري قياسي.' });
      return;
    }
    
    // Check if team exists
    const team = await storage.getTeamByRoleId(serverId, role.id);
    if (!team) {
      await interaction.editReply({ content: `لا يوجد فريق يستخدم هذه الرتبة: ${role.name}` });
      return;
    }
    
    // Check if emoji is already used by another team
    if (emoji !== team.emoji) {
      const existingEmojiTeam = await storage.getTeamByEmoji(serverId, emoji);
      if (existingEmojiTeam && existingEmojiTeam.id !== team.id) {
        await interaction.editReply({ content: `يوجد بالفعل فريق يستخدم هذا الرمز التعبيري: ${emoji}` });
        return;
      }
    }
    
    // Update team
    const updatedTeam = await storage.updateTeam(team.id, {
      emoji: emoji,
      updatedAt: new Date()
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('تم تحديث الفريق')
      .setDescription(`تم تحديث فريق ${role.name} بنجاح.`)
      .addFields(
        { name: 'الرتبة', value: `<@&${role.id}>` },
        { name: 'الرمز التعبيري الجديد', value: emoji }
      );
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling teams edit command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء تحديث الفريق. الرجاء المحاولة مرة أخرى.' });
  }
}

export const teamsCommands = [
  teamsAddCommand,
  teamsArabicCommand
];