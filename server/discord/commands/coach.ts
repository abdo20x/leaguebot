// Coach management commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction
} from "discord.js";
import { storage } from "../../storage";
import { createBaseEmbed } from "../embeds";
import { detectLanguage, getTranslation } from "../translations";

// Coach add command
const coachAddCommand = {
  data: new SlashCommandBuilder()
    .setName('coach')
    .setDescription('Manage coach roles in the league')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a coach role')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The coach role')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('shortcode')
            .setDescription('Short code for the coach (e.g. CN for Captain)')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a coach role')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The coach role to remove')
            .setRequired(true))
    )
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
          option.setName('team')
            .setDescription('The team to assign the coach to')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all coaches')
    ),

  // Permission check - needs manage roles or administrator
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    return interaction.memberPermissions?.has('ManageRoles') || 
           interaction.memberPermissions?.has('Administrator') || 
           false;
  },

  // Execute the command
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }

    // Detect language
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';

    // Get subcommand
    const subcommand = interaction.options.getSubcommand();

    // Handle different subcommands
    switch (subcommand) {
      case 'add':
        await handleAddCoach(interaction, serverId, locale);
        break;
      case 'remove':
        await handleRemoveCoach(interaction, serverId, locale);
        break;
      case 'assign':
        await handleAssignCoach(interaction, serverId, locale);
        break;
      case 'view':
        await handleViewCoaches(interaction, serverId, locale);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }
};

// Arabic version - مدرب command
const coachArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('مدرب')
    .setDescription('إدارة أدوار المدربين في الدوري')
    .addSubcommand(subcommand =>
      subcommand
        .setName('إضافة')
        .setDescription('إضافة دور مدرب')
        .addRoleOption(option => 
          option.setName('الدور')
            .setDescription('دور المدرب')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('الرمز')
            .setDescription('رمز قصير للمدرب (مثل CN للكابتن)')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('إزالة')
        .setDescription('إزالة دور مدرب')
        .addRoleOption(option => 
          option.setName('الدور')
            .setDescription('دور المدرب المراد إزالته')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('تعيين')
        .setDescription('تعيين مدرب لفريق')
        .addUserOption(option => 
          option.setName('المستخدم')
            .setDescription('المستخدم المراد تعيينه كمدرب')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('دور_المدرب')
            .setDescription('دور المدرب المراد تعيينه')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق المراد تعيين المدرب له')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('عرض')
        .setDescription('عرض جميع المدربين')
    ),

  // Permission check - same as English version
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    return interaction.memberPermissions?.has('ManageRoles') || 
           interaction.memberPermissions?.has('Administrator') || 
           false;
  },

  // Execute command - similar to English but with Arabic parameters
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'لا يمكن استخدام هذا الأمر إلا في خادم!', ephemeral: true });
      return;
    }

    // Always use Arabic locale for this command
    const locale = 'ar';

    // Get subcommand
    const subcommand = interaction.options.getSubcommand();

    // Handle different Arabic subcommands by mapping them to English handlers
    switch (subcommand) {
      case 'إضافة': // add
        const role = interaction.options.getRole('الدور');
        const shortcode = interaction.options.getString('الرمز');

        // Create a modified interaction object with mapped options
        const addInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getRole: (name: string) => name === 'role' ? role : null,
            getString: (name: string) => name === 'shortcode' ? shortcode : null
          }
        } as ChatInputCommandInteraction;

        await handleAddCoach(addInteraction, serverId, locale);
        break;

      case 'إزالة': // remove
        const roleToRemove = interaction.options.getRole('الدور');

        // Create a modified interaction with mapped options
        const removeInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getRole: (name: string) => name === 'role' ? roleToRemove : null
          }
        } as ChatInputCommandInteraction;

        await handleRemoveCoach(removeInteraction, serverId, locale);
        break;

      case 'تعيين': // assign
        const user = interaction.options.getUser('المستخدم');
        const coachRole = interaction.options.getRole('دور_المدرب');
        const team = interaction.options.getRole('الفريق');

        // Create a modified interaction with mapped options
        const assignInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getUser: (name: string) => name === 'user' ? user : null,
            getRole: (name: string) => {
              if (name === 'coach_role') return coachRole;
              if (name === 'team') return team;
              return null;
            }
          }
        } as ChatInputCommandInteraction;

        await handleAssignCoach(assignInteraction, serverId, locale);
        break;

      case 'عرض': // view
        await handleViewCoaches(interaction, serverId, locale);
        break;

      default:
        await interaction.reply({ content: 'أمر فرعي غير معروف!', ephemeral: true });
    }
  }
};

// Helper function to handle adding a coach role
async function handleAddCoach(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const role = interaction.options.getRole('role');
  const shortCode = interaction.options.getString('shortcode');

  if (!role || !shortCode) {
    await interaction.reply({ content: 'Role and short code are required!', ephemeral: true });
    return;
  }

  // Check if coach role already exists
  const existingCoach = await storage.getCoachByRoleId(serverId, role.id);

  if (existingCoach) {
    await interaction.reply({ 
      content: getTranslation('coach_already_exists', locale as any),
      ephemeral: true
    });
    return;
  }

  // Check if short code is already in use
  const existingShortCode = await storage.getCoachByShortCode(serverId, shortCode);

  if (existingShortCode) {
    await interaction.reply({ 
      content: `Short code "${shortCode}" is already in use. Please choose a different short code.`,
      ephemeral: true
    });
    return;
  }

  // Create the coach role
  const coach = await storage.createCoach({
    serverId,
    roleId: role.id,
    name: role.name,
    shortCode
  });

  await interaction.reply({ 
    content: getTranslation('coach_added', locale as any)
      .replace('{name}', coach.name)
      .replace('{code}', coach.shortCode),
    ephemeral: false
  });
}

