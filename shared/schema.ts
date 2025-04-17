import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Server and global settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  guildName: text("guild_name").notNull(),
  prefix: text("prefix").default("!"),
  locale: text("locale").default("en"),
  teamRosterCap: integer("team_roster_cap").default(22),
  winCurrency: integer("win_currency").default(10000000), // 10M
  lossCurrency: integer("loss_currency").default(5000000), // 5M
  defaultCurrency: integer("default_currency").default(50000000), // 50M
  setupComplete: boolean("setup_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channels for notifications
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  challenges: text("challenges").default(""),
  decisions: text("decisions").default(""),
  notices: text("notices").default(""),
  settingChanges: text("setting_changes").default(""),
  streams: text("streams").default(""),
  transactions: text("transactions").default(""),
  applications: text("applications").default(""),
});

// Teams
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  teamId: text("team_id").notNull(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  roleId: text("role_id").notNull(),
  currency: integer("currency"),
  rosterCount: integer("roster_count").default(0),
  rosterMax: integer("roster_max").default(22),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Players (team members)
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  userId: text("user_id").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  username: text("username").notNull(),
  nickname: text("nickname"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Coaches
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  roleId: text("role_id").notNull(),
  name: text("name").notNull(),
  shortCode: text("short_code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coach assignments
export const coachAssignments = pgTable("coach_assignments", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  coachId: integer("coach_id").references(() => coaches.id),
  userId: text("user_id").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  transactionType: text("transaction_type").notNull(), // transfer, currency, etc.
  sourceTeamId: integer("source_team_id").references(() => teams.id),
  targetTeamId: integer("target_team_id").references(() => teams.id),
  playerId: integer("player_id").references(() => players.id),
  amount: integer("amount").default(0),
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: text("approved_by"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Setup wizard steps tracking
export const setupProgress = pgTable("setup_progress", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().unique(),
  step: integer("step").default(1),
  totalSteps: integer("total_steps").default(10),
  data: jsonb("data").default({}),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertChannelsSchema = createInsertSchema(channels).omit({ id: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export const insertCoachSchema = createInsertSchema(coaches).omit({ id: true });
export const insertCoachAssignmentSchema = createInsertSchema(coachAssignments).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertSetupProgressSchema = createInsertSchema(setupProgress).omit({ id: true });

// Types
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertChannels = z.infer<typeof insertChannelsSchema>;
export type Channels = typeof channels.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Coach = typeof coaches.$inferSelect;

export type InsertCoachAssignment = z.infer<typeof insertCoachAssignmentSchema>;
export type CoachAssignment = typeof coachAssignments.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertSetupProgress = z.infer<typeof insertSetupProgressSchema>;
export type SetupProgress = typeof setupProgress.$inferSelect;
