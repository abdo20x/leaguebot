// User permissions management

interface RolePermission {
  id: string;
  name: string;
  description?: string;
  commands: string[];
}

// Define roles and their permissions
export const roles: { [key: string]: RolePermission } = {
  OPERATOR: {
    id: "operator",
    name: "Operator",
    description: "Allows users to use every command that the bot has",
    commands: ["*"] // Wildcard for all commands
  },
  MANAGER: {
    id: "manager",
    name: "Manager",
    description: "Allows users to use franchise commands plus blacklist & waitlist commands",
    commands: [
      "setup",
      "teams.add",
      "teams.view",
      "teams.edit",
      "teams.remove",
      "teamsalaries",
      "teamowners",
      "teamtemplates",
      "coach.add",
      "coach.remove",
      "coach.assign",
      "players.add",
      "players.remove",
      "players.transfer",
      "currency.award",
      "currency.deduct",
      "blacklist",
      "waitlist",
      "challenge.decide"
    ]
  },
  CAPTAIN: {
    id: "captain",
    name: "Captain",
    description: "Team captain role for approving transfers and managing the team",
    commands: [
      "roster.view",
      "transfer.approve",
      "transfer.reject",
      "transfer.request",
      "team.info"
    ]
  },
  COACH: {
    id: "coach",
    name: "Coach",
    description: "Assigned to a team to help manage the roster",
    commands: [
      "roster.view",
      "team.info"
    ]
  },
  REFEREE: {
    id: "referee",
    name: "Referee",
    description: "For officiating matches and reporting results",
    commands: [
      "match.result",
      "match.schedule",
      "match.cancel"
    ]
  },
  STREAMER: {
    id: "streamer",
    name: "Streamer",
    description: "Allows users to use /stream",
    commands: [
      "stream"
    ]
  }
};

// Get allowed commands for a role
export function getAllowedCommands(roleId: string): string[] {
  const role = Object.values(roles).find(r => r.id === roleId);
  return role ? role.commands : [];
}

// Check if a user with roleIds can use a command
export function canUseCommand(roleIds: string[], command: string): boolean {
  // If user has operator role, allow all commands
  if (roleIds.includes(roles.OPERATOR.id)) {
    return true;
  }
  
  // Check each role if it allows the command
  for (const roleId of roleIds) {
    const role = Object.values(roles).find(r => r.id === roleId);
    
    if (role) {
      // Check for direct match or wildcard
      if (role.commands.includes("*") || role.commands.includes(command)) {
        return true;
      }
      
      // Check for command category (e.g., "teams.add" matches "teams.*")
      const commandCategory = command.split(".")[0] + ".*";
      if (role.commands.includes(commandCategory)) {
        return true;
      }
    }
  }
  
  return false;
}

// Get role IDs for a Discord server from our database
export async function getServerRoleIds(serverId: string): Promise<{ [key: string]: string }> {
  // In a real implementation, this would fetch from database
  // For now, return empty object as placeholder
  return {};
}

// Map role IDs to our internal role types
export function mapRoleIdsToTypes(roleIds: string[], serverRoleMap: { [key: string]: string }): string[] {
  const mappedRoles: string[] = [];
  
  for (const roleId of roleIds) {
    // Check if this Discord role ID maps to one of our system roles
    for (const [roleType, discordRoleId] of Object.entries(serverRoleMap)) {
      if (roleId === discordRoleId) {
        mappedRoles.push(roleType.toLowerCase());
      }
    }
  }
  
  return mappedRoles;
}
