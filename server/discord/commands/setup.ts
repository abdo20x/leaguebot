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
  Message,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder
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
    else if (customId.startsWith('setup_set_admin_')) {
      const userId = customId.replace('setup_set_admin_', '');
      await handleSetAdmin(interaction, userId);
    }
    else if (customId === 'setup_add_team') {
      await handleAddTeam(interaction);
    }
    else if (customId === 'setup_edit_team') {
      await handleEditTeam(interaction);
    }
    else if (customId === 'setup_remove_team') {
      await handleRemoveTeam(interaction);
    }
    else if (customId === 'confirm_remove_team') {
      // Handle team removal confirmation
      const teamId = interaction.message.components[0].components[0].customId;
      await storage.deleteTeam(interaction.guildId!, parseInt(teamId));
      await interaction.reply({ content: 'Team removed successfully!', ephemeral: true });
      await showSetupPage(interaction, 2); // Refresh teams page
    }
    else if (customId === 'setup_add_team') {
      await handleAddTeam(interaction);
    }
    else if (customId === 'setup_edit_team') {
      await handleEditTeam(interaction);
    }
    else if (customId === 'setup_remove_team') {
      await handleRemoveTeam(interaction);
    }
    else if (customId === 'setup_add_coach') {
      await handleAddCoach(interaction);
    }
    else if (customId === 'setup_assign_coach') {
      await handleAssignCoach(interaction);
    }
    else if (customId === 'setup_remove_coach') {
      await handleRemoveCoach(interaction);
    }
    else if (customId === 'setup_detect_coaches') {
      await handleDetectCoaches(interaction);
    }
    // Add other button handlers as needed for the setup flow
  },
  
  // Handle select menu interactions for setup
  async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    if (interaction.customId === 'setup_page_select') {
      const pageNum = parseInt(interaction.values[0]);
      await showSetupPage(interaction, pageNum);
    }
    else if (interaction.customId === 'setup_team_type') {
      const action = interaction.values[0];
      switch (action) {
        case 'add_team':
          await handleAddTeam(interaction);
          break;
        case 'edit_team':
          await handleEditTeam(interaction);
          break;
        case 'remove_team':
          await handleRemoveTeam(interaction);
          break;
      }
    }
    else if (interaction.customId === 'setup_coach_type') {
      const action = interaction.values[0];
      switch (action) {
        case 'add_coach':
          await handleAddCoach(interaction);
          break;
        case 'assign_coach':
          await handleAssignCoach(interaction);
          break;
        case 'remove_coach':
          await handleRemoveCoach(interaction);
          break;
      }
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
    if (!member) {
      await interaction.editReply({ content: 'لم يتم العثور على العضو.' });
      return;
    }

    // Handle different member permission types
    let hasAdminPermission = false;
    if (typeof member.permissions === 'string') {
      hasAdminPermission = member.permissions.includes('ADMINISTRATOR');
    } else if ('has' in member.permissions) {
      hasAdminPermission = member.permissions.has('Administrator');
    }

    if (!hasAdminPermission) {
      await interaction.editReply({ content: 'يجب أن تكون مسؤولاً لاستخدام هذا الأمر.' });
      return;
    }

    // Create initial settings if they don't exist
    let settings = await storage.getSettings(serverId);
    if (!settings) {
      settings = await storage.createSettings({
        serverId,
        guildName: interaction.guild?.name || '',
        prefix: '!',
        locale: 'ar',
        teamRosterCap: 30,
        winCurrency: 10000000,
        lossCurrency: 5000000,
        defaultCurrency: 50000000,
        setupComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Show the first page of setup
    await showSetupPage(interaction, 1);
  } catch (error) {
    console.error('Error handling setup command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر. الرجاء المحاولة مرة أخرى.' });
  }
}

// Show a specific setup page - export for use in modal handlers
export async function showSetupPage(interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | any, pageNum: number): Promise<void> {
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
    let additionalRows: ActionRowBuilder<any>[] = [];
    
    switch (pageNum) {
      case 1:
        // Main setup page
        setupEmbed = createSetupEmbed('Win Lock Community Setup');
        
        // Add admin button to set user with ID 1225190102469181542 as admin
        const adminActionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`setup_set_admin_1225190102469181542`)
              .setLabel('Set Me as Admin')
              .setStyle(ButtonStyle.Success)
          );
        
        additionalRows.push(adminActionRow);
        break;
        
      case 2:
        // Custom Teams setup
        setupEmbed = await createTeamsSetupEmbed(serverId);
        
        // Add team management buttons
        const teamActionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_add_team')
              .setLabel('Add Team')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_edit_team')
              .setLabel('Edit Team')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('setup_remove_team')
              .setLabel('Remove Team')
              .setStyle(ButtonStyle.Danger)
          );
        
        // Add team selector (dropdown menu)
        const teamSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('setup_team_type')
              .setPlaceholder('Custom Team Type')
              .addOptions([
                new StringSelectMenuOptionBuilder()
                  .setLabel('Add Team')
                  .setValue('add_team')
                  .setDescription('Add a new team with role and emoji'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Edit Team')
                  .setValue('edit_team')
                  .setDescription('Edit an existing team'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Remove Team')
                  .setValue('remove_team')
                  .setDescription('Remove an existing team')
              ])
          );
        
        additionalRows.push(teamActionRow, teamSelectRow);
        break;
        
      case 3:
        // Custom Coaches setup
        setupEmbed = await createCoachesSetupEmbed(serverId);
        
        // Add coach management buttons
        const coachActionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_add_coach')
              .setLabel('Add Coach')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_assign_coach')
              .setLabel('Assign Coach')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('setup_remove_coach')
              .setLabel('Remove Coach')
              .setStyle(ButtonStyle.Danger)
          );
        
        // Add coach selector (dropdown menu)
        const coachSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('setup_coach_type')
              .setPlaceholder('Custom Coach Type')
              .addOptions([
                new StringSelectMenuOptionBuilder()
                  .setLabel('Add Coach')
                  .setValue('add_coach')
                  .setDescription('Add a new coach role'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Assign Coach')
                  .setValue('assign_coach')
                  .setDescription('Assign coach to a team'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Remove Coach')
                  .setValue('remove_coach')
                  .setDescription('Remove a coach role')
              ])
          );
        
        additionalRows.push(coachActionRow, coachSelectRow);
        
        // Add detect custom coaches button
        const detectCoachesRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_detect_coaches')
              .setLabel('Detect Custom Coaches')
              .setStyle(ButtonStyle.Success)
          );
        
        additionalRows.push(detectCoachesRow);
        break;
        
      case 4:
        // League Staff setup
        setupEmbed = new EmbedBuilder()
          .setTitle('League Staff Setup')
          .setDescription('Configure staff roles and permissions for your league')
          .addFields([
            { name: 'League Operator', value: 'Full control over league settings and operations', inline: true },
            { name: 'League Manager', value: 'Can manage teams and players', inline: true },
            { name: 'Referee', value: 'Can manage matches and record results', inline: true }
          ]);

        const staffActionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_add_staff')
              .setLabel('Add Staff Role')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_edit_staff')
              .setLabel('Edit Staff Role')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('setup_remove_staff')
              .setLabel('Remove Staff Role')
              .setStyle(ButtonStyle.Danger)
          );
        
        additionalRows.push(staffActionRow);
        break;
        
      case 5:
        // Transaction Settings
        setupEmbed = new EmbedBuilder()
          .setTitle('Transaction Settings')
          .setDescription('Configure currency and trade settings for your league')
          .addFields([
            { name: 'Default Currency', value: '50,000,000', inline: true },
            { name: 'Win Bonus', value: '10,000,000', inline: true },
            { name: 'Loss Compensation', value: '5,000,000', inline: true },
            { name: 'Transfer Fee', value: '10% of player value', inline: true }
          ]);

        const transactionActionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_edit_currency')
              .setLabel('Edit Currency Values')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_transfer_rules')
              .setLabel('Transfer Rules')
              .setStyle(ButtonStyle.Secondary)
          );
        
        additionalRows.push(transactionActionRow);
        break;

      case 6:
        // Advanced Transaction Settings
        setupEmbed = new EmbedBuilder()
          .setTitle('Advanced Transaction Settings')
          .setDescription('Configure advanced transaction rules and limits')
          .addFields([
            { name: 'Transfer Window', value: 'Configure transfer window duration', inline: true },
            { name: 'Wage Structure', value: 'Set wage caps and bonuses', inline: true },
            { name: 'Contract Duration', value: 'Set contract length limits', inline: true }
          ]);

        const advTransactionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_transfer_window')
              .setLabel('Transfer Window')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_wage_structure')
              .setLabel('Wage Structure')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('setup_contract_rules')
              .setLabel('Contract Rules')
              .setStyle(ButtonStyle.Secondary)
          );
        
        additionalRows.push(advTransactionRow);
        break;

      case 7:
        // Demand Settings
        setupEmbed = new EmbedBuilder()
          .setTitle('Demand Settings')
          .setDescription('Configure player demand and market dynamics')
          .addFields([
            { name: 'Market Influence', value: 'Set market influence factors', inline: true },
            { name: 'Position Demand', value: 'Configure position-based demand', inline: true },
            { name: 'Performance Impact', value: 'Set performance-based value changes', inline: true }
          ]);

        const demandRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_market_influence')
              .setLabel('Market Influence')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_position_demand')
              .setLabel('Position Demand')
              .setStyle(ButtonStyle.Secondary)
          );
        
        additionalRows.push(demandRow);
        break;

      case 8:
        // Season Settings
        setupEmbed = new EmbedBuilder()
          .setTitle('Season Settings')
          .setDescription('Configure season-related settings')
          .addFields([
            { name: 'Season Duration', value: 'Set season length', inline: true },
            { name: 'Match Schedule', value: 'Configure match frequency', inline: true },
            { name: 'Season Events', value: 'Set special events', inline: true }
          ]);

        const seasonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_season_duration')
              .setLabel('Season Duration')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_match_schedule')
              .setLabel('Match Schedule')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('setup_season_events')
              .setLabel('Season Events')
              .setStyle(ButtonStyle.Secondary)
          );
        
        additionalRows.push(seasonRow);
        break;

      case 9:
        // Match Settings
        setupEmbed = new EmbedBuilder()
          .setTitle('Match Settings')
          .setDescription('Configure match and gameplay settings')
          .addFields([
            { name: 'Match Duration', value: 'Set match length', inline: true },
            { name: 'Scoring Rules', value: 'Configure scoring system', inline: true },
            { name: 'Match Rewards', value: 'Set match-based rewards', inline: true }
          ]);

        const matchRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_match_duration')
              .setLabel('Match Duration')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_scoring_rules')
              .setLabel('Scoring Rules')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('setup_match_rewards')
              .setLabel('Match Rewards')
              .setStyle(ButtonStyle.Secondary)
          );
        
        additionalRows.push(matchRow);
        break;

      case 10:
        // Review & Finish
        setupEmbed = new EmbedBuilder()
          .setTitle('Review & Finish Setup')
          .setDescription('Review your settings and complete the setup')
          .addFields([
            { name: 'Settings Review', value: 'Review all configurations', inline: true },
            { name: 'Save Settings', value: 'Save and apply settings', inline: true },
            { name: 'Start League', value: 'Begin league operations', inline: true }
          ]);

        const finishRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('setup_review_settings')
              .setLabel('Review Settings')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('setup_save_settings')
              .setLabel('Save Settings')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('setup_start_league')
              .setLabel('Start League')
              .setStyle(ButtonStyle.Secondary)
          );
        
        additionalRows.push(finishRow);
        break;
        
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
          .setLabel('Previous Page')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageNum <= 1),
        new ButtonBuilder()
          .setCustomId(`setup_page_${pageNum < 10 ? pageNum + 1 : 10}`)
          .setLabel('Next Page')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageNum >= 10)
      );
    
    // Update setup progress
    await storage.updateSetupProgress(serverId, {
      step: pageNum,
      lastUpdated: new Date()
    });
    
    // Combine all components (up to 5 rows maximum)
    const allComponents = [pageSelectRow, navigationRow, ...additionalRows].slice(0, 5);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ 
        embeds: [setupEmbed],
        components: allComponents
      });
    } else {
      await interaction.reply({ 
        embeds: [setupEmbed],
        components: allComponents
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
            .setLabel('Page 1: Setup Overview')
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
            .setLabel('Page 5: Transaction Settings')
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
            .setLabel('Page 9: Match Settings')
            .setValue('9')
            .setDefault(currentPage === 9),
          new StringSelectMenuOptionBuilder()
            .setLabel('Page 10: Review & Finish')
            .setValue('10')
            .setDefault(currentPage === 10)
        ])
    );
}

