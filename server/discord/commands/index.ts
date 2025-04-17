import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, REST, Routes } from 'discord.js';
import { setupCommands } from './setup';
import { rosterCommands } from './roster';
import { playerManagementCommands } from './playerManagement';

// Create commands collection
const commands = new Collection<string, any>();

// Register all commands
export function registerCommands(client: Client, token: string) {
  const commandsArray = [
    ...setupCommands, 
    ...rosterCommands,
    ...playerManagementCommands,
    // Add more commands here
  ];
  
  // Add all commands to the collection
  commandsArray.forEach((command) => {
    commands.set(command.data.name, command);
  });
  
  // Register slash commands with Discord
  const rest = new REST().setToken(token);
  
  (async () => {
    try {
      console.log(`Started refreshing ${commandsArray.length} application (/) commands.`);
      
      // The put method is used to fully refresh all commands
      await rest.put(
        Routes.applicationCommands(client.user?.id || ''),
        { body: commandsArray.map(command => command.data.toJSON()) },
      );
      
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  })();
  
  return commands;
}

// Handle command execution
export async function handleCommand(client: Client, commands: Collection<string, any>, interaction: ChatInputCommandInteraction) {
  const command = commands.get(interaction.commandName);
  
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`, error);
    const reply = {
      content: 'حدث خطأ أثناء تنفيذ هذا الأمر. الرجاء المحاولة مرة أخرى.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}