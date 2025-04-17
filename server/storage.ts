import {
  settings,
  channels,
  teams,
  players,
  coaches,
  coachAssignments,
  transactions,
  setupProgress,
  type Settings,
  type InsertSettings,
  type Channels,
  type InsertChannels,
  type Team,
  type InsertTeam,
  type Player,
  type InsertPlayer,
  type Coach,
  type InsertCoach,
  type CoachAssignment,
  type InsertCoachAssignment,
  type Transaction,
  type InsertTransaction,
  type SetupProgress,
  type InsertSetupProgress
} from "@shared/schema";

export interface IStorage {
  // Settings
  getSettings(serverId: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(serverId: string, settings: Partial<InsertSettings>): Promise<Settings | undefined>;
  
  // Channels
  getChannels(serverId: string): Promise<Channels | undefined>;
  createChannels(channels: InsertChannels): Promise<Channels>;
  updateChannels(serverId: string, channels: Partial<InsertChannels>): Promise<Channels | undefined>;
  
  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByRoleId(serverId: string, roleId: string): Promise<Team | undefined>;
  getTeamByEmoji(serverId: string, emoji: string): Promise<Team | undefined>;
  getTeams(serverId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<void>;
  
  // Players
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayerByUserId(serverId: string, userId: string): Promise<Player | undefined>;
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<void>;
  
  // Coaches
  getCoach(id: number): Promise<Coach | undefined>;
  getCoachByRoleId(serverId: string, roleId: string): Promise<Coach | undefined>;
  getCoachByShortCode(serverId: string, shortCode: string): Promise<Coach | undefined>;
  getCoaches(serverId: string): Promise<Coach[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined>;
  deleteCoach(id: number): Promise<void>;
  
  // Coach Assignments
  getCoachAssignment(id: number): Promise<CoachAssignment | undefined>;
  getCoachAssignmentsByTeam(teamId: number): Promise<CoachAssignment[]>;
  getCoachAssignmentsByCoach(coachId: number): Promise<CoachAssignment[]>;
  getCoachAssignmentsByUser(serverId: string, userId: string): Promise<CoachAssignment[]>;
  createCoachAssignment(assignment: InsertCoachAssignment): Promise<CoachAssignment>;
  deleteCoachAssignment(id: number): Promise<void>;
  
  // Transactions
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactions(serverId: string): Promise<Transaction[]>;
  getTransactionsByTeam(teamId: number): Promise<Transaction[]>;
  getPendingTransactions(serverId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  
  // Setup Progress
  getSetupProgress(serverId: string): Promise<SetupProgress | undefined>;
  createSetupProgress(progress: InsertSetupProgress): Promise<SetupProgress>;
  updateSetupProgress(serverId: string, progress: Partial<InsertSetupProgress>): Promise<SetupProgress | undefined>;
}

export class MemStorage implements IStorage {
  private settingsMap: Map<string, Settings>;
  private channelsMap: Map<string, Channels>;
  private teamsMap: Map<number, Team>;
  private playersMap: Map<number, Player>;
  private coachesMap: Map<number, Coach>;
  private coachAssignmentsMap: Map<number, CoachAssignment>;
  private transactionsMap: Map<number, Transaction>;
  private setupProgressMap: Map<string, SetupProgress>;
  
  private nextIds: {
    settings: number;
    channels: number;
    teams: number;
    players: number;
    coaches: number;
    coachAssignments: number;
    transactions: number;
    setupProgress: number;
  };
  
  constructor() {
    this.settingsMap = new Map();
    this.channelsMap = new Map();
    this.teamsMap = new Map();
    this.playersMap = new Map();
    this.coachesMap = new Map();
    this.coachAssignmentsMap = new Map();
    this.transactionsMap = new Map();
    this.setupProgressMap = new Map();
    
    this.nextIds = {
      settings: 1,
      channels: 1,
      teams: 1,
      players: 1,
      coaches: 1,
      coachAssignments: 1,
      transactions: 1,
      setupProgress: 1
    };
  }
  
  // Settings
  async getSettings(serverId: string): Promise<Settings | undefined> {
    return Array.from(this.settingsMap.values()).find(s => s.serverId === serverId);
  }
  
  async createSettings(settings: InsertSettings): Promise<Settings> {
    const id = this.nextIds.settings++;
    const now = new Date();
    const newSettings: Settings = {
      ...settings,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.settingsMap.set(id, newSettings);
    return newSettings;
  }
  
  async updateSettings(serverId: string, settingsUpdate: Partial<InsertSettings>): Promise<Settings | undefined> {
    const settings = await this.getSettings(serverId);
    if (!settings) return undefined;
    
    const updatedSettings: Settings = {
      ...settings,
      ...settingsUpdate,
      updatedAt: new Date()
    };
    this.settingsMap.set(settings.id, updatedSettings);
    return updatedSettings;
  }
  
  // Channels
  async getChannels(serverId: string): Promise<Channels | undefined> {
    return Array.from(this.channelsMap.values()).find(c => c.serverId === serverId);
  }
  
  async createChannels(channels: InsertChannels): Promise<Channels> {
    const id = this.nextIds.channels++;
    const newChannels: Channels = {
      ...channels,
      id
    };
    this.channelsMap.set(id, newChannels);
    return newChannels;
  }
  
  async updateChannels(serverId: string, channelsUpdate: Partial<InsertChannels>): Promise<Channels | undefined> {
    const channels = await this.getChannels(serverId);
    if (!channels) return undefined;
    
    const updatedChannels: Channels = {
      ...channels,
      ...channelsUpdate
    };
    this.channelsMap.set(channels.id, updatedChannels);
    return updatedChannels;
  }
  
  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teamsMap.get(id);
  }
  
  async getTeamByRoleId(serverId: string, roleId: string): Promise<Team | undefined> {
    return Array.from(this.teamsMap.values()).find(t => t.serverId === serverId && t.roleId === roleId);
  }
  
  async getTeamByEmoji(serverId: string, emoji: string): Promise<Team | undefined> {
    return Array.from(this.teamsMap.values()).find(t => t.serverId === serverId && t.emoji === emoji);
  }
  
  async getTeams(serverId: string): Promise<Team[]> {
    return Array.from(this.teamsMap.values()).filter(t => t.serverId === serverId);
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.nextIds.teams++;
    const now = new Date();
    const newTeam: Team = {
      ...team,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.teamsMap.set(id, newTeam);
    return newTeam;
  }
  
  async updateTeam(id: number, teamUpdate: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = await this.getTeam(id);
    if (!team) return undefined;
    
    const updatedTeam: Team = {
      ...team,
      ...teamUpdate,
      updatedAt: new Date()
    };
    this.teamsMap.set(id, updatedTeam);
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<void> {
    this.teamsMap.delete(id);
  }
  
  // Players
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.playersMap.get(id);
  }
  
  async getPlayerByUserId(serverId: string, userId: string): Promise<Player | undefined> {
    return Array.from(this.playersMap.values()).find(p => p.serverId === serverId && p.userId === userId);
  }
  
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return Array.from(this.playersMap.values()).filter(p => p.teamId === teamId);
  }
  
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.nextIds.players++;
    const now = new Date();
    const newPlayer: Player = {
      ...player,
      id,
      joinedAt: now
    };
    this.playersMap.set(id, newPlayer);
    return newPlayer;
  }
  
  async updatePlayer(id: number, playerUpdate: Partial<InsertPlayer>): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;
    
    const updatedPlayer: Player = {
      ...player,
      ...playerUpdate
    };
    this.playersMap.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  async deletePlayer(id: number): Promise<void> {
    this.playersMap.delete(id);
  }
  
  // Coaches
  async getCoach(id: number): Promise<Coach | undefined> {
    return this.coachesMap.get(id);
  }
  
  async getCoachByRoleId(serverId: string, roleId: string): Promise<Coach | undefined> {
    return Array.from(this.coachesMap.values()).find(c => c.serverId === serverId && c.roleId === roleId);
  }
  
  async getCoachByShortCode(serverId: string, shortCode: string): Promise<Coach | undefined> {
    return Array.from(this.coachesMap.values()).find(c => c.serverId === serverId && c.shortCode === shortCode);
  }
  
  async getCoaches(serverId: string): Promise<Coach[]> {
    return Array.from(this.coachesMap.values()).filter(c => c.serverId === serverId);
  }
  
  async createCoach(coach: InsertCoach): Promise<Coach> {
    const id = this.nextIds.coaches++;
    const now = new Date();
    const newCoach: Coach = {
      ...coach,
      id,
      createdAt: now
    };
    this.coachesMap.set(id, newCoach);
    return newCoach;
  }
  
  async updateCoach(id: number, coachUpdate: Partial<InsertCoach>): Promise<Coach | undefined> {
    const coach = await this.getCoach(id);
    if (!coach) return undefined;
    
    const updatedCoach: Coach = {
      ...coach,
      ...coachUpdate
    };
    this.coachesMap.set(id, updatedCoach);
    return updatedCoach;
  }
  
  async deleteCoach(id: number): Promise<void> {
    this.coachesMap.delete(id);
  }
  
  // Coach Assignments
  async getCoachAssignment(id: number): Promise<CoachAssignment | undefined> {
    return this.coachAssignmentsMap.get(id);
  }
  
  async getCoachAssignmentsByTeam(teamId: number): Promise<CoachAssignment[]> {
    return Array.from(this.coachAssignmentsMap.values()).filter(ca => ca.teamId === teamId);
  }
  
  async getCoachAssignmentsByCoach(coachId: number): Promise<CoachAssignment[]> {
    return Array.from(this.coachAssignmentsMap.values()).filter(ca => ca.coachId === coachId);
  }
  
  async getCoachAssignmentsByUser(serverId: string, userId: string): Promise<CoachAssignment[]> {
    return Array.from(this.coachAssignmentsMap.values()).filter(ca => ca.serverId === serverId && ca.userId === userId);
  }
  
  async createCoachAssignment(assignment: InsertCoachAssignment): Promise<CoachAssignment> {
    const id = this.nextIds.coachAssignments++;
    const now = new Date();
    const newAssignment: CoachAssignment = {
      ...assignment,
      id,
      assignedAt: now
    };
    this.coachAssignmentsMap.set(id, newAssignment);
    return newAssignment;
  }
  
  async deleteCoachAssignment(id: number): Promise<void> {
    this.coachAssignmentsMap.delete(id);
  }
  
  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsMap.get(id);
  }
  
  async getTransactions(serverId: string): Promise<Transaction[]> {
    return Array.from(this.transactionsMap.values()).filter(t => t.serverId === serverId);
  }
  
  async getTransactionsByTeam(teamId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsMap.values()).filter(t => 
      t.sourceTeamId === teamId || t.targetTeamId === teamId
    );
  }
  
  async getPendingTransactions(serverId: string): Promise<Transaction[]> {
    return Array.from(this.transactionsMap.values()).filter(t => 
      t.serverId === serverId && t.status === "pending"
    );
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.nextIds.transactions++;
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.transactionsMap.set(id, newTransaction);
    return newTransaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = {
      ...transaction,
      ...transactionUpdate,
      updatedAt: new Date()
    };
    this.transactionsMap.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  // Setup Progress
  async getSetupProgress(serverId: string): Promise<SetupProgress | undefined> {
    return Array.from(this.setupProgressMap.values()).find(sp => sp.serverId === serverId);
  }
  
  async createSetupProgress(progress: InsertSetupProgress): Promise<SetupProgress> {
    const id = this.nextIds.setupProgress++;
    const now = new Date();
    const newProgress: SetupProgress = {
      ...progress,
      id,
      lastUpdated: now
    };
    this.setupProgressMap.set(id, newProgress);
    return newProgress;
  }
  
  async updateSetupProgress(serverId: string, progressUpdate: Partial<InsertSetupProgress>): Promise<SetupProgress | undefined> {
    const progress = await this.getSetupProgress(serverId);
    if (!progress) return undefined;
    
    const updatedProgress: SetupProgress = {
      ...progress,
      ...progressUpdate,
      lastUpdated: new Date()
    };
    this.setupProgressMap.set(progress.id, updatedProgress);
    return updatedProgress;
  }
}

export const storage = new MemStorage();
