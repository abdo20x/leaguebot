import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, BookOpen, Settings, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SetupGuide() {
  const { toast } = useToast();
  
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Command copied!",
      description: `${command} has been copied to clipboard.`,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center mb-2">
          <Settings className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Setup Bot</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Run the setup wizard on your Discord server
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => copyCommand("/setup")}
        >
          Copy /setup command <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center mb-2">
          <Users className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Add Teams</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Create your first team with an emoji
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => copyCommand("/teams add")}
        >
          Copy /teams add command <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center mb-2">
          <Shield className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Add Coaches</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Create coach roles like Captain, Vice-Captain
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => copyCommand("/coach add")}
        >
          Copy /coach add command <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center mb-2">
          <BookOpen className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Documentation</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          View full bot documentation and guides
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => window.open("https://github.com/your-username/win-lock-bot", "_blank")}
        >
          View documentation <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
