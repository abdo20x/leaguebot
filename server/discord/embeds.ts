// Discord message embeds for consistent UI

import { 
  EmbedBuilder, 
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  SelectMenuBuilder,
  SelectMenuOptionBuilder
} from "discord.js";
import { formatTranslation, getTranslation } from "./translations";
import { formatCurrency, getRosterPercentage } from "./utils";
import { Team, Player, Coach, Transaction } from "@shared/schema";

// Base embed for all bot messages
export function createBaseEmbed(locale: string = 'en'): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x9B59B6) // Peerless purple color
    .setFooter({
      text: getTranslation("bot_name", locale as any),
      iconURL: "https://cdn.discordapp.com/embed/avatars/0.png"
    })
    .setTimestamp();
}

// Setup wizard embed
export function createSetupEmbed(
  page: number,
  totalPages: number,
  locale: string = 'en'
): EmbedBuilder {
  const embed = createBaseEmbed(locale)
    .setTitle(getTranslation("setup_title", locale as any))
    .setDescription(formatTranslation("setup_page_title", locale as any, { current: page, total: totalPages }));
  
  if (page === 1) {
    // Main setup page with instructions
    embed.addFields(
      { name: getTranslation("setup_peerless", locale as any), value: getTranslation("setup_auto_detect", locale as any) },
      { name: "Page 1:", value: getTranslation("setup_page1", locale as any) },
      { name: "Page 2:", value: getTranslation("setup_page2", locale as any) },
      { name: "Page 3:", value: getTranslation("setup_page3", locale as any) },
      { name: "Page 4:", value: getTranslation("setup_page4", locale as any) },
      { name: "Page 5:", value: getTranslation("setup_page5", locale as any) },
      { name: "Page 6:", value: getTranslation("setup_page6", locale as any) },
      { name: "Page 7:", value: getTranslation("setup_page7", locale as any) },
      { name: "Page 8:", value: getTranslation("setup_page8", locale as any) },
      { name: "Page 9:", value: getTranslation("setup_page9", locale as any) },
      { name: "Page 10:", value: getTranslation("setup_page10", locale as any) }
    );
  }
  
  return embed;
}

// Custom teams setup embed
export function createTeamsSetupEmbed(
  teams: { id: number; emoji: string; name: string }[],
  locale: string = 'en'
): EmbedBuilder {
  const embed = createBaseEmbed(locale)
    .setTitle(getTranslation("setup_title", locale as any))
    .addFields(
      { name: getTranslation("teams_title", locale as any), value: getTranslation("teams_skip_info", locale as any) }
    );
  
  // Add teams field with formatted list
  const teamsField = {
    name: getTranslation("teams_header", locale as any),
    value: teams.length > 0 
      ? teams.map((team, index) => `${index + 1} | ${team.emoji} ${team.name}`).join('\n')
      : "No teams yet"
  };
  
  embed.addFields(teamsField);
  embed.addFields({ name: "\u200B", value: getTranslation("teams_confused", locale as any) });
  embed.setFooter({ text: formatTranslation("setup_page_title", locale as any, { current: 2, total: 10 }) });
  
  return embed;
}

// Custom coaches setup embed
export function createCoachesSetupEmbed(
  coaches: { id: number; shortCode: string; name: string }[],
  locale: string = 'en'
): EmbedBuilder {
  const embed = createBaseEmbed(locale)
    .setTitle(getTranslation("setup_title", locale as any))
    .addFields(
      { name: getTranslation("coaches_title", locale as any), value: getTranslation("coaches_skip_info", locale as any) }
    );
  
  // Add coaches field with formatted list
  const coachesField = {
    name: getTranslation("coaches_header", locale as any),
    value: coaches.length > 0 
      ? coaches.map((coach, index) => `${index + 1} | ${coach.shortCode} @ ${coach.name}`).join('\n')
      : "No coaches yet"
  };
  
  embed.addFields(coachesField);
  embed.addFields({ name: "\u200B", value: getTranslation("coaches_confused", locale as any) });
  embed.setFooter({ text: formatTranslation("setup_page_title", locale as any, { current: 3, total: 10 }) });
  
  return embed;
}

