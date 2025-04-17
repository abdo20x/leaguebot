import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonInteraction,
  StringSelectMenuInteraction,
  Message
} from "discord.js";
import { storage } from "../../storage";
import { createSetupEmbed, createTeamsSetupEmbed, createCoachesSetupEmbed } from "../embeds";

// Setup command
export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure league settings'),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleSetupCommand(interaction);
  },
  
  // Handle button interactions for setup
  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;
    
    if (customId.startsWith('setup_page_')) {
      const pageNum = parseInt(customId.replace('setup_page_', ''));
      await showSetupPage(interaction, pageNum);
    } 
    // Add other button handlers as needed for the setup flow
  },
  
  // Handle select menu interactions for setup
  async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    if (interaction.customId === 'setup_page_select') {
      const pageNum = parseInt(interaction.values[0]);
      await showSetupPage(interaction, pageNum);
    }
  }
};

// Arabic version - إعداد command
const setupArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('إعداد')
    .setDescription('تكوين إعدادات الدوري'),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleSetupCommand(interaction);
  }
};

// Handle setup command
async function handleSetupCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Check if user has administrator permissions
    const member = interaction.member;
    if (!member || !('permissions' in member) || !member.permissions.has('Administrator')) {
      await interaction.editReply({ content: 'يجب أن تكون مسؤولاً لاستخدام هذا الأمر.' });
      return;
    }
    
    // Show the first page of setup
    await showSetupPage(interaction, 1);
  } catch (error) {
    console.error('Error handling setup command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر. الرجاء المحاولة مرة أخرى.' });
  }
}

// Show a specific setup page
async function showSetupPage(interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction, pageNum: number): Promise<void> {
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.' });
    return;
  }
  
  try {
    // Get or create setup progress
    let progress = await storage.getSetupProgress(serverId);
    
    if (!progress) {
      // Create initial setup progress
      progress = await storage.createSetupProgress({
        serverId,
        step: 1,
        totalSteps: 10,
        lastUpdated: new Date(),
        data: {}
      });
    }
    
    // Create the embed for the requested page
    let setupEmbed: EmbedBuilder;
    
    switch (pageNum) {
      case 1:
        // Main setup page
        setupEmbed = createSetupEmbed('Win Lock Community Setup');
        break;
      case 2:
        // Custom Teams setup
        setupEmbed = createTeamsSetupEmbed(serverId);
        break;
      case 3:
        // Custom Coaches setup
        setupEmbed = createCoachesSetupEmbed(serverId);
        break;
      // Add more pages as needed
      default:
        // Default to main page
        setupEmbed = createSetupEmbed('Win Lock Community Setup', 'Page not found', 'The requested page does not exist.');
        pageNum = 1;
    }
    
    // Create page selector menu
    const pageSelectRow = createPageSelector(pageNum);
    
    // Create navigation buttons
    const navigationRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`setup_page_${pageNum > 1 ? pageNum - 1 : 1}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageNum <= 1),
        new ButtonBuilder()
          .setCustomId(`setup_page_${pageNum < 10 ? pageNum + 1 : 10}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageNum >= 10)
      );
    
    // Update setup progress
    await storage.updateSetupProgress(serverId, {
      step: pageNum,
      lastUpdated: new Date()
    });
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ 
        embeds: [setupEmbed],
        components: [pageSelectRow, navigationRow]
      });
    } else {
      await interaction.reply({ 
        embeds: [setupEmbed],
        components: [pageSelectRow, navigationRow]
      });
    }
  } catch (error) {
    console.error('Error showing setup page:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء عرض صفحة الإعداد. الرجاء المحاولة مرة أخرى.' });
  }
}

// Create page selector dropdown
function createPageSelector(currentPage: number): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_page_select')
        .setPlaceholder('Select a page')
        .addOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 1: This Page')
            .setValue('1')
            .setDefault(currentPage === 1),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 2: Custom Teams')
            .setValue('2')
            .setDefault(currentPage === 2),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 3: Custom Coaches')
            .setValue('3')
            .setDefault(currentPage === 3),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 4: League Staff')
            .setValue('4')
            .setDefault(currentPage === 4),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 5: Basic Transaction Settings')
            .setValue('5')
            .setDefault(currentPage === 5),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 6: Advanced Transaction Settings')
            .setValue('6')
            .setDefault(currentPage === 6),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 7: Demand Settings')
            .setValue('7')
            .setDefault(currentPage === 7),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 8: Season Settings')
            .setValue('8')
            .setDefault(currentPage === 8),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 9: Notice Settings')
            .setValue('9')
            .setDefault(currentPage === 9),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 10: Miscellaneous Settings')
            .setValue('10')
            .setDefault(currentPage === 10)
        ])
    );
}

export const setupCommands = [
  setupCommand,
  setupArabicCommand
];