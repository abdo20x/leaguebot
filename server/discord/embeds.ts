import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder 
} from "discord.js";
import { storage } from "../storage";
import { Coach, Team, Player } from "@shared/schema";
import { formatCurrency } from "./utils";

// Create base embed with consistent styling
export function createBaseEmbed(locale: string = 'en'): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#3498db')
    .setTimestamp();
}

// Create setup embed
export function createSetupEmbed(
  title: string = 'Win Lock Community Setup',
  subtitle: string = 'Use /detectsettings if you want to auto-detect settings prior to using this command',
  description: string = ''
): EmbedBuilder {
  const embed = createBaseEmbed()
    .setTitle(title)
    .setDescription(subtitle);
  
  if (description) {
    embed.addFields({ name: '\u200B', value: description });
  }

  // Add pages information
  embed.addFields(
    { name: 'Page 1:', value: 'This Page', inline: true },
    { name: 'Page 2:', value: 'Custom Teams', inline: true },
    { name: 'Page 3:', value: 'Custom Coaches', inline: true },
    { name: 'Page 4:', value: 'League Staff', inline: true },
    { name: 'Page 5:', value: 'Basic Transaction Settings', inline: true },
    { name: 'Page 6:', value: 'Advanced Transaction Settings', inline: true },
    { name: 'Page 7:', value: 'Demand Settings', inline: true },
    { name: 'Page 8:', value: 'Season Settings', inline: true },
    { name: 'Page 9:', value: 'Notice Settings', inline: true },
    { name: 'Page 10:', value: 'Miscellaneous Settings', inline: true }
  );
  
  return embed;
}

// Create teams setup embed
export function createTeamsSetupEmbed(
  serverId: string,
  pageTitle: string = 'Custom Teams'
): EmbedBuilder {
  const embed = createBaseEmbed()
    .setTitle('Win Lock Community Setup')
    .setDescription(pageTitle);
  
  // This would ideally load the teams from the database
  // and display them, but for now we'll just show a placeholder
  embed.addFields(
    { name: 'Teams Setup', value: 'Use the buttons below to add, edit, or remove teams.' },
    { name: 'Current Teams', value: 'Loading teams...' }
  );
  
  return embed;
}

// Create coaches setup embed
export function createCoachesSetupEmbed(
  serverId: string,
  pageTitle: string = 'Custom Coaches'
): EmbedBuilder {
  const embed = createBaseEmbed()
    .setTitle('Win Lock Community Setup')
    .setDescription(pageTitle);
  
  // This would ideally load the coaches from the database
  // and display them, but for now we'll just show a placeholder
  embed.addFields(
    { name: 'Coaches Setup', value: 'Use the buttons below to add, edit, or remove coaches.' },
    { name: 'Current Coaches', value: 'Loading coaches...' }
  );
  
  return embed;
}

// Create roster counts embed
export function createRosterCountsEmbed(
  serverId: string,
  teams: Team[]
): EmbedBuilder {
  const embed = createBaseEmbed()
    .setTitle('Win Lock Community Roster Counts')
    .setFooter({ text: `Today at ${new Date().toLocaleTimeString()}` });
  
  let description = '';
  
  // Add each team to the description
  for (const team of teams) {
    const rosterCount = team.rosterCount || 0;
    const rosterMax = team.rosterMax || 30;
    
    // Create a colored circle based on percentage
    let colorCircle = '🟢'; // Green for good
    const percentage = (rosterCount / rosterMax) * 100;
    
    if (percentage < 30) {
      colorCircle = '🟠'; // Orange for low
    } else if (percentage > 80) {
      colorCircle = '🔴'; // Red for nearly full
    }
    
    description += `${colorCircle} ${rosterCount}/${rosterMax} - ${team.emoji} ${team.name}\n`;
  }
  
  // Check if there are teams with no players
  const emptyTeams = teams.filter(team => (team.rosterCount || 0) === 0);
  if (emptyTeams.length > 0) {
    description += '\nEmpty Teams\n';
    for (const team of emptyTeams) {
      description += `${team.emoji} ${team.name}\n`;
    }
  }
  
  embed.setDescription(description);
  
  return embed;
}

// Create team details embed
export function createTeamDetailsEmbed(
    team: Team,
    players: Player[],
    coaches?: { coach: Coach, user: string }[] 
): EmbedBuilder {
  const embed = createBaseEmbed()
    .setTitle(`${team.name} Details`)
    .setDescription(`${team.emoji} Balance: ${formatCurrency(team.currency || 0)}`)
    .addFields(
      { name: 'Roster', value: `${team.rosterCount || 0}/${team.rosterMax || 30} players` },
      { name: 'Status', value: team.currency !== null ? 'Active' : 'Inactive' }
    );
  
  // Add players if available
  if (players && players.length > 0) {
    const playersList = players.map(player => `<@${player.userId}>`).join(', ');
    embed.addFields({ name: 'Players', value: playersList || 'No players' });
  }
  
  // Add coaches if available
  if (coaches && coaches.length > 0) {
    const coachesList = coaches.map(c => `${c.coach.shortCode}: <@${c.user}>`).join('\n');
    embed.addFields({ name: 'Coaches', value: coachesList || 'No coaches' });
  }
  
  return embed;
}

