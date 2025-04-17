// Team management commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction
} from "discord.js";
import { storage } from "../../storage";
import { createBaseEmbed, createTeamDetailsEmbed } from "../embeds";
import { detectLanguage, getTranslation } from "../translations";
import { isValidEmoji, generateTeamId } from "../utils";

// Teams add command
const teamsAddCommand = {
  data: new SlashCommandBuilder()
    .setName('teams')
    .setDescription('Manage teams in the league')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a team & emoji pair')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The team role')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('emoji')
            .setDescription('The emoji to represent the team')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('roster_cap')
            .setDescription('Maximum roster size (default: 22)')
            .setRequired(false))
        .addIntegerOption(option => 
          option.setName('initial_currency')
            .setDescription('Initial currency amount (default: 50M)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the teams in the league')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a team & emoji pair')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The team role to remove')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Change a team\'s paired emoji')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The team role to edit')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('emoji')
            .setDescription('The new emoji to represent the team')
            .setRequired(true))
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
        await handleAddTeam(interaction, serverId, locale);
        break;
      case 'view':
        await handleViewTeams(interaction, serverId, locale);
        break;
      case 'remove':
        await handleRemoveTeam(interaction, serverId, locale);
        break;
      case 'edit':
        await handleEditTeam(interaction, serverId, locale);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }
};

// Team salaries command
const teamSalariesCommand = {
  data: new SlashCommandBuilder()
    .setName('teamsalaries')
    .setDescription('View a list of the teams salaries'),
  
  // Execute the command
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Detect language
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Get teams with their currency values
    const teams = await storage.getTeams(serverId);
    
    // Create embed
    const embed = createBaseEmbed(locale)
      .setTitle('Team Salaries')
      .setDescription('Currency amounts for all teams');
    
    // Add team fields
    if (teams.length === 0) {
      embed.addFields({ name: 'No Teams', value: 'No teams have been added yet.' });
    } else {
      const teamsField = teams.map(team => 
        `${team.emoji} **${team.name}**: ${team.currency?.toLocaleString() || 0} coins`
      ).join('\n');
      
      embed.setDescription(teamsField);
    }
    
    await interaction.reply({ embeds: [embed] });
  }
};

// Team owners command
const teamOwnersCommand = {
  data: new SlashCommandBuilder()
    .setName('teamowners')
    .setDescription('View a list of the team owners'),
  
  // Execute the command
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Detect language
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Get teams
    const teams = await storage.getTeams(serverId);
    
    // Create embed
    const embed = createBaseEmbed(locale)
      .setTitle('Team Owners')
      .setDescription('Owners for all teams');
    
    // Add team fields
    if (teams.length === 0) {
      embed.addFields({ name: 'No Teams', value: 'No teams have been added yet.' });
    } else {
      // For each team, get captains/coaches
      for (const team of teams) {
        const coachAssignments = await storage.getCoachAssignmentsByTeam(team.id);
        const captains = coachAssignments
          .filter(ca => ca.coachId === 1) // Assuming 1 is for captains
          .map(ca => `<@${ca.userId}>`)
          .join(', ');
        
        embed.addFields({
          name: `${team.emoji} ${team.name}`,
          value: captains || 'No owners assigned',
          inline: true
        });
      }
    }
    
    await interaction.reply({ embeds: [embed] });
  }
};

// Team templates command
const teamTemplatesCommand = {
  data: new SlashCommandBuilder()
    .setName('teamtemplates')
    .setDescription('Create team roles & emojis for your league'),
  
  // Permission check - needs manage roles
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
    
    // Create embed with template options
    const embed = createBaseEmbed(locale)
      .setTitle('Team Templates')
      .setDescription('Choose a template to create standard team roles & emojis:')
      .addFields(
        { name: 'Football/Soccer', value: 'Create standard football/soccer teams' },
        { name: 'Basketball', value: 'Create standard basketball teams' },
        { name: 'eSports', value: 'Create standard eSports organization teams' }
      );
    
    await interaction.reply({ 
      embeds: [embed],
      content: 'Feature coming soon!',
      ephemeral: true
    });
  }
};

