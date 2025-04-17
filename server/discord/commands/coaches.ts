import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  Role,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { storage } from "../../storage";

// Coaches add command
const coachesCommand = {
  data: new SlashCommandBuilder()
    .setName('coaches')
    .setDescription('Manage coaches in the league')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new coach role')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The coach role')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('shortcode')
            .setDescription('A short code for the coach (2-3 letters)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all coaches'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a coach role')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The coach role to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('assign')
        .setDescription('Assign a coach to a team')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to assign as coach')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('coach_role')
            .setDescription('The coach role to assign')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('team_role')
            .setDescription('The team role to assign the coach to')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'add':
        await handleCoachesAddCommand(interaction);
        break;
      case 'view':
        await handleCoachesViewCommand(interaction);
        break;
      case 'remove':
        await handleCoachesRemoveCommand(interaction);
        break;
      case 'assign':
        await handleCoachesAssignCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
    }
  }
};

// Arabic version - مدربين command
const coachesArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('مدربين')
    .setDescription('إدارة المدربين في الدوري')
    .addSubcommand(subcommand =>
      subcommand
        .setName('اضافة')
        .setDescription('إضافة رتبة مدرب جديدة')
        .addRoleOption(option => 
          option.setName('رتبة')
            .setDescription('رتبة المدرب')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('رمز_قصير')
            .setDescription('رمز قصير للمدرب (2-3 أحرف)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('عرض')
        .setDescription('عرض جميع المدربين'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('حذف')
        .setDescription('حذف رتبة مدرب')
        .addRoleOption(option => 
          option.setName('رتبة')
            .setDescription('رتبة المدرب المراد حذفها')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('تعيين')
        .setDescription('تعيين مدرب لفريق')
        .addUserOption(option => 
          option.setName('عضو')
            .setDescription('العضو المراد تعيينه كمدرب')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('رتبة_المدرب')
            .setDescription('رتبة المدرب المراد تعيينها')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('رتبة_الفريق')
            .setDescription('رتبة الفريق المراد تعيين المدرب له')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'اضافة':
        await handleCoachesAddCommand(interaction);
        break;
      case 'عرض':
        await handleCoachesViewCommand(interaction);
        break;
      case 'حذف':
        await handleCoachesRemoveCommand(interaction);
        break;
      case 'تعيين':
        await handleCoachesAssignCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'أمر فرعي غير معروف', ephemeral: true });
    }
  }
};

// Handle coaches add command
async function handleCoachesAddCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the options
    const role = interaction.options.getRole('role') || interaction.options.getRole('رتبة');
    const shortCode = interaction.options.getString('shortcode') || interaction.options.getString('رمز_قصير');
    
    if (!role || !shortCode) {
      await interaction.editReply({ content: 'يجب تحديد الرتبة والرمز القصير للمدرب.' });
      return;
    }
    
    // Validate short code (2-3 letters, only letters and numbers)
    if (!/^[a-zA-Z0-9]{2,3}$/.test(shortCode)) {
      await interaction.editReply({ content: 'الرمز القصير يجب أن يكون 2-3 أحرف فقط (حروف وأرقام فقط).' });
      return;
    }
    
    // Check if coach with this role already exists
    const existingCoach = await storage.getCoachByRoleId(serverId, role.id);
    if (existingCoach) {
      await interaction.editReply({ content: `يوجد بالفعل مدرب يستخدم هذه الرتبة: ${role.name}` });
      return;
    }
    
    // Check if coach with this short code already exists
    const existingShortCodeCoach = await storage.getCoachByShortCode(serverId, shortCode);
    if (existingShortCodeCoach) {
      await interaction.editReply({ content: `يوجد بالفعل مدرب يستخدم هذا الرمز القصير: ${shortCode}` });
      return;
    }
    
    // Create coach
    const coach = await storage.createCoach({
      serverId,
      shortCode: shortCode.toUpperCase(),
      roleId: role.id,
      roleName: role.name,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('تم إنشاء رتبة مدرب جديدة')
      .setDescription(`تم إنشاء رتبة مدرب ${role.name} بنجاح.`)
      .addFields(
        { name: 'الرتبة', value: `<@&${role.id}>` },
        { name: 'الرمز القصير', value: shortCode.toUpperCase() }
      );
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling coaches add command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء رتبة المدرب. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle coaches view command
async function handleCoachesViewCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get all coaches
    const coaches = await storage.getCoaches(serverId);
    
    if (coaches.length === 0) {
      await interaction.editReply({ content: 'لا توجد رتب مدربين مسجلة في هذا السيرفر.' });
      return;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('قائمة المدربين')
      .setDescription('جميع رتب المدربين المسجلة في الدوري:');
    
    // Add coaches to embed
    for (const coach of coaches) {
      // Get assignments for this coach
      const assignments = await storage.getCoachAssignmentsByCoach(coach.id);
      
      // Get team names
      let teamInfo = 'لا يوجد فريق';
      if (assignments.length > 0) {
        const teamPromises = assignments.map(assignment => storage.getTeam(assignment.teamId));
        const teams = await Promise.all(teamPromises);
        teamInfo = teams.map(team => team ? `${team.emoji} ${team.name}` : 'فريق غير معروف').join('\n');
      }
      
      // Add field to embed
      embed.addFields({
        name: `${coach.shortCode} - ${coach.roleName}`,
        value: `الرتبة: <@&${coach.roleId}>\nالفرق: ${teamInfo}`,
        inline: false
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling coaches view command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء عرض المدربين. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle coaches remove command
async function handleCoachesRemoveCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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
      await interaction.editReply({ content: 'يجب تحديد رتبة المدرب المراد حذفها.' });
      return;
    }
    
    // Check if coach exists
    const coach = await storage.getCoachByRoleId(serverId, role.id);
    if (!coach) {
      await interaction.editReply({ content: `لا يوجد مدرب يستخدم هذه الرتبة: ${role.name}` });
      return;
    }
    
    // Confirm deletion
    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_coach_delete_${coach.id}`)
          .setLabel('تأكيد الحذف')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_coach_delete_${coach.id}`)
          .setLabel('إلغاء')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('تأكيد حذف رتبة المدرب')
      .setDescription(`هل أنت متأكد من أنك تريد حذف رتبة المدرب ${coach.roleName}؟`)
      .addFields(
        { name: 'الرتبة', value: `<@&${role.id}>` },
        { name: 'الرمز القصير', value: coach.shortCode },
        { name: 'تحذير', value: 'سيتم حذف جميع تعيينات المدربين المرتبطة بهذه الرتبة.' }
      );
    
    const message = await interaction.editReply({ 
      embeds: [embed],
      components: [confirmRow]
    });
    
    // Set up collector for buttons
    const filter = (i: any) => {
      return i.user.id === interaction.user.id && 
        (i.customId === `confirm_coach_delete_${coach.id}` || 
         i.customId === `cancel_coach_delete_${coach.id}`);
    };
    
    const collector = message.createMessageComponentCollector({ 
      filter, 
      time: 30000,
      max: 1
    });
    
    collector.on('collect', async i => {
      if (i.customId === `confirm_coach_delete_${coach.id}`) {
        try {
          // Delete all assignments for this coach
          const assignments = await storage.getCoachAssignmentsByCoach(coach.id);
          for (const assignment of assignments) {
            await storage.deleteCoachAssignment(assignment.id);
          }
          
          // Delete the coach
          await storage.deleteCoach(coach.id);
          
          const successEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('تم حذف رتبة المدرب')
            .setDescription(`تم حذف رتبة المدرب ${coach.roleName} بنجاح.`);
          
          await i.update({ 
            embeds: [successEmbed],
            components: []
          });
        } catch (error) {
          console.error('Error deleting coach:', error);
          await i.update({ 
            content: 'حدث خطأ أثناء حذف رتبة المدرب. الرجاء المحاولة مرة أخرى.',
            embeds: [],
            components: []
          });
        }
      } else {
        // Cancel
        await i.update({ 
          content: 'تم إلغاء حذف رتبة المدرب.',
          embeds: [],
          components: []
        });
      }
    });
    
    collector.on('end', async collected => {
      if (collected.size === 0) {
        // Timeout
        await interaction.editReply({ 
          content: 'انتهت مهلة تأكيد حذف رتبة المدرب.',
          embeds: [],
          components: []
        });
      }
    });
    
  } catch (error) {
    console.error('Error handling coaches remove command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء حذف رتبة المدرب. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handle coaches assign command
async function handleCoachesAssignCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the options
    const user = interaction.options.getUser('user') || interaction.options.getUser('عضو');
    const coachRole = interaction.options.getRole('coach_role') || interaction.options.getRole('رتبة_المدرب');
    const teamRole = interaction.options.getRole('team_role') || interaction.options.getRole('رتبة_الفريق');
    
    if (!user || !coachRole || !teamRole) {
      await interaction.editReply({ content: 'يجب تحديد العضو ورتبة المدرب ورتبة الفريق.' });
      return;
    }
    
    // Check if coach exists
    const coach = await storage.getCoachByRoleId(serverId, coachRole.id);
    if (!coach) {
      await interaction.editReply({ content: `لا يوجد مدرب مسجل باستخدام هذه الرتبة: ${coachRole.name}` });
      return;
    }
    
    // Check if team exists
    const team = await storage.getTeamByRoleId(serverId, teamRole.id);
    if (!team) {
      await interaction.editReply({ content: `لا يوجد فريق مسجل باستخدام هذه الرتبة: ${teamRole.name}` });
      return;
    }
    
    // Check if this coach is already assigned to this team
    const existingAssignments = await storage.getCoachAssignmentsByCoach(coach.id);
    const isAlreadyAssigned = existingAssignments.some(a => a.teamId === team.id && a.userId === user.id);
    
    if (isAlreadyAssigned) {
      await interaction.editReply({ content: `${user} مسجل بالفعل كمدرب ${coach.roleName} لفريق ${team.name}` });
      return;
    }
    
    // Add roles to user
    try {
      const guild = interaction.guild;
      if (guild) {
        const guildMember = await guild.members.fetch(user.id);
        await guildMember.roles.add(coachRole.id);
        await guildMember.roles.add(teamRole.id);
      }
    } catch (error) {
      console.error('Error adding roles to user:', error);
      await interaction.editReply({ content: `فشل في إضافة الرتب للعضو ${user}. تأكد من أن لديك صلاحيات كافية.` });
      return;
    }
    
    // Create the coach assignment
    const assignment = await storage.createCoachAssignment({
      serverId,
      coachId: coach.id,
      teamId: team.id,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('تم تعيين مدرب')
      .setDescription(`تم تعيين ${user} كمدرب ${coach.roleName} لفريق ${team.emoji} ${team.name} بنجاح.`)
      .addFields(
        { name: 'المدرب', value: `${user}` },
        { name: 'رتبة المدرب', value: `<@&${coachRole.id}>` },
        { name: 'الفريق', value: `${team.emoji} ${team.name}` }
      );
    
    await interaction.editReply({ embeds: [embed] });
    
    // Notify the user
    try {
      await user.send({
        content: `تم تعيينك كمدرب ${coach.roleName} لفريق ${team.emoji} ${team.name}.`,
        embeds: [embed]
      });
    } catch (error) {
      console.error('Error sending DM to user:', error);
      // Continue even if DM fails
    }
    
  } catch (error) {
    console.error('Error handling coaches assign command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء تعيين المدرب. الرجاء المحاولة مرة أخرى.' });
  }
}

export const coachesCommands = [
  coachesCommand,
  coachesArabicCommand
];