// Roster counts embed
export function createRosterCountsEmbed(
  teams: (Team & { players?: Player[] })[],
  locale: string = 'en'
): EmbedBuilder {
  const embed = createBaseEmbed(locale)
    .setTitle(getTranslation("roster_title", locale as any));
  
  // Format each team with color and roster count
  const teamFields = teams.map(team => {
    const rosterPercent = getRosterPercentage(team.rosterCount || 0, team.rosterMax || 22);
    const color = rosterPercent.color === "#2ecc71" ? "🟢" : 
                  rosterPercent.color === "#f1c40f" ? "🟠" : "🔴";
                  
    return `${color} ${formatTranslation("roster_capacity", locale as any, { 
      current: team.rosterCount || 0, 
      max: team.rosterMax || 22 
    })} - ${team.emoji} ${team.name}`;
  });
  
  if (teamFields.length > 0) {
    embed.setDescription(teamFields.join('\n'));
  }
  
  embed.addFields({ name: getTranslation("empty_teams", locale as any), value: "\u200B" });
  
  return embed;
}

// Team details embed
export function createTeamDetailsEmbed(
  team: Team & { 
    players?: Player[], 
    coaches?: { coach: Coach, user: string }[] 
  },
  locale: string = 'en'
): EmbedBuilder {
  const embed = createBaseEmbed(locale)
    .setTitle(`${team.emoji} ${team.name}`)
    .addFields(
      { 
        name: "Roster", 
        value: formatTranslation("roster_capacity", locale as any, { 
          current: team.rosterCount || 0, 
          max: team.rosterMax || 22 
        }),
        inline: true
      },
      {
        name: "Currency",
        value: formatCurrency(team.currency || 0),
        inline: true
      }
    );
  
  // Add coaches if available
  if (team.coaches && team.coaches.length > 0) {
    const coachesText = team.coaches.map(c => 
      `${c.coach.shortCode} <@${c.user}>`
    ).join('\n');
    
    embed.addFields({ name: "Coaches", value: coachesText });
  }
  
  // Add players if available
  if (team.players && team.players.length > 0) {
    const playersText = team.players.slice(0, 10).map(p => 
      `<@${p.userId}>${p.nickname ? ` (${p.nickname})` : ''}`
    ).join('\n');
    
    const morePlayersText = team.players.length > 10 ? 
      `\n...and ${team.players.length - 10} more` : '';
    
    embed.addFields({ name: "Players", value: playersText + morePlayersText });
  }
  
  return embed;
}

// Transaction embed
export function createTransactionEmbed(
  transaction: Transaction & {
    sourceTeam?: Team,
    targetTeam?: Team,
    player?: Player
  },
  locale: string = 'en'
): EmbedBuilder {
  const embed = createBaseEmbed(locale);
  
  if (transaction.transactionType === "transfer") {
    embed.setTitle("Player Transfer");
    
    if (transaction.sourceTeam && transaction.targetTeam && transaction.player) {
      embed.setDescription(
        `Transfer from ${transaction.sourceTeam.emoji} ${transaction.sourceTeam.name} to ` +
        `${transaction.targetTeam.emoji} ${transaction.targetTeam.name}`
      );
      
      embed.addFields(
        { name: "Player", value: `<@${transaction.player.userId}>`, inline: true },
        { name: "Amount", value: formatCurrency(transaction.amount || 0), inline: true },
        { name: "Status", value: transaction.status.toUpperCase(), inline: true }
      );
      
      if (transaction.reason) {
        embed.addFields({ name: "Reason", value: transaction.reason });
      }
    }
  } else if (transaction.transactionType === "currency") {
    embed.setTitle("Currency Transaction");
    
    if (transaction.targetTeam) {
      embed.setDescription(`Currency adjustment for ${transaction.targetTeam.emoji} ${transaction.targetTeam.name}`);
      
      embed.addFields(
        { name: "Amount", value: formatCurrency(transaction.amount || 0), inline: true },
        { name: "Status", value: transaction.status.toUpperCase(), inline: true }
      );
      
      if (transaction.reason) {
        embed.addFields({ name: "Reason", value: transaction.reason });
      }
    }
  }
  
  return embed;
}

