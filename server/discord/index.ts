import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection,
  Events,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction
} from 'discord.js';
import { registerCommands, handleCommand } from './commands';
import { setupCommand } from './commands/setup';
import { storage } from '../storage';

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

// Store stats for dashboard
let botStats = {
  servers: 0,
  teams: 0,
  players: 0,
  transactions: 0,
  coaches: 0,
  uptime: 0,
  startTime: Date.now()
};

// Store status
let botStatus = {
  online: false,
  lastRestart: Date.now(),
  guilds: [] as {id: string, name: string, memberCount: number}[]
};

// Flag to track if discord bot has been initialized
let botInitialized = false;

// Store temporary application data for users
interface UserApplication {
  serverId: string;
  position?: string;
  stats?: string;
  preferredTeam?: string;
}

let userApplicationData: {[userId: string]: UserApplication} = {};

// Initialize Discord bot
export async function initializeBot(token: string) {
  try {
    // Register commands
    const commands = registerCommands(client, token);
    
    // Event listeners
    client.once(Events.ClientReady, async c => {
      console.log(`Discord bot ready! Logged in as ${c.user.tag}`);
      botStatus.online = true;
      botInitialized = true;
      botStatus.guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount
      }));

      // Update stats
      updateBotStats();
      
      // Set activity status
      client.user?.setActivity('/setup | Win Lock Community', { type: 2 }); // 2 is "Listening to"
    });
    
    // Handle command interactions
    client.on(Events.InteractionCreate, async interaction => {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        await handleCommand(client, commands, interaction);
      }
      
      // Handle button interactions for setup wizard
      if (interaction.isButton()) {
        const buttonInteraction = interaction as ButtonInteraction;
        try {
          if (buttonInteraction.customId.startsWith('setup_')) {
            await setupCommand.handleButton(buttonInteraction);
          }
        } catch (error) {
          console.error('Error handling button interaction:', error);
          await buttonInteraction.reply({ 
            content: 'An error occurred while processing the button. Please try again.',
            ephemeral: true 
          });
        }
        if (buttonInteraction.customId.startsWith('transaction_')) {
          // Handle transaction buttons
          // This would be implemented in the specific command handlers
        }
      }
      
      // Handle select menu interactions
      if (interaction.isStringSelectMenu()) {
        const selectMenuInteraction = interaction as StringSelectMenuInteraction;
        
        // Setup menu interactions
        if (selectMenuInteraction.customId === 'setup_page_select' || 
            selectMenuInteraction.customId === 'setup_team_type' || 
            selectMenuInteraction.customId === 'setup_coach_type' ||
            selectMenuInteraction.customId.startsWith('setup_')) {
          await setupCommand.handleSelectMenu(selectMenuInteraction);
        }
        // Handle other select menu interactions
        else if (selectMenuInteraction.customId.startsWith('sign_team_')) {
          const teamId = selectMenuInteraction.values[0];
          await processTeamSelection(selectMenuInteraction.user, serverId, parseInt(teamId));
        }
        }
        
        // Free agent application position selection
        else if (selectMenuInteraction.customId === 'position_select') {
          const position = selectMenuInteraction.values[0];
          const user = selectMenuInteraction.user;
          
          // Store position in temporary user application data
          userApplicationData[user.id] = {
            ...userApplicationData[user.id] || {},
            position,
            serverId: userApplicationData[user.id]?.serverId || ''
          };
          
          // Send confirmation and ask for stats
          await selectMenuInteraction.reply({ 
            content: `تم اختيار المركز: ${position}. الآن سنسألك عن إحصائياتك.`, 
            ephemeral: true 
          });
          
          // Import and call askStatsQuestion
          const { askStatsQuestion } = require('./commands/freeAgent');
          await askStatsQuestion(user, position);
          
          // Set up message collector for stats
          const dmChannel = await user.createDM();
          const filter = (m: any) => m.author.id === user.id;
          const collector = dmChannel.createMessageCollector({ filter, time: 300000, max: 1 });
          
          collector.on('collect', async (m) => {
            const stats = m.content;
            
            // Store stats
            userApplicationData[user.id] = {
              ...userApplicationData[user.id],
              stats
            };
            
            // Show team selection
            const { askPreferredTeamQuestion } = require('./commands/freeAgent');
            await askPreferredTeamQuestion(user, userApplicationData[user.id].serverId || '');
          });
        }
        
        // Free agent application team selection
        else if (selectMenuInteraction.customId === 'team_select') {
          const teamId = selectMenuInteraction.values[0];
          const user = selectMenuInteraction.user;
          
          // Store team preference
          userApplicationData[user.id] = {
            ...userApplicationData[user.id],
            preferredTeam: teamId
          };
          
          // Send confirmation
          await selectMenuInteraction.reply({ 
            content: `تم اختيار الفريق. جاري معالجة طلبك...`, 
            ephemeral: true 
          });
          
          // Submit the application
          const { submitApplication } = require('./commands/freeAgent');
          const userData = userApplicationData[user.id];
          
          if (userData && userData.position && userData.stats && userData.preferredTeam && userData.serverId) {
            await submitApplication(
              user,
              userData.serverId,
              userData.position,
              userData.stats,
              userData.preferredTeam
            );
            
            // Clear the data after submission
            delete userApplicationData[user.id];
          } else {
            await user.send('حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى باستخدام أمر `/تقديم`.');
          }
        }
      }
      
      // Handle modal submissions
      if (interaction.isModalSubmit()) {
        const modalInteraction = interaction as ModalSubmitInteraction;
        
        // Handle team creation modal
        if (modalInteraction.customId === 'add_team_modal') {
          await handleAddTeamModal(modalInteraction);
        }
        
        // Handle coach creation modal
        if (modalInteraction.customId === 'add_coach_modal') {
          await handleAddCoachModal(modalInteraction);
        }
      }
    });
    
    // Setup interval to update stats
    setInterval(updateBotStats, 60000); // Update every minute
    
    // Login to Discord
    await client.login(token);
    botInitialized = true;
    
    return client;
  } catch (error) {
    console.error('Error initializing Discord bot:', error);
    botStatus.online = false;
    botInitialized = false;
    throw error;
  }
}

