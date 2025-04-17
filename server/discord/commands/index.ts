// Command registration and handling
import { Client, Collection, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { setupCommand } from "./setup";
import { teamsCommands } from "./teams";
import { rosterCommands } from "./roster";
import { coachCommands } from "./coach";
import { transferCommands } from "./transfer";
import { currencyCommands } from "./currency";
import { canUseCommand } from "../permissions";
import { getTranslation, detectLanguage } from "../translations";

// Command interface
export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  permissionCheck?: (interaction: ChatInputCommandInteraction) => Promise<boolean>;
}

// Register all commands
export function registerCommands(client: Client, token: string): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  
  // Add commands to collection
  commands.set("setup", setupCommand);
  
  // Add team commands
  teamsCommands.forEach(cmd => {
    commands.set(cmd.data.name, cmd);
  });
  
  // Add roster commands
  rosterCommands.forEach(cmd => {
    commands.set(cmd.data.name, cmd);
  });
  
  // Add coach commands
  coachCommands.forEach(cmd => {
    commands.set(cmd.data.name, cmd);
  });
  
  // Add transfer commands
  transferCommands.forEach(cmd => {
    commands.set(cmd.data.name, cmd);
  });
  
  // Add currency commands
  currencyCommands.forEach(cmd => {
    commands.set(cmd.data.name, cmd);
  });
  
  // Register Arabic command aliases
  const arabicCommands = createArabicCommandAliases([
    ...teamsCommands,
    ...rosterCommands,
    ...coachCommands,
    ...transferCommands,
    ...currencyCommands
  ]);
  
  arabicCommands.forEach(cmd => {
    commands.set(cmd.data.name, cmd);
  });
  
  // Register slash commands with Discord API
  deployCommands(client, token, commands);
  
  return commands;
}

// Create Arabic command aliases
function createArabicCommandAliases(commands: Command[]): Command[] {
  const arabicCommands: Command[] = [];
  
  const commandMap: { [key: string]: string } = {
    "teams": "فرق",
    "roster": "روستر",
    "coach": "مدرب",
    "transfer": "تحويل",
    "currency": "عملة",
    "add": "إضافة",
    "remove": "إزالة",
    "view": "عرض",
    "edit": "تعديل"
  };
  
  commands.forEach(command => {
    // Create Arabic version of command
    const arabicName = commandMap[command.data.name] || `ar_${command.data.name}`;
    if (commandMap[command.data.name]) {
      const arabicCommand = { ...command };
      
      // Clone the SlashCommandBuilder and update its name and description
      const arabicData = new SlashCommandBuilder()
        .setName(arabicName)
        .setDescription(`(Arabic) ${command.data.description}`);
      
      // Copy options from original command
      if (command.data.options) {
        // We need to manually recreate options due to SlashCommandBuilder limitations
        // This is a simplified implementation
        arabicCommand.data = arabicData;
        arabicCommands.push(arabicCommand);
      }
    }
  });
  
  return arabicCommands;
}

// Deploy commands to Discord
async function deployCommands(client: Client, token: string, commands: Collection<string, Command>) {
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    const commandsData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
    
    console.log(`Started refreshing ${commandsData.length} application (/) commands.`);
    
    if (client.application) {
      // Register commands globally - for production
      await rest.put(
        Routes.applicationCommands(client.application.id),
        { body: commandsData }
      );
    }
    
    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

// Handle command interactions
export async function handleCommand(client: Client, commands: Collection<string, Command>, interaction: ChatInputCommandInteraction) {
  const command = commands.get(interaction.commandName);
  
  if (!command) {
    await interaction.reply({ content: 'Command not found!', ephemeral: true });
    return;
  }
  
  try {
    // Check permissions if permission check exists
    if (command.permissionCheck) {
      const hasPermission = await command.permissionCheck(interaction);
      if (!hasPermission) {
        // Get language from user's message
        const locale = detectLanguage(interaction.commandName);
        await interaction.reply({ 
          content: getTranslation("error_permission", locale), 
          ephemeral: true 
        });
        return;
      }
    }
    
    // Execute command
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    
    // Handle error response
    const errorMessage = 'There was an error executing this command!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}