// Helper function to handle adding a team
async function handleAddTeam(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const role = interaction.options.getRole('role');
  const emoji = interaction.options.getString('emoji');
  const rosterCap = interaction.options.getInteger('roster_cap') || 22;
  const initialCurrency = interaction.options.getInteger('initial_currency') || 50000000;
  
  if (!role || !emoji) {
    await interaction.reply({ content: 'Role and emoji are required!', ephemeral: true });
    return;
  }
  
  // Validate emoji
  if (!isValidEmoji(emoji)) {
    await interaction.reply({ 
      content: getTranslation('invalid_emoji', locale as any),
      ephemeral: true
    });
    return;
  }
  
  // Check if team already exists
  const existingTeam = await storage.getTeamByRoleId(serverId, role.id);
  
  if (existingTeam) {
    await interaction.reply({ 
      content: getTranslation('team_already_exists', locale as any),
      ephemeral: true
    });
    return;
  }
  
  // Create the team
  const teamId = generateTeamId(serverId, role.name);
  
  const team = await storage.createTeam({
    serverId,
    teamId,
    name: role.name,
    emoji,
    roleId: role.id,
    currency: initialCurrency,
    rosterCount: 0,
    rosterMax: rosterCap
  });
  
  // Create settings if they don't exist
  const existingSettings = await storage.getSettings(serverId);
  if (!existingSettings) {
    await storage.createSettings({
      serverId,
      guildName: interaction.guild?.name || 'Unknown Guild',
      prefix: '!',
      locale: 'en',
      teamRosterCap: 22,
      winCurrency: 10000000,
      lossCurrency: 5000000,
      defaultCurrency: 50000000,
      setupComplete: false
    });
  }
  
  await interaction.reply({ 
    content: getTranslation('team_added', locale as any)
      .replace('{name}', team.name)
      .replace('{emoji}', team.emoji),
    ephemeral: false
  });
}

// Helper function to handle viewing teams
async function handleViewTeams(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  // Get teams
  const teams = await storage.getTeams(serverId);
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Teams')
    .setDescription('All teams in the league');
  
  // Add team fields
  if (teams.length === 0) {
    embed.addFields({ name: 'No Teams', value: 'No teams have been added yet.' });
  } else {
    // For each team, get roster count and currency
    for (const team of teams) {
      const players = await storage.getPlayersByTeam(team.id);
      
      embed.addFields({
        name: `${team.emoji} ${team.name}`,
        value: `Roster: ${players.length}/${team.rosterMax}\nCurrency: ${team.currency?.toLocaleString() || 0}`,
        inline: true
      });
    }
  }
  
  await interaction.reply({ embeds: [embed] });
}

// Helper function to handle removing a team
async function handleRemoveTeam(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const role = interaction.options.getRole('role');
  
  if (!role) {
    await interaction.reply({ content: 'Role is required!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, role.id);
  
  if (!team) {
    await interaction.reply({ 
      content: getTranslation('team_not_found', locale as any),
      ephemeral: true
    });
    return;
  }
  
  // Delete team
  await storage.deleteTeam(team.id);
  
  await interaction.reply({ 
    content: getTranslation('team_removed', locale as any)
      .replace('{name}', team.name),
    ephemeral: false
  });
}

// Helper function to handle editing a team's emoji
async function handleEditTeam(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const role = interaction.options.getRole('role');
  const emoji = interaction.options.getString('emoji');
  
  if (!role || !emoji) {
    await interaction.reply({ content: 'Role and emoji are required!', ephemeral: true });
    return;
  }
  
  // Validate emoji
  if (!isValidEmoji(emoji)) {
    await interaction.reply({ 
      content: getTranslation('invalid_emoji', locale as any),
      ephemeral: true
    });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, role.id);
  
  if (!team) {
    await interaction.reply({ 
      content: getTranslation('team_not_found', locale as any),
      ephemeral: true
    });
    return;
  }
  
  // Update emoji
  await storage.updateTeam(team.id, { emoji });
  
  await interaction.reply({ 
    content: `Team ${team.name} emoji updated to ${emoji}`,
    ephemeral: false
  });
}

// Export all team-related commands
export const teamsCommands = [
  teamsAddCommand,
  teamSalariesCommand,
  teamOwnersCommand,
  teamTemplatesCommand
];
