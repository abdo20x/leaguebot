// Roster management commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction
} from "discord.js";
import { storage } from "../../storage";
import { createRosterCountsEmbed } from "../embeds";
import { detectLanguage, getTranslation } from "../translations";
import { updateRosterCount } from "../utils";

// Roster view command - Show roster counts for all teams
const rosterViewCommand = {
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('View team rosters')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View roster counts for all teams')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a player to a team roster')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to add to the roster')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The team to add the user to')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('nickname')
            .setDescription('Optional nickname or IGN for the player')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a player from a team roster')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to remove from the roster')
            .setRequired(true))
    ),
  
  // Permission check for roster management
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    // For viewing, anyone can view rosters
    if (interaction.options.getSubcommand() === 'view') {
      return true;
    }
    
    // For add/remove, need special permissions
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
      case 'view':
        await handleViewRosters(interaction, serverId, locale);
        break;
      case 'add':
        await handleAddPlayer(interaction, serverId, locale);
        break;
      case 'remove':
        await handleRemovePlayer(interaction, serverId, locale);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }
};

// Arabic version - روستر command
const rosterArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('روستر')
    .setDescription('عرض قوائم الفرق')
    .addSubcommand(subcommand =>
      subcommand
        .setName('عرض')
        .setDescription('عرض عدد اللاعبين في جميع الفرق')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('إضافة')
        .setDescription('إضافة لاعب إلى قائمة الفريق')
        .addUserOption(option => 
          option.setName('المستخدم')
            .setDescription('المستخدم المراد إضافته إلى القائمة')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق المراد إضافة المستخدم إليه')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('اللقب')
            .setDescription('اللقب أو اسم اللعبة الاختياري للاعب')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('إزالة')
        .setDescription('إزالة لاعب من قائمة الفريق')
        .addUserOption(option => 
          option.setName('المستخدم')
            .setDescription('المستخدم المراد إزالته من القائمة')
            .setRequired(true))
    ),
  
  // Permission check for roster management - same as English version
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    // For viewing, anyone can view rosters
    if (interaction.options.getSubcommand() === 'عرض') {
      return true;
    }
    
    // For add/remove, need special permissions
    return interaction.memberPermissions?.has('ManageRoles') || 
           interaction.memberPermissions?.has('Administrator') || 
           false;
  },
  
  // Execute the command - similar to English version but handle Arabic subcommand names
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'لا يمكن استخدام هذا الأمر إلا في خادم!', ephemeral: true });
      return;
    }
    
    // Always use Arabic for this command
    const locale = 'ar';
    
    // Get subcommand
    const subcommand = interaction.options.getSubcommand();
    
    // Handle different subcommands
    switch (subcommand) {
      case 'عرض': // View
        await handleViewRosters(interaction, serverId, locale);
        break;
      case 'إضافة': // Add
        // Map Arabic option names to English for the handler
        const user = interaction.options.getUser('المستخدم');
        const team = interaction.options.getRole('الفريق');
        const nickname = interaction.options.getString('اللقب');
        
        // Create a modified interaction object with mapped options
        const modifiedInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getUser: (name: string) => name === 'user' ? user : null,
            getRole: (name: string) => name === 'team' ? team : null,
            getString: (name: string) => name === 'nickname' ? nickname : null
          }
        } as ChatInputCommandInteraction;
        
        await handleAddPlayer(modifiedInteraction, serverId, locale);
        break;
      case 'إزالة': // Remove
        // Map Arabic option names to English for the handler
        const userToRemove = interaction.options.getUser('المستخدم');
        
        // Create a modified interaction object with mapped options
        const modifiedRemoveInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getUser: (name: string) => name === 'user' ? userToRemove : null
          }
        } as ChatInputCommandInteraction;
        
        await handleRemovePlayer(modifiedRemoveInteraction, serverId, locale);
        break;
      default:
        await interaction.reply({ content: 'أمر فرعي غير معروف!', ephemeral: true });
    }
  }
};

