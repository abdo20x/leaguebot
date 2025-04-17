import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Server, Users, User, Activity } from "lucide-react";

interface StatisticsCardProps {
  title: string;
  value: string;
  icon: "server" | "users" | "user" | "activity";
  isLoading?: boolean;
}

export default function StatisticsCard({ title, value, icon, isLoading = false }: StatisticsCardProps) {
  // Icon mapping
  const iconMap: Record<string, LucideIcon> = {
    server: Server,
    users: Users,
    user: User,
    activity: Activity
  };
  
  const Icon = iconMap[icon] || Activity;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Loading...</CardTitle>
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
