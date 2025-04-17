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

    // Count role members and sort teams
    const teamsWithCounts = await Promise.all(teams.map(async team => {
      const role = guild.roles.cache.get(team.roleId);
      const count = role ? role.members.size : 0;
      return { ...team, currentCount: count };
    }));
    
    teamsWithCounts.sort((a, b) => b.currentCount - a.currentCount);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('Win Lock Community Roster Counts')
      .setThumbnail(guild.iconURL() || '')
      .setFooter({ text: `Today at ${new Date().toLocaleTimeString()}` });
    
    // Add each team to the description
    let description = '';
    
    for (const team of teamsWithCounts) {
      const rosterCount = team.currentCount;
      const rosterMax = team.rosterMax || 30;
      const { color, percentage } = getRosterPercentage(rosterCount, rosterMax);
      
      // Create a colored circle based on percentage
      let colorCircle = '🟢'; // Green for good
      if (percentage < 30) {
        colorCircle = '🟠'; // Orange for low
      } else if (percentage > 80) {
        colorCircle = '🔴'; // Red for nearly full
      }
      
      description += `${colorCircle} ${rosterCount}/${rosterMax} - ${team.emoji} ${team.name}\\n`;
    }
    
    // Check if there are teams with no players
    const emptyTeams = teams.filter(team => (team.rosterCount || 0) === 0);
    if (emptyTeams.length > 0) {
      description += '\\nEmpty Teams\\n';
      for (const team of emptyTeams) {
        description += `${team.emoji} ${team.name}\\n`;
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