// Update bot statistics
async function updateBotStats() {
  try {
    // Count total teams, players, and transactions across all servers
    let totalTeams = 0;
    let totalPlayers = 0;
    let totalTransactions = 0;
    let totalCoaches = 0;
    
    // Process each server - convert to array first to avoid iterator issues
    const guilds = Array.from(client.guilds.cache.values());
    for (const guild of guilds) {
      const serverId = guild.id;
      
      // Count teams
      const teams = await storage.getTeams(serverId);
      totalTeams += teams.length;
      
      // For each team, count players
      for (const team of teams) {
        const players = await storage.getPlayersByTeam(team.id);
        totalPlayers += players.length;
      }
      
      // Count transactions
      const transactions = await storage.getTransactions(serverId);
      totalTransactions += transactions.length;
      
      // Count coaches
      const coaches = await storage.getCoaches(serverId);
      totalCoaches += coaches.length;
    }
    
    // Update stats
    botStats = {
      servers: client.guilds.cache.size,
      teams: totalTeams,
      players: totalPlayers,
      transactions: totalTransactions,
      coaches: totalCoaches,
      uptime: Date.now() - botStats.startTime,
      startTime: botStats.startTime
    };
    
    // Update guild list
    botStatus.guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount
    }));
    
  } catch (error) {
    console.error('Error updating bot stats:', error);
  }
}

// Get bot status
export function getBotStatus() {
  // If the bot isn't initialized, return a placeholder status
  if (!botInitialized && !botStatus.online) {
    return {
      online: false,
      lastRestart: Date.now(),
      uptime: 0,
      message: "Discord bot is not connected. Add a Discord bot token to enable full functionality."
    };
  }
  
  return {
    ...botStatus,
    uptime: Date.now() - botStats.startTime
  };
}

// Get bot statistics
export function getBotStats() {
  // If the bot isn't initialized, return placeholder stats
  if (!botInitialized && !botStatus.online) {
    return {
      servers: 0,
      teams: 0, 
      players: 0,
      transactions: 0,
      coaches: 0,
      uptime: 0,
      startTime: Date.now(),
      message: "Discord bot is not connected. Add a Discord bot token to enable full functionality."
    };
  }
  
  return botStats;
}

// Get list of guilds
export function getGuilds() {
  // If the bot isn't initialized, return an empty array
  if (!botInitialized && !botStatus.online) {
    return [];
  }
  
  return botStatus.guilds;
}

