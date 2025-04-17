import { ReactNode } from "react";
import Navbar from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Win Lock Bot &copy; {new Date().getFullYear()} | Fantasy/eSports League Management
          </p>
          <div className="flex items-center justify-center mt-2 space-x-4">
            <a href="https://github.com/your-username/win-lock-bot" className="text-sm text-muted-foreground hover:text-foreground" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
