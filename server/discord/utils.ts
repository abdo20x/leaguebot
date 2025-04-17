import { 
  Client, 
  GuildMember, 
  Role, 
  Guild, 
  Channel, 
  ChannelType, 
  TextChannel, 
  User 
} from "discord.js";
import { storage } from "../storage";

// Format currency to display with symbol and commas
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  })}`;
}

// Calculate roster percentage for visual representation
export function getRosterPercentage(current: number, max: number): { color: string, percentage: number } {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  let color = '#2ecc71'; // Green
  if (percentage > 80) {
    color = '#e74c3c'; // Red
  } else if (percentage > 50) {
    color = '#f39c12'; // Orange
  }
  
  return { color, percentage };
}

// Check if member has a specific role
export async function hasRole(
  member: GuildMember,
  roleId: string
): Promise<boolean> {
  return member.roles.cache.has(roleId);
}

// Get team by role ID
export async function getTeamByRoleId(
  serverId: string,
  roleId: string
): Promise<any | null> {
  try {
    const team = await storage.getTeamByRoleId(serverId, roleId);
    return team || null;
  } catch (error) {
    console.error('Error getting team by role ID:', error);
    return null;
  }
}

// Find a channel by its ID or name
export async function findChannel(
  client: Client,
  serverId: string,
  channelId: string
): Promise<Channel | null> {
  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return null;
    
    return guild.channels.cache.get(channelId) || null;
  } catch (error) {
    console.error('Error finding channel:', error);
    return null;
  }
}

// Send a message to a specific channel
export async function sendToChannel(
  client: Client,
  serverId: string,
  channelId: string,
  content: any
): Promise<boolean> {
  try {
    const channel = await findChannel(client, serverId, channelId);
    
    if (!channel || channel.type !== ChannelType.GuildText) {
      return false;
    }
    
    const textChannel = channel as TextChannel;
    await textChannel.send(content);
    return true;
  } catch (error) {
    console.error('Error sending to channel:', error);
    return false;
  }
}

// Find a role in a guild by its ID
export function findRole(guild: Guild, roleId: string): Role | undefined {
  return guild.roles.cache.get(roleId);
}

// Validate if a string is a valid emoji
export function isValidEmoji(emoji: string): boolean {
  const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\u2694-\u2697]|\ud83e[\udd10-\udd5d]|[\u2600-\u26FF])$/;
  return emojiRegex.test(emoji) || /:[a-zA-Z0-9_]+:/.test(emoji);
}

// Parse team name from message content
export function parseTeamName(content: string): string | null {
  const teamNameRegex = /team:\s*([^\n]+)/i;
  const match = content.match(teamNameRegex);
  return match ? match[1].trim() : null;
}

// Generate a unique team ID
export function generateTeamId(serverId: string, name: string): string {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${serverId}-${normalizedName}`;
}

// Send a DM to a user
export async function sendDM(user: User, content: any): Promise<void> {
  try {
    const dm = await user.createDM();
    await dm.send(content);
  } catch (error) {
    console.error('Error sending DM:', error);
  }
}

// Check if text contains Arabic characters
export function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

// Update roster count for a team
export async function updateRosterCount(teamId: number): Promise<void> {
  try {
    // Get all players in the team
    const players = await storage.getPlayersByTeam(teamId);
    
    // Update the team's roster count
    await storage.updateTeam(teamId, {
      rosterCount: players.length,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating roster count:', error);
  }
}

// Add a delay (sleep) function
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}