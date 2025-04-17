import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center justify-center text-center mb-12">
        <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center text-white font-bold mb-6">
          <span className="text-4xl">WL</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Win Lock Community</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A powerful Discord bot for managing fantasy and e-sports leagues with support for Arabic commands
        </p>
        <div className="flex gap-4 mt-8">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Open Dashboard
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => {
              toast({
                title: "Invite link copied!",
                description: "The Discord bot invite link has been copied to your clipboard."
              });
              navigator.clipboard.writeText("https://discord.com/api/oauth2/authorize?client_id=DISCORD_CLIENT_ID&permissions=8&scope=bot%20applications.commands");
            }}
          >
            Invite to Discord
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Language Support</CardTitle>
            <CardDescription>Commands in English and Arabic</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Use commands in either English or Arabic. The bot automatically detects the language based on your server settings.</p>
          </CardContent>
          <CardFooter>
            <code className="p-2 bg-secondary rounded text-sm">/team add</code>
            <code className="p-2 bg-secondary rounded text-sm ml-2">فرق/</code>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Virtual Currency</CardTitle>
            <CardDescription>Manage team finances</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Built-in virtual currency system with automatic rewards for wins (10M) and losses (5M), transfer fees, and more.</p>
          </CardContent>
          <CardFooter>
            <code className="p-2 bg-secondary rounded text-sm">/currency award_win</code>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transfer System</CardTitle>
            <CardDescription>Captain approval workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Comprehensive player transfer system with captain approval required, transfer fees, and automated role assignment.</p>
          </CardContent>
          <CardFooter>
            <code className="p-2 bg-secondary rounded text-sm">/transfer request</code>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Rosters, roles, and more</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Manage teams with custom emojis, roster caps, coaches, and captains. Easily add, remove, and transfer players.</p>
          </CardContent>
          <CardFooter>
            <code className="p-2 bg-secondary rounded text-sm">/roster view</code>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Permissions</CardTitle>
            <CardDescription>Granular access control</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Different roles (Operator, Manager, Referee, Streamer, Captain, Coach) have different permissions and capabilities.</p>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">Operator, Manager, Captain, Coach, Referee</div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Setup Wizard</CardTitle>
            <CardDescription>Easy configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Multi-page setup wizard to configure all aspects of your league, from teams and coaches to transaction settings.</p>
          </CardContent>
          <CardFooter>
            <code className="p-2 bg-secondary rounded text-sm">/setup</code>
          </CardFooter>
        </Card>
      </div>
      
      <div className="border-t pt-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="mb-6 text-muted-foreground">Add the Win Lock bot to your Discord server and start managing your league today!</p>
        <Button asChild size="lg">
          <a href="https://discord.com/api/oauth2/authorize?client_id=DISCORD_CLIENT_ID&permissions=8&scope=bot%20applications.commands" target="_blank" rel="noopener noreferrer">
            Add to Discord
          </a>
        </Button>
      </div>
    </div>
  );
}