// Set user as admin handler
async function handleSetAdmin(interaction: ButtonInteraction, userId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  const guild = interaction.guild;
  
  if (!serverId || !guild) {
    await interaction.editReply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.' });
    return;
  }
  
  try {
    // Get settings or create new settings if they don't exist
    let settings = await storage.getSettings(serverId);
    
    if (!settings) {
      settings = await storage.createSettings({
        serverId,
        guildName: guild.name,
        prefix: '!',
        locale: 'ar',
        teamRosterCap: 30,
        winCurrency: 10000000, // 10 million
        lossCurrency: 5000000, // 5 million
        defaultCurrency: 50000000, // 50 million
        setupComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await interaction.editReply({ content: `تم تعيين المستخدم <@${userId}> كمسؤول للدوري.` });
    } else {
      // Update settings
      await storage.updateSettings(serverId, {
        updatedAt: new Date()
      });
      
      await interaction.editReply({ content: `تم تحديث المستخدم <@${userId}> كمسؤول للدوري. وتم حفظ ID: ${userId}` });
    }
    
    // Create admin role or assign existing role
    try {
      let adminRole = guild.roles.cache.find(role => 
        role.name.toLowerCase().includes('admin') || 
        role.name.toLowerCase().includes('owner') ||
        role.name.toLowerCase().includes('مسؤول')
      );
      
      if (!adminRole) {
        adminRole = await guild.roles.create({
          name: 'League Admin',
          color: '#FF0000',
          reason: 'League administration role'
        });
      }
      
      // Find the member and add the role
      const member = await guild.members.fetch(userId);
      if (member) {
        await member.roles.add(adminRole);
      }
    } catch (roleError) {
      console.error('Error managing admin role:', roleError);
      // Continue execution even if role assignment fails
    }
    
    // Refresh the setup page
    setTimeout(async () => {
      try {
        await showSetupPage(interaction, 1);
      } catch (refreshError) {
        console.error('Error refreshing setup page:', refreshError);
      }
    }, 1000);
  } catch (error) {
    console.error('Error setting admin user:', error);
    await interaction.editReply({ content: `حدث خطأ أثناء تعيين المسؤول. الرجاء المحاولة مرة أخرى. خطأ: ${error.message}` });
  }
}

// Add team handler
async function handleAddTeam(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  await interaction.showModal({
    title: 'Add New Team',
    customId: 'add_team_modal',
    components: [
      new ActionRowBuilder<any>().addComponents(
        new TextInputBuilder()
          .setCustomId('team_name')
          .setLabel('Team Name')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Manchester United')
          .setRequired(true)
      ),
      new ActionRowBuilder<any>().addComponents(
        new TextInputBuilder()
          .setCustomId('team_emoji')
          .setLabel('Team Emoji')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('🔴')
          .setMinLength(1)
          .setMaxLength(2)
          .setRequired(true)
      ),
      new ActionRowBuilder<any>().addComponents(
        new TextInputBuilder()
          .setCustomId('team_role_id')
          .setLabel('Team Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Copy role ID from Discord (right-click on role)')
          .setRequired(true)
      )
    ]
  });
  
  // Modal submission will be handled by the modal submit event handler
}

// Edit team handler
async function handleEditTeam(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.reply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.', ephemeral: true });
    return;
  }
  
  try {
    // Get all teams for this server
    const teams = await storage.getTeams(serverId);
    
    if (teams.length === 0) {
      await interaction.reply({ content: 'لا توجد فرق لتعديلها. قم بإضافة فريق أولاً.', ephemeral: true });
      return;
    }
    
    // Create select menu with team options
    const teamOptions = teams.map(team => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${team.emoji} ${team.name}`)
        .setValue(team.id.toString())
        .setDescription(`Role ID: ${team.roleId}`);
    });
    
    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('edit_team_select')
          .setPlaceholder('Select team to edit')
          .addOptions(teamOptions)
      );
    
    await interaction.reply({
      content: 'اختر الفريق الذي تريد تعديله:',
      components: [selectMenu],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error handling edit team:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تحميل الفرق. الرجاء المحاولة مرة أخرى.', ephemeral: true });
  }
}

// Remove team handler
async function handleRemoveTeam(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.reply({ content: 'Error: Server ID not found.', ephemeral: true });
    return;
  }
  
  try {
    // Get all teams for this server
    const teams = await storage.getTeams(serverId);
    
    if (teams.length === 0) {
      await interaction.reply({ content: 'No teams to remove.', ephemeral: true });
      return;
    }
    
    // Create select menu with team options
    const teamOptions = teams.map(team => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${team.emoji} ${team.name}`)
        .setValue(team.id.toString())
        .setDescription(`Role ID: ${team.roleId}`);
    });
    
    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('remove_team_select')
          .setPlaceholder('Select team to remove')
          .addOptions(teamOptions)
      );

    // Add confirmation button  
    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_remove_team')
          .setLabel('Confirm Remove')
          .setStyle(ButtonStyle.Danger)
      );
    
    if (interaction.deferred) {
      await interaction.editReply({
        content: 'Select the team to remove:',
        components: [selectMenu, confirmRow],
      });
    } else {
      await interaction.reply({
        content: 'Select the team to remove:',
        components: [selectMenu, confirmRow],
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling remove team:', error);
    const response = { content: 'Error loading teams. Please try again.', ephemeral: true };
    if (interaction.deferred) {
      await interaction.editReply(response);
    } else {
      await interaction.reply(response);
    }
  }
}

// Add coach handler
async function handleAddCoach(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  await interaction.showModal({
    title: 'Add New Coach',
    customId: 'add_coach_modal',
    components: [
      new ActionRowBuilder<any>().addComponents(
        new TextInputBuilder()
          .setCustomId('coach_name')
          .setLabel('Coach Name')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Head Coach')
          .setRequired(true)
      ),
      new ActionRowBuilder<any>().addComponents(
        new TextInputBuilder()
          .setCustomId('coach_short_code')
          .setLabel('Coach Short Code')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('HC')
          .setMinLength(1)
          .setMaxLength(3)
          .setRequired(true)
      ),
      new ActionRowBuilder<any>().addComponents(
        new TextInputBuilder()
          .setCustomId('coach_role_id')
          .setLabel('Coach Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Copy role ID from Discord (right-click on role)')
          .setRequired(true)
      )
    ]
  });
  
  // Modal submission will be handled by the modal submit event handler
}

// Assign coach handler
async function handleAssignCoach(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.reply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.', ephemeral: true });
    return;
  }
  
  try {
    // Get all coaches for this server
    const coaches = await storage.getCoaches(serverId);
    
    if (coaches.length === 0) {
      await interaction.reply({ content: 'لا توجد أدوار المدربين لتعيينها. قم بإضافة دور مدرب أولاً.', ephemeral: true });
      return;
    }
    
    // Create select menu with coach options
    const coachOptions = coaches.map(coach => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${coach.shortCode} ${coach.name}`)
        .setValue(coach.id.toString())
        .setDescription(`Role ID: ${coach.roleId}`);
    });
    
    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('assign_coach_select')
          .setPlaceholder('Select coach to assign')
          .addOptions(coachOptions)
      );
    
    await interaction.reply({
      content: 'اختر المدرب الذي تريد تعيينه:',
      components: [selectMenu],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error handling assign coach:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تحميل المدربين. الرجاء المحاولة مرة أخرى.', ephemeral: true });
  }
}

// Remove coach handler
async function handleRemoveCoach(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.reply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.', ephemeral: true });
    return;
  }
  
  try {
    // Get all coaches for this server
    const coaches = await storage.getCoaches(serverId);
    
    if (coaches.length === 0) {
      await interaction.reply({ content: 'لا توجد أدوار مدربين لحذفها.', ephemeral: true });
      return;
    }
    
    // Create select menu with coach options
    const coachOptions = coaches.map(coach => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${coach.shortCode} ${coach.name}`)
        .setValue(coach.id.toString())
        .setDescription(`Role ID: ${coach.roleId}`);
    });
    
    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('remove_coach_select')
          .setPlaceholder('Select coach to remove')
          .addOptions(coachOptions)
      );
    
    await interaction.reply({
      content: 'اختر المدرب الذي تريد حذفه:',
      components: [selectMenu],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error handling remove coach:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تحميل المدربين. الرجاء المحاولة مرة أخرى.', ephemeral: true });
  }
}