// Helper function to handle viewing rosters
async function handleViewRosters(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  // Get all teams
  const teams = await storage.getTeams(serverId);
  
  // For each team, get the player count
  const teamsWithCounts = await Promise.all(teams.map(async (team) => {
    const players = await storage.getPlayersByTeam(team.id);
    return {
      ...team,
      rosterCount: players.length
    };
  }));
  
  // Create the roster counts embed
  const embed = createRosterCountsEmbed(teamsWithCounts, locale);
  
  await interaction.reply({ embeds: [embed] });
}

// Helper function to handle adding a player to a roster
async function handleAddPlayer(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const user = interaction.options.getUser('user');
  const teamRole = interaction.options.getRole('team');
  const nickname = interaction.options.getString('nickname');
  
  if (!user || !teamRole) {
    await interaction.reply({ content: 'User and team are required!', ephemeral: true });
    return;
  }
  
  // Find the team by role ID
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Check if player is already on a team
  const existingPlayer = await storage.getPlayerByUserId(serverId, user.id);
  
  if (existingPlayer) {
    // If already on this team, just update nickname if provided
    if (existingPlayer.teamId === team.id) {
      if (nickname) {
        await storage.updatePlayer(existingPlayer.id, { nickname });
        await interaction.reply({ 
          content: `${user.username} is already on team ${team.emoji} ${team.name}. Updated nickname to ${nickname}.`,
          ephemeral: false
        });
      } else {
        await interaction.reply({ 
          content: `${user.username} is already on team ${team.emoji} ${team.name}.`,
          ephemeral: true
        });
      }
      return;
    }
    
    // If on a different team, ask to transfer instead
    const oldTeam = await storage.getTeam(existingPlayer.teamId || 0);
    await interaction.reply({ 
      content: `${user.username} is already on team ${oldTeam?.emoji || ''} ${oldTeam?.name || 'Unknown'}. Use the transfer command instead.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if team is at roster capacity
  const players = await storage.getPlayersByTeam(team.id);
  
  if (players.length >= (team.rosterMax || 22)) {
    await interaction.reply({ 
      content: `Team ${team.emoji} ${team.name} is at maximum roster capacity (${team.rosterMax || 22}).`,
      ephemeral: true
    });
    return;
  }
  
  // Add player to the team
  await storage.createPlayer({
    serverId,
    userId: user.id,
    teamId: team.id,
    username: user.username,
    nickname: nickname || undefined
  });
  
  // Update roster count
  await updateRosterCount(team.id);
  
  // Try to assign the team role to the user
  try {
    const member = interaction.guild?.members.cache.get(user.id);
    if (member) {
      await member.roles.add(teamRole);
    }
  } catch (error) {
    console.error('Error assigning team role:', error);
    // Continue anyway, this is not critical
  }
  
  await interaction.reply({ 
    content: `${user.username} has been added to team ${team.emoji} ${team.name}${nickname ? ` with nickname ${nickname}` : ''}.`,
    ephemeral: false
  });
}

// Helper function to handle removing a player from a roster
async function handleRemovePlayer(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const user = interaction.options.getUser('user');
  
  if (!user) {
    await interaction.reply({ content: 'User is required!', ephemeral: true });
    return;
  }
  
  // Find the player
  const player = await storage.getPlayerByUserId(serverId, user.id);
  
  if (!player) {
    await interaction.reply({ 
      content: `${user.username} is not on any team roster.`,
      ephemeral: true
    });
    return;
  }
  
  // Get the team
  const team = await storage.getTeam(player.teamId || 0);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Error: Player is on an invalid team.',
      ephemeral: true
    });
    return;
  }
  
  // Remove player from the team
  await storage.deletePlayer(player.id);
  
  // Update roster count
  await updateRosterCount(team.id);
  
  // Try to remove the team role from the user
  try {
    const member = interaction.guild?.members.cache.get(user.id);
    if (member) {
      const teamRole = interaction.guild?.roles.cache.get(team.roleId);
      if (teamRole) {
        await member.roles.remove(teamRole);
      }
    }
  } catch (error) {
    console.error('Error removing team role:', error);
    // Continue anyway, this is not critical
  }
  
  await interaction.reply({ 
    content: `${user.username} has been removed from team ${team.emoji} ${team.name}.`,
    ephemeral: false
  });
}

// Export all roster-related commands
export const rosterCommands = [
  rosterViewCommand,
  rosterArabicCommand
];