// Handler for team creation modal
async function handleAddTeamModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.' });
    return;
  }
  
  try {
    // Get values from modal
    const teamName = interaction.fields.getTextInputValue('team_name');
    const teamEmoji = interaction.fields.getTextInputValue('team_emoji');
    const roleId = interaction.fields.getTextInputValue('team_role_id');
    
    // Validate emoji
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    if (!emojiRegex.test(teamEmoji) && teamEmoji.length > 2) {
      await interaction.editReply({ content: 'يرجى استخدام رمز تعبيري واحد (emoji) فقط.' });
      return;
    }
    
    // Check if role exists
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: 'خطأ: لم يتم العثور على السيرفر.' });
      return;
    }
    
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      await interaction.editReply({ content: 'خطأ: لم يتم العثور على الدور بمعرف الدور المحدد.' });
      return;
    }
    
    // Check if team already exists with this role ID
    const existingTeamWithRole = await storage.getTeamByRoleId(serverId, roleId);
    if (existingTeamWithRole) {
      await interaction.editReply({ content: `هناك فريق موجود بالفعل بهذا الدور: ${existingTeamWithRole.name}` });
      return;
    }
    
    // Check if team already exists with this emoji
    const existingTeamWithEmoji = await storage.getTeamByEmoji(serverId, teamEmoji);
    if (existingTeamWithEmoji) {
      await interaction.editReply({ content: `هناك فريق موجود بالفعل بهذا الرمز التعبيري: ${existingTeamWithEmoji.name}` });
      return;
    }
    
    // Generate a unique team ID
    const teamId = `${serverId}_${teamName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Get settings for default values
    const settings = await storage.getSettings(serverId);
    const defaultCurrency = settings?.defaultCurrency || 50000000; // 50 million default
    const rosterMax = settings?.teamRosterCap || 30;
    
    // Create the team
    const team = await storage.createTeam({
      serverId,
      teamId,
      name: teamName,
      emoji: teamEmoji,
      roleId,
      currency: defaultCurrency,
      rosterCount: 0,
      rosterMax,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await interaction.editReply({ content: `تم إنشاء الفريق ${teamEmoji} ${teamName} بنجاح!` });
    
    // Refresh the setup page - page 2 is teams setup
    setTimeout(async () => {
      try {
        // Create a new button interaction to pass to showSetupPage
        const message = await interaction.fetchReply();
        const buttonInteraction = {
          guildId: serverId,
          guild: guild,
          replied: true,
          deferred: true,
          // @ts-ignore - this is a simplified mock for the showSetupPage function
          editReply: async (options: any) => {
            return await interaction.editReply(options);
          },
          deferUpdate: async () => {
            return await Promise.resolve();
          }
        } as any;
        
        // Import and call the showSetupPage function
        const { showSetupPage } = require('./commands/setup');
        await showSetupPage(buttonInteraction, 2);
      } catch (error) {
        console.error('Error refreshing setup page:', error);
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error handling add team modal:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء الفريق. الرجاء المحاولة مرة أخرى.' });
  }
}

// Handler for coach creation modal
async function handleAddCoachModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'خطأ: لم يتم العثور على معرف السيرفر.' });
    return;
  }
  
  try {
    // Get values from modal
    const coachName = interaction.fields.getTextInputValue('coach_name');
    const shortCode = interaction.fields.getTextInputValue('coach_short_code').toUpperCase();
    const roleId = interaction.fields.getTextInputValue('coach_role_id');
    
    // Validate shortcode (3 chars max)
    if (shortCode.length > 3) {
      await interaction.editReply({ content: 'الرمز المختصر يجب أن يكون 3 أحرف كحد أقصى.' });
      return;
    }
    
    // Check if role exists
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: 'خطأ: لم يتم العثور على السيرفر.' });
      return;
    }
    
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      await interaction.editReply({ content: 'خطأ: لم يتم العثور على الدور بمعرف الدور المحدد.' });
      return;
    }
    
    // Check if coach already exists with this role ID
    const existingCoachWithRole = await storage.getCoachByRoleId(serverId, roleId);
    if (existingCoachWithRole) {
      await interaction.editReply({ content: `هناك مدرب موجود بالفعل بهذا الدور: ${existingCoachWithRole.name}` });
      return;
    }
    
    // Check if coach already exists with this shortCode
    const existingCoachWithShortCode = await storage.getCoachByShortCode(serverId, shortCode);
    if (existingCoachWithShortCode) {
      await interaction.editReply({ content: `هناك مدرب موجود بالفعل بهذا الرمز المختصر: ${existingCoachWithShortCode.name}` });
      return;
    }
    
    // Create the coach
    const coach = await storage.createCoach({
      serverId,
      name: coachName,
      shortCode,
      roleId,
      createdAt: new Date()
    });
    
    await interaction.editReply({ content: `تم إنشاء المدرب ${shortCode} ${coachName} بنجاح!` });
    
    // Refresh the setup page - page 3 is coaches setup
    setTimeout(async () => {
      try {
        // Create a new button interaction to pass to showSetupPage
        const message = await interaction.fetchReply();
        const buttonInteraction = {
          guildId: serverId,
          guild: guild,
          replied: true,
          deferred: true,
          // @ts-ignore - this is a simplified mock for the showSetupPage function
          editReply: async (options: any) => {
            return await interaction.editReply(options);
          },
          deferUpdate: async () => {
            return await Promise.resolve();
          }
        } as any;
        
        // Import and call the showSetupPage function
        const { showSetupPage } = require('./commands/setup');
        await showSetupPage(buttonInteraction, 3);
      } catch (error) {
        console.error('Error refreshing setup page:', error);
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error handling add coach modal:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء المدرب. الرجاء المحاولة مرة أخرى.' });
  }
}

// Export the client instance
export default client;
