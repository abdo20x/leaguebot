// Utility functions for Discord bot

import { storage } from "../storage";
import { Client, Guild, TextChannel, GuildMember, Role, User } from "discord.js";

// Format currency (e.g., 5000000 -> 5M)
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return `${amount}`;
}

// Check if user has one of the required roles
export async function hasRole(
  member: GuildMember,
  roles: string[]
): Promise<boolean> {
  return member.roles.cache.some(role => roles.includes(role.id));
}

// Get team details by role ID
export async function getTeamByRoleId(
  serverId: string,
  roleId: string
): Promise<any> {
  return await storage.getTeamByRoleId(serverId, roleId);
}

// Find a channel by ID
export async function findChannel(
  client: Client,
  serverId: string,
  channelId: string
): Promise<TextChannel | null> {
  if (!channelId) return null;
  
  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return null;
    
    const channel = guild.channels.cache.get(channelId) as TextChannel;
    return channel || null;
  } catch (error) {
    console.error("Error finding channel:", error);
    return null;
  }
}

// Send a message to a notification channel
export async function sendToChannel(
  client: Client,
  serverId: string,
  channelId: string,
  message: any
): Promise<void> {
  try {
    const channel = await findChannel(client, serverId, channelId);
    if (channel) {
      await channel.send(message);
    }
  } catch (error) {
    console.error("Error sending to channel:", error);
  }
}

// Calculate roster percentage for color coding
export function getRosterPercentage(current: number, max: number): { color: string, percentage: number } {
  const percentage = (current / max) * 100;
  
  if (percentage < 50) {
    return { color: "#f1c40f", percentage }; // Yellow
  } else if (percentage < 95) {
    return { color: "#2ecc71", percentage }; // Green
  } else {
    return { color: "#e74c3c", percentage }; // Red
  }
}

// Delay function for rate limiting
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Find a role by ID
export function findRole(guild: Guild, roleId: string): Role | undefined {
  return guild.roles.cache.get(roleId);
}

// Validate emoji format
export function isValidEmoji(emoji: string): boolean {
  // Simple validation for standard emoji and custom emoji format
  return /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|<:.+?:\d+>)/u.test(emoji);
}

// Parse team name from message content
export function parseTeamName(content: string): string | null {
  const teamNameRegex = /@([^:]+)(?:\s*:\s*([^:]+))?(?:\s*:\s*([^:]+))?(?:\s*:\s*([^:]+))?/;
  const match = content.match(teamNameRegex);
  
  if (match) {
    return match[0];
  }
  
  return null;
}

// Generate a unique team ID
export function generateTeamId(serverId: string, name: string): string {
  return `${serverId}-${name.replace(/\s+/g, '-').toLowerCase()}`;
}

// Send a DM to a user
export async function sendDM(user: User, content: any): Promise<void> {
  try {
    const dm = await user.createDM();
    await dm.send(content);
  } catch (error) {
    console.error("Error sending DM:", error);
  }
}

// Check if a string contains Arabic characters
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Update roster count for a team
export async function updateRosterCount(teamId: number): Promise<void> {
  try {
    const players = await storage.getPlayersByTeam(teamId);
    const team = await storage.getTeam(teamId);
    
    if (team) {
      await storage.updateTeam(teamId, {
        rosterCount: players.length
      });
    }
  } catch (error) {
    console.error("Error updating roster count:", error);
  }
}
