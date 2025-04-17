import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [location] = useLocation();
  const { toast } = useToast();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                  <span className="text-sm">WL</span>
                </div>
                <span className="font-bold">Win Lock</span>
              </a>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              <Link href="/">
                <a className={location === "/" ? "font-medium" : "text-muted-foreground"}>
                  Home
                </a>
              </Link>
              <Link href="/dashboard">
                <a className={location === "/dashboard" ? "font-medium" : "text-muted-foreground"}>
                  Dashboard
                </a>
              </Link>
              <a 
                href="#" 
                className="text-muted-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  toast({
                    title: "Coming Soon",
                    description: "The documentation is currently being developed."
                  });
                }}
              >
                Documentation
              </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Invite link copied!",
                  description: "The Discord bot invite link has been copied to your clipboard."
                });
                navigator.clipboard.writeText("https://discord.com/api/oauth2/authorize?client_id=DISCORD_CLIENT_ID&permissions=8&scope=bot%20applications.commands");
              }}
            >
              Add to Discord
            </Button>
            <Link href="/dashboard">
              <Button size="sm" variant={location === "/dashboard" ? "secondary" : "default"}>
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
