import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface BotStatusCardProps {
  online: boolean;
  uptime: string;
  lastRestart: string;
  isLoading?: boolean;
}

export default function BotStatusCard({ online, uptime, lastRestart, isLoading = false }: BotStatusCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
        <CardDescription>{online ? "Online" : "Offline"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-full">
            {online ? (
              <ShieldCheck className="h-8 w-8 text-primary" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-destructive" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="font-medium">{uptime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