// Detect coaches handler
async function handleDetectCoaches(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.' });
    return;
  }
  
  try {
    // Get server roles
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: 'خطأ: لم يتم العثور على السيرفر.' });
      return;
    }
    
    // Get roles that might be coach roles
    const roles = await guild.roles.fetch();
    const potentialCoachRoles = roles.filter(role => 
      role.name.toLowerCase().includes('coach') || 
      role.name.toLowerCase().includes('مدرب') ||
      role.name.toLowerCase().includes('manager')
    );
    
    if (potentialCoachRoles.size === 0) {
      await interaction.editReply({ content: 'لم يتم العثور على أي أدوار محتملة للمدربين. قم بإنشاء أدوار للمدربين ثم حاول مرة أخرى.' });
      return;
    }
    
    let addedCount = 0;
    
    // Add each potential coach role
    for (const [id, role] of potentialCoachRoles) {
      // Check if coach role already exists
      const existingCoach = await storage.getCoachByRoleId(serverId, id);
      if (!existingCoach) {
        // Get a short code from the role name (first letter of each word)
        let shortCode = '';
        const words = role.name.split(/\s+/);
        if (words.length === 1) {
          // If only one word, take first two letters
          shortCode = words[0].substring(0, 2).toUpperCase();
        } else {
          // Take first letter of each word
          for (const word of words) {
            if (word.length > 0) {
              shortCode += word[0].toUpperCase();
            }
          }
        }
        
        // Limit to 3 characters
        shortCode = shortCode.substring(0, 3);
        
        // Create the coach
        await storage.createCoach({
          name: role.name,
          serverId,
          roleId: id,
          shortCode,
          createdAt: new Date()
        });
        
        addedCount++;
      }
    }
    
    await interaction.editReply({ content: `تم اكتشاف وإضافة ${addedCount} من أدوار المدربين.` });
    
    // Refresh the setup page
    setTimeout(async () => {
      await showSetupPage(interaction, 3);
    }, 1000);
    
  } catch (error) {
    console.error('Error detecting coaches:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء اكتشاف أدوار المدربين. الرجاء المحاولة مرة أخرى.' });
  }
}

export const setupCommands = [
  setupCommand,
  setupArabicCommand
];