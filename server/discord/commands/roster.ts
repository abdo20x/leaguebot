import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ColorResolvable
} from "discord.js";
import { storage } from "../../storage";
import { getRosterPercentage } from "../utils";

// Roster command
const rosterCommand = {
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('View roster counts for all teams'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleRosterCommand(interaction);
  }
};

// Arabic version - روستر command
const rosterArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('روستر')
    .setDescription('عرض قوائم اللاعبين لجميع الفرق'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleRosterCommand(interaction);
  }
};

// Handle roster command
async function handleRosterCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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

    // Get guild for role counting
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: 'Error: Could not find server.' });
      return;
    }

    // Fetch all guild members to ensure accurate role counts
    await guild.members.fetch();

    // Count role members and sort teams
    const teamsWithCounts = await Promise.all(teams.map(async team => {
      const role = guild.roles.cache.get(team.roleId);
      const count = role ? role.members.size : 0;
      return { ...team, rosterCount: count };
    }));

    teamsWithCounts.sort((a, b) => (b.rosterCount || 0) - (a.rosterCount || 0));

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('Win Lock Community Roster Counts')
      .setThumbnail(guild.iconURL() || '')
      .setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true })} UTC` });

    // Add each team to the description
    let description = '';

    // Sort teams by roster count in descending order
    teamsWithCounts.sort((a, b) => (b.rosterCount || 0) - (a.rosterCount || 0));

    // Add active teams first
    for (const team of teamsWithCounts) {
      const rosterCount = team.rosterCount || 0;
      const rosterMax = team.rosterMax || 30;

      // Determine circle color based on roster count
      let colorCircle = '🟢'; // Green for good
      if (rosterCount < 10) {
        colorCircle = '🟡'; // Yellow for low
      } else if (rosterCount === 0) {
        colorCircle = '🔴'; // Red for empty
      }

      // Format roster count with black background
      const rosterDisplay = `${rosterCount}/${rosterMax}`;

      // Clean up team name and emoji display
      const teamName = team.name.replace(/\\/g, '');
      const teamEmoji = team.emoji || '';
      const role = guild.roles.cache.get(team.roleId);
      const roleMention = role ? `<@&${team.roleId}>` : teamName;

      description += `${colorCircle} **\`${rosterCount}/${rosterMax}\`** - ${teamEmoji} ${roleMention}\n`;
    }

    // Add empty teams section if any exist
    const emptyTeams = teamsWithCounts.filter(t => (t.rosterCount || 0) === 0);
    if (emptyTeams.length > 0) {
      description += '\nEmpty Teams\n';
      for (const team of emptyTeams) {
        description += `${team.emoji} ${team.name}\n`;
      }
    }

    embed.setDescription(description);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error handling roster command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر. الرجاء المحاولة مرة أخرى.' });
  }
}

export const rosterCommands = [
  rosterCommand,
  rosterArabicCommand
];