// Create buttons for navigation in setup wizard
export function createNavigationButtons(
  currentPage: number,
  totalPages: number,
  locale: string = 'en'
): ActionRowBuilder<ButtonBuilder> {
  const prevButton = new ButtonBuilder()
    .setCustomId(`setup_prev_${currentPage}`)
    .setLabel(getTranslation("previous_page", locale as any))
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage <= 1);
  
  const nextButton = new ButtonBuilder()
    .setCustomId(`setup_next_${currentPage}`)
    .setLabel(getTranslation("next_page", locale as any))
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage >= totalPages);
  
  const goToPageButton = new ButtonBuilder()
    .setCustomId(`setup_goto_${currentPage}`)
    .setLabel(getTranslation("go_to_page", locale as any))
    .setStyle(ButtonStyle.Primary);
  
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(prevButton, goToPageButton, nextButton);
}

// Create select menu for page selection
export function createPageSelectMenu(
  currentPage: number,
  totalPages: number,
  locale: string = 'en'
): ActionRowBuilder<SelectMenuBuilder> {
  const selectMenu = new SelectMenuBuilder()
    .setCustomId(`setup_page_select`)
    .setPlaceholder(`Select a page`);
  
  for (let i = 1; i <= totalPages; i++) {
    selectMenu.addOptions(
      new SelectMenuOptionBuilder()
        .setLabel(`Page ${i}`)
        .setValue(`${i}`)
        .setDefault(i === currentPage)
    );
  }
  
  return new ActionRowBuilder<SelectMenuBuilder>()
    .addComponents(selectMenu);
}

// Create action buttons for approving/rejecting transactions
export function createTransactionActionButtons(
  transactionId: number,
  locale: string = 'en'
): ActionRowBuilder<ButtonBuilder> {
  const approveButton = new ButtonBuilder()
    .setCustomId(`transaction_approve_${transactionId}`)
    .setLabel("Approve")
    .setStyle(ButtonStyle.Success);
  
  const rejectButton = new ButtonBuilder()
    .setCustomId(`transaction_reject_${transactionId}`)
    .setLabel("Reject")
    .setStyle(ButtonStyle.Danger);
  
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(approveButton, rejectButton);
}

// Create roles info embed
export function createRolesInfoEmbed(locale: string = 'en'): EmbedBuilder {
  const embed = createBaseEmbed(locale);
  
  embed.addFields(
    {
      name: "Roles",
      value: `• ${getTranslation("role_operator", locale as any)}:\n` +
             `• ${getTranslation("role_operator_desc", locale as any)}\n` +
             `• ${getTranslation("role_manager", locale as any)}:\n` +
             `• ${getTranslation("role_manager_desc", locale as any)}\n` +
             `• ${getTranslation("role_manager_desc2", locale as any)}\n` +
             `• ${getTranslation("role_referee", locale as any)}:\n` +
             `• ${getTranslation("role_streamer", locale as any)}:\n` +
             `• ${getTranslation("role_streamer_desc", locale as any)}`
    },
    {
      name: "# Channels",
      value: `• ${getTranslation("channel_challenges", locale as any)}:\n` +
             `• ${getTranslation("channel_challenges_desc", locale as any)}\n` +
             `• ${getTranslation("channel_decisions", locale as any)}:\n` +
             `• ${getTranslation("channel_decisions_desc", locale as any)}\n` +
             `• ${getTranslation("channel_notices", locale as any)}:\n` +
             `• ${getTranslation("channel_notices_desc", locale as any)}\n` +
             `• ${getTranslation("channel_setting_changes", locale as any)}:\n` +
             `• ${getTranslation("channel_setting_changes_desc", locale as any)}\n` +
             `• ${getTranslation("channel_streams", locale as any)}:\n` +
             `• ${getTranslation("channel_streams_desc", locale as any)}`
    }
  );
  
  return embed;
}
