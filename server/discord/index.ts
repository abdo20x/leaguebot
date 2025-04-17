import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection,
  Events,
  ButtonInteraction,
  StringSelectMenuInteraction
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
        if (buttonInteraction.customId.startsWith('setup_')) {
          await setupCommand.handleButton(buttonInteraction);
        } else if (buttonInteraction.customId.startsWith('transaction_')) {
          // Handle transaction buttons
          // This would be implemented in the specific command handlers
        }
      }
      
      // Handle select menu interactions
      if (interaction.isStringSelectMenu()) {
        const selectMenuInteraction = interaction as StringSelectMenuInteraction;
        if (selectMenuInteraction.customId === 'setup_page_select') {
          await setupCommand.handleSelectMenu(selectMenuInteraction);
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

// Export the client instance
export default client;