// Create transaction embed
export function createTransactionEmbed(
    transactionType: string,
    amount: number,
    description: string,
    sourceTeam?: Team,
    targetTeam?: Team,
    player?: Player,
    coach?: string
): EmbedBuilder {
  const embed = createBaseEmbed()
    .setColor('#ff3e3e');
  
  // Format the embed based on the screenshot example
  if (transactionType === 'sign' && sourceTeam && player) {
    // PL > Team Name Transaction format
    embed.setTitle(`${sourceTeam.emoji} ${sourceTeam.name} Transaction`);
    
    // The TeamEmoji TeamName have signed @PlayerTag
    embed.setDescription(`The ${sourceTeam.emoji} ${sourceTeam.name} have **${description}** <@${player.userId}>`);
    
    // Coach and Roster info
    if (coach) {
      embed.addFields({ name: 'Coach:', value: coach });
    }
    
    embed.addFields({ 
      name: 'Roster:', 
      value: `${sourceTeam.rosterCount || 0}/${sourceTeam.rosterMax || 30}` 
    });
  }
  else if (transactionType === 'release' && sourceTeam && player) {
    // PL > Team Name Transaction format
    embed.setTitle(`${sourceTeam.emoji} ${sourceTeam.name} Transaction`);
    
    // The TeamEmoji TeamName have released @PlayerTag
    embed.setDescription(`The ${sourceTeam.emoji} ${sourceTeam.name} have **${description}** <@${player.userId}>`);
    
    // Coach and Roster info
    if (coach) {
      embed.addFields({ name: 'Coach:', value: coach });
    }
    
    embed.addFields({ 
      name: 'Roster:', 
      value: `${sourceTeam.rosterCount || 0}/${sourceTeam.rosterMax || 30}` 
    });
  }
  else if (transactionType === 'transfer' && sourceTeam && targetTeam && player) {
    // Team Transaction format
    embed.setTitle(`${sourceTeam.emoji} ${sourceTeam.name} Transaction`);
    
    // The TeamEmoji TeamName have transferred @PlayerTag to TargetTeamEmoji TargetTeamName
    embed.setDescription(`The ${sourceTeam.emoji} ${sourceTeam.name} have **${description}** <@${player.userId}> to ${targetTeam.emoji} ${targetTeam.name}`);
    
    // Amount if it's a paid transfer
    if (amount > 0) {
      embed.addFields({ name: 'Amount:', value: formatCurrency(amount) });
    }
    
    // Coach and Roster info
    if (coach) {
      embed.addFields({ name: 'Coach:', value: coach });
    }
    
    embed.addFields({ 
      name: 'Roster:', 
      value: `${sourceTeam.rosterCount || 0}/${sourceTeam.rosterMax || 30}` 
    });
  }
  else if (transactionType === 'offer') {
    // Offer format
    embed.setTitle(`${sourceTeam?.emoji || ''} Transfer Offer`);
    embed.setDescription(description);
    
    if (amount > 0) {
      embed.addFields({ name: 'Amount:', value: formatCurrency(amount) });
    }
    
    if (player) {
      embed.addFields({ name: 'Player:', value: `<@${player.userId}>` });
    }
    
    if (coach) {
      embed.addFields({ name: 'From Coach:', value: coach });
    }
  }
  else {
    // Default format for other transaction types
    embed.setTitle(`${sourceTeam?.emoji || ''} ${sourceTeam?.name || ''} Transaction`);
    embed.setDescription(description);
    
    if (amount > 0) {
      embed.addFields({ name: 'Amount:', value: formatCurrency(amount) });
    }
    
    if (player) {
      embed.addFields({ name: 'Player:', value: `<@${player.userId}>` });
    }
    
    if (sourceTeam) {
      embed.addFields({ 
        name: 'Roster:', 
        value: `${sourceTeam.rosterCount || 0}/${sourceTeam.rosterMax || 30}` 
      });
    }
  }
  
  return embed;
}

// Create navigation buttons
export function createNavigationButtons(
  currentPage: number,
  totalPages: number,
  baseId: string = 'page'
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`${baseId}_${currentPage > 1 ? currentPage - 1 : 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId(`${baseId}_${currentPage < totalPages ? currentPage + 1 : totalPages}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage >= totalPages)
    );
}

// Create page select menu
export function createPageSelectMenu(
  currentPage: number,
  pages: { value: string, label: string }[]
): ActionRowBuilder<StringSelectMenuBuilder> {
  const options = pages.map(page => 
    new StringSelectMenuOptionBuilder()
      .setLabel(page.label)
      .setValue(page.value)
      .setDefault(page.value === currentPage.toString())
  );
  
  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('page_select')
        .setPlaceholder('Select a page')
        .addOptions(options)
    );
}

// Create transaction action buttons
export function createTransactionActionButtons(
  transactionId: number
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`transaction_approve_${transactionId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`transaction_reject_${transactionId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );
}

// Create roles info embed
export function createRolesInfoEmbed(locale: string = 'en'): EmbedBuilder {
  const embed = createBaseEmbed()
    .setTitle('League Roles and Permissions')
    .setDescription('Here are the roles and their permissions in the league:');
  
  // Add role information
  embed.addFields(
    { name: '🏆 League Admin', value: 'Full access to all commands and settings', inline: false },
    { name: '👨‍💼 Coach', value: 'Can manage their team, sign/release players, and make transfer offers', inline: false },
    { name: '⚽ Player', value: 'Can view team information and apply to teams as free agents', inline: false }
  );
  
  return embed;
}