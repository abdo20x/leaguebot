import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { getBotStatus, getBotStats, getGuilds } from "./discord";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    
    try {
      // Send initial bot status
      const status = getBotStatus();
      ws.send(JSON.stringify({ type: "status", data: status }));
      
      // Send initial stats
      const stats = getBotStats();
      ws.send(JSON.stringify({ type: "stats", data: stats }));
      
      // Handle WebSocket errors
      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
      
      // Handle WebSocket closures
      ws.on("close", () => {
        console.log("WebSocket connection closed");
      });
    } catch (error) {
      console.error("Error handling WebSocket connection:", error);
    }
  });
  
  // Handle WebSocket errors
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });
  
  // API routes
  // Bot status endpoint
  app.get("/api/status", async (req, res) => {
    const status = getBotStatus();
    res.json(status);
  });
  
  // Bot statistics endpoint
  app.get("/api/stats", async (req, res) => {
    const stats = getBotStats();
    res.json(stats);
  });
  
  // Guild/server list endpoint
  app.get("/api/guilds", async (req, res) => {
    const guilds = getGuilds();
    res.json(guilds);
  });
  
  // Teams endpoint - list all teams across all servers
  app.get("/api/teams", async (req, res) => {
    try {
      const serverId = req.query.serverId as string;
      
      if (serverId) {
        // Get teams for a specific server
        const teams = await storage.getTeams(serverId);
        res.json(teams);
      } else {
        // Get all teams
        res.status(400).json({ error: "Server ID required" });
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });
  
  // Team details endpoint
  app.get("/api/teams/:id", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Get players for this team
      const players = await storage.getPlayersByTeam(teamId);
      
      // Get coach assignments
      const coachAssignments = await storage.getCoachAssignmentsByTeam(teamId);
      
      // For each coach assignment, get the coach details
      const coaches = await Promise.all(
        coachAssignments.map(async (assignment) => {
          const coach = await storage.getCoach(assignment.coachId || 0);
          return {
            assignment,
            coach,
          };
        })
      );
      
      res.json({
        ...team,
        players,
        coaches,
      });
    } catch (error) {
      console.error("Error fetching team details:", error);
      res.status(500).json({ error: "Failed to fetch team details" });
    }
  });
  
  // Transactions endpoint
  app.get("/api/transactions", async (req, res) => {
    try {
      const serverId = req.query.serverId as string;
      
      if (serverId) {
        // Get transactions for a specific server
        const transactions = await storage.getTransactions(serverId);
        res.json(transactions);
      } else {
        // Need server ID
        res.status(400).json({ error: "Server ID required" });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  
  // Pending transactions endpoint
  app.get("/api/transactions/pending", async (req, res) => {
    try {
      const serverId = req.query.serverId as string;
      
      if (serverId) {
        // Get pending transactions for a specific server
        const transactions = await storage.getPendingTransactions(serverId);
        res.json(transactions);
      } else {
        // Need server ID
        res.status(400).json({ error: "Server ID required" });
      }
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      res.status(500).json({ error: "Failed to fetch pending transactions" });
    }
  });
  
  // Settings endpoint
  app.get("/api/settings", async (req, res) => {
    try {
      const serverId = req.query.serverId as string;
      
      if (serverId) {
        // Get settings for a specific server
        const settings = await storage.getSettings(serverId);
        res.json(settings || { error: "Settings not found" });
      } else {
        // Need server ID
        res.status(400).json({ error: "Server ID required" });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  return httpServer;
}
