import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BotStatusCard from "@/components/BotStatusCard";
import SetupGuide from "@/components/SetupGuide";
import CommandsList from "@/components/CommandsList";
import StatisticsCard from "@/components/StatisticsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  // Load bot status from the API
  const { data: botStatus, error: statusError, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Load bot statistics from the API
  const { data: botStats, error: statsError, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Guilds list
  const { data: guilds, error: guildsError, isLoading: guildsLoading } = useQuery({
    queryKey: ['/api/guilds'],
    refetchInterval: 60000,
  });

  // WebSocket for real-time updates
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setSocket(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle different message types
          if (message.type === 'status') {
            // Update bot status
            console.log('Received updated bot status');
          } else if (message.type === 'stats') {
            // Update bot stats
            console.log('Received updated bot stats');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setSocket(null);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      // Cleanup on unmount
      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      return () => {}; // Empty cleanup function if setup fails
    }
  }, []);

  // Format uptime from milliseconds to readable format
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Win Lock Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BotStatusCard 
          online={botStatus?.online || false} 
          uptime={botStatus?.uptime ? formatUptime(botStatus.uptime) : "Connecting..."}
          lastRestart={botStatus?.lastRestart ? new Date(botStatus.lastRestart).toLocaleString() : ""}
          isLoading={statusLoading}
        />
        
        <StatisticsCard 
          title="Servers" 
          value={botStats?.servers.toString() || "0"}
          icon="server"
          isLoading={statsLoading}
        />
        
        <StatisticsCard 
          title="Teams" 
          value={botStats?.teams.toString() || "0"}
          icon="users"
          isLoading={statsLoading}
        />
        
        <StatisticsCard 
          title="Players" 
          value={botStats?.players.toString() || "0"}
          icon="user"
          isLoading={statsLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="servers">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="servers">Servers</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="servers">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Servers</CardTitle>
                  <CardDescription>Discord servers using Win Lock bot</CardDescription>
                </CardHeader>
                <CardContent>
                  {guildsLoading ? (
                    <div className="text-center py-4">Loading servers...</div>
                  ) : guildsError ? (
                    <div className="text-center py-4 text-red-500">Error loading servers</div>
                  ) : guilds && guilds.length > 0 ? (
                    <div className="space-y-4">
                      {guilds.map((guild: any) => (
                        <div key={guild.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{guild.name}</p>
                            <p className="text-sm text-muted-foreground">ID: {guild.id}</p>
                          </div>
                          <div className="text-sm">
                            {guild.memberCount} members
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">No servers connected</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="teams">
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Select a server to view teams</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Teams management would go here - not implementing in this view */}
                  <p className="text-muted-foreground text-center py-8">
                    Select a server from the list to view and manage teams
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Player transfers and currency transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Transactions would go here - not implementing in this view */}
                  <p className="text-muted-foreground text-center py-8">
                    Select a server from the list to view recent transactions
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common bot tasks and information</CardDescription>
            </CardHeader>
            <CardContent>
              <SetupGuide />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Commands Reference</CardTitle>
            <CardDescription>Most used commands for Win Lock bot</CardDescription>
          </CardHeader>
          <CardContent>
            <CommandsList />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Detailed system information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Bot Version</h3>
                <p className="text-sm">1.0.0</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Discord API Status</h3>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${botStatus?.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm">{botStatus?.online ? 'Connected' : 'Disconnected'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Uptime</h3>
                <p className="text-sm">{botStatus?.uptime ? formatUptime(botStatus.uptime) : "Calculating..."}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Statistics</h3>
                <ul className="text-sm space-y-1">
                  <li>Servers: {botStats?.servers || 0}</li>
                  <li>Teams: {botStats?.teams || 0}</li>
                  <li>Players: {botStats?.players || 0}</li>
                  <li>Transactions: {botStats?.transactions || 0}</li>
                  <li>Coaches: {botStats?.coaches || 0}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Last Restart</h3>
                <p className="text-sm">{botStatus?.lastRestart ? new Date(botStatus.lastRestart).toLocaleString() : "Unknown"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