// Helper function to handle removing a coach role
async function handleRemoveCoach(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const role = interaction.options.getRole('role');

  if (!role) {
    await interaction.reply({ content: 'Role is required!', ephemeral: true });
    return;
  }

  // Find the coach
  const coach = await storage.getCoachByRoleId(serverId, role.id);

  if (!coach) {
    await interaction.reply({ 
      content: getTranslation('coach_not_found', locale as any),
      ephemeral: true
    });
    return;
  }

  try {
    // Delete coach assignments first
    const assignments = await storage.getCoachAssignmentsByCoach(coach.id);
    for (const assignment of assignments) {
      await storage.deleteCoachAssignment(assignment.id);
    }

    // Then delete the coach
    await storage.deleteCoach(serverId, coach.id);

    // Try to remove the role from server if possible
    try {
      const guild = interaction.guild;
      if (guild) {
        const roleObj = await guild.roles.fetch(role.id);
        if (roleObj) {
          await roleObj.delete();
        }
      }
    } catch (roleError) {
      console.error('Error deleting role:', roleError);
      // Continue even if role deletion fails
    }

    await interaction.reply({ 
      content: getTranslation('coach_removed', locale as any)
        .replace('{name}', coach.name),
      ephemeral: false
    });
  } catch (error) {
    console.error('Error removing coach:', error);
    await interaction.reply({
      content: 'An error occurred while removing the coach. Please try again.',
      ephemeral: true
    });
  }
}

// Helper function to handle assigning a coach to a team
async function handleAssignCoach(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const user = interaction.options.getUser('user');
  const coachRoleObj = interaction.options.getRole('coach_role');
  const teamRoleObj = interaction.options.getRole('team');

  if (!user || !coachRoleObj || !teamRoleObj) {
    await interaction.reply({ content: 'User, coach role, and team role are required!', ephemeral: true });
    return;
  }

  // Find the coach
  const coach = await storage.getCoachByRoleId(serverId, coachRoleObj.id);

  if (!coach) {
    await interaction.reply({ 
      content: `Coach role not found. Make sure to add it first with /coach add.`,
      ephemeral: true
    });
    return;
  }

  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRoleObj.id);

  if (!team) {
    await interaction.reply({ 
      content: `Team not found. Make sure to add it first with /teams add.`,
      ephemeral: true
    });
    return;
  }

  // Check if user is already assigned this coach role for this team
  const assignments = await storage.getCoachAssignmentsByUser(serverId, user.id);
  const existingAssignment = assignments.find(a => 
    a.coachId === coach.id && a.teamId === team.id
  );

  if (existingAssignment) {
    await interaction.reply({ 
      content: `${user.username} is already assigned as ${coach.name} for team ${team.emoji} ${team.name}.`,
      ephemeral: true
    });
    return;
  }

  // Create coach assignment
  await storage.createCoachAssignment({
    serverId,
    coachId: coach.id,
    userId: user.id,
    teamId: team.id
  });

  // Try to assign both team and coach roles to the user
  try {
    const member = interaction.guild?.members.cache.get(user.id);
    if (member) {
      await member.roles.add(coachRoleObj);
      await member.roles.add(teamRoleObj);
    }
  } catch (error) {
    console.error('Error assigning roles:', error);
    // Continue anyway, this is not critical
  }

  await interaction.reply({ 
    content: `${user.username} has been assigned as ${coach.name} for team ${team.emoji} ${team.name}.`,
    ephemeral: false
  });
}

// Helper function to handle viewing all coaches
async function handleViewCoaches(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  // Get all coaches
  const coaches = await storage.getCoaches(serverId);

  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Coaches')
    .setDescription('All coach roles in the league');

  // Add coach fields
  if (coaches.length === 0) {
    embed.addFields({ name: 'No Coaches', value: 'No coach roles have been added yet.' });
  } else {
    // Group by coach role
    for (const coach of coaches) {
      // Get assignments for this coach
      const assignments = await storage.getCoachAssignmentsByCoach(coach.id);

      // Format assignments
      let assignmentsText = "No assignments yet";

      if (assignments.length > 0) {
        const formattedAssignments = await Promise.all(assignments.map(async (assignment) => {
          const team = await storage.getTeam(assignment.teamId || 0);
          return `<@${assignment.userId}> - ${team?.emoji || ''} ${team?.name || 'Unknown Team'}`;
        }));

        assignmentsText = formattedAssignments.join('\n');
      }

      // Add to embed
      embed.addFields({
        name: `${coach.shortCode} - ${coach.name}`,
        value: assignmentsText
      });
    }
  }

  await interaction.reply({ embeds: [embed] });
}

// Export all coach-related commands
export const coachCommands = [
  coachAddCommand,
  coachArabicCommand
];