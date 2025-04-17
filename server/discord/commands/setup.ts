// Setup command for configuring the league
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction
} from "discord.js";
import { 
  createSetupEmbed, 
  createTeamsSetupEmbed, 
  createCoachesSetupEmbed,
  createNavigationButtons,
  createPageSelectMenu
} from "../embeds";
import { storage } from "../../storage";
import { detectLanguage } from "../translations";
import { isValidEmoji } from "../utils";

// Setup command definition
export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up the league with a step-by-step wizard'),
  
  // Permission check - only admins or guild managers can run setup
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    return interaction.memberPermissions?.has('Administrator') || 
           interaction.memberPermissions?.has('ManageGuild') || 
           false;
  },
  
  // Execute the setup command
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Detect language from server name or default to English
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Check if setup was already started
    let setupData = await storage.getSetupProgress(serverId);
    
    if (!setupData) {
      // Initialize setup data
      setupData = await storage.createSetupProgress({
        serverId,
        step: 1,
        totalSteps: 10,
        data: {}
      });
    }
    
    // Create embed for current step
    const embed = createSetupEmbed(setupData.step, setupData.totalSteps, locale);
    
    // Create navigation buttons
    const navigationRow = createNavigationButtons(setupData.step, setupData.totalSteps, locale);
    
    // Create page select menu
    const selectRow = createPageSelectMenu(setupData.step, setupData.totalSteps, locale);
    
    // Send the setup wizard
    await interaction.reply({ 
      embeds: [embed], 
      components: [navigationRow, selectRow],
      ephemeral: false
    });
  },
  
  // Handle button interactions for setup wizard
  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Extract button info
    const [_, action, currentPageStr] = interaction.customId.split('_');
    const currentPage = parseInt(currentPageStr, 10);
    
    // Get setup data
    let setupData = await storage.getSetupProgress(serverId);
    if (!setupData) {
      await interaction.reply({ content: 'Setup not initialized. Please run /setup first!', ephemeral: true });
      return;
    }
    
    // Determine new page based on action
    let newPage = currentPage;
    if (action === 'next') {
      newPage = Math.min(currentPage + 1, setupData.totalSteps);
    } else if (action === 'prev') {
      newPage = Math.max(currentPage - 1, 1);
    }
    
    // Update setup progress
    setupData = await storage.updateSetupProgress(serverId, { step: newPage });
    
    // Detect language from server name or default to English
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Generate appropriate embed based on the page
    let embed;
    switch (newPage) {
      case 1:
        embed = createSetupEmbed(newPage, setupData?.totalSteps || 10, locale);
        break;
      case 2:
        // Fetch teams for the server
        const teams = await storage.getTeams(serverId);
        embed = createTeamsSetupEmbed(teams, locale);
        break;
      case 3:
        // Fetch coaches for the server
        const coaches = await storage.getCoaches(serverId);
        embed = createCoachesSetupEmbed(coaches, locale);
        break;
      default:
        embed = createSetupEmbed(newPage, setupData?.totalSteps || 10, locale);
    }
    
    // Create navigation buttons
    const navigationRow = createNavigationButtons(newPage, setupData?.totalSteps || 10, locale);
    
    // Create page select menu
    const selectRow = createPageSelectMenu(newPage, setupData?.totalSteps || 10, locale);
    
    // Update the message
    await interaction.update({ 
      embeds: [embed], 
      components: [navigationRow, selectRow] 
    });
  },
  
  // Handle select menu interactions for setup wizard
  async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Get selected page
    const selectedPage = parseInt(interaction.values[0], 10);
    
    // Get setup data
    let setupData = await storage.getSetupProgress(serverId);
    if (!setupData) {
      await interaction.reply({ content: 'Setup not initialized. Please run /setup first!', ephemeral: true });
      return;
    }
    
    // Update setup progress
    setupData = await storage.updateSetupProgress(serverId, { step: selectedPage });
    
    // Detect language from server name or default to English
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Generate appropriate embed based on the page
    let embed;
    switch (selectedPage) {
      case 1:
        embed = createSetupEmbed(selectedPage, setupData?.totalSteps || 10, locale);
        break;
      case 2:
        // Fetch teams for the server
        const teams = await storage.getTeams(serverId);
        embed = createTeamsSetupEmbed(teams, locale);
        break;
      case 3:
        // Fetch coaches for the server
        const coaches = await storage.getCoaches(serverId);
        embed = createCoachesSetupEmbed(coaches, locale);
        break;
      default:
        embed = createSetupEmbed(selectedPage, setupData?.totalSteps || 10, locale);
    }
    
    // Create navigation buttons
    const navigationRow = createNavigationButtons(selectedPage, setupData?.totalSteps || 10, locale);
    
    // Create page select menu
    const selectRow = createPageSelectMenu(selectedPage, setupData?.totalSteps || 10, locale);
    
    // Update the message
    await interaction.update({ 
      embeds: [embed], 
      components: [navigationRow, selectRow] 
    });
  },
  
  // Check if server has completed setup
  async isSetupComplete(serverId: string): Promise<boolean> {
    const settings = await storage.getSettings(serverId);
    return !!settings?.setupComplete;
  }
};
