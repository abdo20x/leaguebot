import {
  settings, channels, teams, players, coaches, coachAssignments, transactions, setupProgress,
  type Settings, type Channels, type Team, type Player, type Coach, type CoachAssignment, type Transaction, type SetupProgress,
  type InsertSettings, type InsertChannels, type InsertTeam, type InsertPlayer, type InsertCoach, 
  type InsertCoachAssignment, type InsertTransaction, type InsertSetupProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // Settings
  async getSettings(serverId: string): Promise<Settings | undefined> {
    const result = await db.select().from(settings).where(eq(settings.serverId, serverId));
    return result[0];
  }

  async createSettings(setting: InsertSettings): Promise<Settings> {
    const result = await db.insert(settings).values(setting).returning();
    return result[0];
  }

  async updateSettings(serverId: string, setting: Partial<InsertSettings>): Promise<Settings | undefined> {
    const result = await db.update(settings)
      .set(setting)
      .where(eq(settings.serverId, serverId))
      .returning();
    return result[0];
  }

  // Channels
  async getChannels(serverId: string): Promise<Channels | undefined> {
    const result = await db.select().from(channels).where(eq(channels.serverId, serverId));
    return result[0];
  }

  async createChannels(channel: InsertChannels): Promise<Channels> {
    const result = await db.insert(channels).values(channel).returning();
    return result[0];
  }

  async updateChannels(serverId: string, channel: Partial<InsertChannels>): Promise<Channels | undefined> {
    const result = await db.update(channels)
      .set(channel)
      .where(eq(channels.serverId, serverId))
      .returning();
    return result[0];
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  async getTeamByRoleId(serverId: string, roleId: string): Promise<Team | undefined> {
    const result = await db.select().from(teams)
      .where(and(
        eq(teams.serverId, serverId),
        eq(teams.roleId, roleId)
      ));
    return result[0];
  }

  async getTeamByEmoji(serverId: string, emoji: string): Promise<Team | undefined> {
    const result = await db.select().from(teams)
      .where(and(
        eq(teams.serverId, serverId),
        eq(teams.emoji, emoji)
      ));
    return result[0];
  }

  async getTeams(serverId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.serverId, serverId));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const result = await db.update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    return result[0];
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Players
  async getPlayer(id: number): Promise<Player | undefined> {
    const result = await db.select().from(players).where(eq(players.id, id));
    return result[0];
  }

  async getPlayerByUserId(serverId: string, userId: string): Promise<Player | undefined> {
    const result = await db.select().from(players)
      .where(and(
        eq(players.serverId, serverId),
        eq(players.userId, userId)
      ));
    return result[0];
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.teamId, teamId));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const result = await db.insert(players).values(player).returning();
    return result[0];
  }

  async updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined> {
    const result = await db.update(players)
      .set(player)
      .where(eq(players.id, id))
      .returning();
    return result[0];
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  // Coaches
  async getCoach(id: number): Promise<Coach | undefined> {
    const result = await db.select().from(coaches).where(eq(coaches.id, id));
    return result[0];
  }

  async getCoachByRoleId(serverId: string, roleId: string): Promise<Coach | undefined> {
    const result = await db.select().from(coaches)
      .where(and(
        eq(coaches.serverId, serverId),
        eq(coaches.roleId, roleId)
      ));
    return result[0];
  }

  async getCoachByShortCode(serverId: string, shortCode: string): Promise<Coach | undefined> {
    const result = await db.select().from(coaches)
      .where(and(
        eq(coaches.serverId, serverId),
        eq(coaches.shortCode, shortCode)
      ));
    return result[0];
  }

  async getCoaches(serverId: string): Promise<Coach[]> {
    return await db.select().from(coaches).where(eq(coaches.serverId, serverId));
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const result = await db.insert(coaches).values(coach).returning();
    return result[0];
  }

  async updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined> {
    const result = await db.update(coaches)
      .set(coach)
      .where(eq(coaches.id, id))
      .returning();
    return result[0];
  }

  async deleteCoach(id: number): Promise<void> {
    await db.delete(coaches).where(eq(coaches.id, id));
  }

  // Coach Assignments
  async getCoachAssignment(id: number): Promise<CoachAssignment | undefined> {
    const result = await db.select().from(coachAssignments).where(eq(coachAssignments.id, id));
    return result[0];
  }

  async getCoachAssignmentsByTeam(teamId: number): Promise<CoachAssignment[]> {
    return await db.select().from(coachAssignments).where(eq(coachAssignments.teamId, teamId));
  }

  async getCoachAssignmentsByCoach(coachId: number): Promise<CoachAssignment[]> {
    return await db.select().from(coachAssignments).where(eq(coachAssignments.coachId, coachId));
  }

  async getCoachAssignmentsByUser(serverId: string, userId: string): Promise<CoachAssignment[]> {
    return await db.select().from(coachAssignments)
      .where(and(
        eq(coachAssignments.serverId, serverId),
        eq(coachAssignments.userId, userId)
      ));
  }

  async createCoachAssignment(assignment: InsertCoachAssignment): Promise<CoachAssignment> {
    const result = await db.insert(coachAssignments).values(assignment).returning();
    return result[0];
  }

  async deleteCoachAssignment(id: number): Promise<void> {
    await db.delete(coachAssignments).where(eq(coachAssignments.id, id));
  }

  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }

  async getTransactions(serverId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.serverId, serverId));
  }

  async getTransactionsByTeam(teamId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(
        and(
          eq(transactions.sourceTeamId, teamId),
          eq(transactions.targetTeamId, teamId)
        )
      );
  }

  async getPendingTransactions(serverId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(and(
        eq(transactions.serverId, serverId),
        eq(transactions.status, 'pending')
      ));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  // Setup Progress
  async getSetupProgress(serverId: string): Promise<SetupProgress | undefined> {
    const result = await db.select().from(setupProgress).where(eq(setupProgress.serverId, serverId));
    return result[0];
  }

  async createSetupProgress(progress: InsertSetupProgress): Promise<SetupProgress> {
    const result = await db.insert(setupProgress).values(progress).returning();
    return result[0];
  }

  async updateSetupProgress(serverId: string, progress: Partial<InsertSetupProgress>): Promise<SetupProgress | undefined> {
    const result = await db.update(setupProgress)
      .set(progress)
      .where(eq(setupProgress.serverId, serverId))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();