import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Command {
  name: string;
  arabicName?: string;
  description: string;
  category: "setup" | "teams" | "players" | "coaches" | "currency" | "transfers";
}

export default function CommandsList() {
  const { toast } = useToast();
  
  const commands: Command[] = [
    {
      name: "/setup",
      description: "Start the multi-page setup wizard",
      category: "setup"
    },
    {
      name: "/teams add",
      arabicName: "/فرق إضافة",
      description: "Add a team with emoji and role",
      category: "teams"
    },
    {
      name: "/teams view",
      arabicName: "/فرق عرض",
      description: "View all teams in the league",
      category: "teams"
    },
    {
      name: "/roster view",
      arabicName: "/روستر عرض",
      description: "View roster counts for all teams",
      category: "players"
    },
    {
      name: "/roster add",
      arabicName: "/روستر إضافة",
      description: "Add a player to a team",
      category: "players"
    },
    {
      name: "/coach add",
      arabicName: "/مدرب إضافة",
      description: "Add a coach role",
      category: "coaches"
    },
    {
      name: "/coach assign",
      arabicName: "/مدرب تعيين",
      description: "Assign a coach to a team",
      category: "coaches"
    },
    {
      name: "/transfer request",
      arabicName: "/تحويل طلب",
      description: "Request to transfer a player to another team",
      category: "transfers"
    },
    {
      name: "/transfer approve",
      arabicName: "/تحويل موافقة",
      description: "Approve a pending transfer",
      category: "transfers"
    },
    {
      name: "/currency award_win",
      arabicName: "/عملة مكافأة_فوز",
      description: "Award win bonus to a team (10M)",
      category: "currency"
    },
    {
      name: "/currency award_loss",
      arabicName: "/عملة تعويض_خسارة",
      description: "Award loss compensation to a team (5M)",
      category: "currency"
    }
  ];

  // Copy command to clipboard
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Command copied!",
      description: `${command} has been copied to clipboard.`,
    });
  };

  // Group commands by category
  const groupedCommands = commands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = [];
    }
    groups[command.category].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  // Category labels
  const categoryLabels: Record<string, string> = {
    setup: "Setup",
    teams: "Teams",
    players: "Players",
    coaches: "Coaches",
    currency: "Currency",
    transfers: "Transfers"
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedCommands).map(([category, cmds]) => (
        <div key={category}>
          <h3 className="font-medium text-sm text-muted-foreground mb-2">
            {categoryLabels[category]}
          </h3>
          <div className="space-y-2">
            {cmds.map((cmd) => (
              <div 
                key={cmd.name} 
                className="p-2 bg-secondary/50 rounded-md hover:bg-secondary cursor-pointer"
                onClick={() => copyCommand(cmd.name)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-sm">{cmd.name}</div>
                  {cmd.arabicName && (
                    <Badge variant="outline" className="text-xs">
                      {cmd.arabicName}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{cmd.description}</p>
              </div>
            ))}
          </div>
          {category !== Object.keys(groupedCommands).pop() && <Separator className="my-3" />}
        </div>
      ))}
    </div>
  );
}
