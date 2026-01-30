import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LayoutDashboard, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">RescueAI</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button
              variant={!isDashboard ? 'default' : 'ghost'}
              size="sm"
              className={cn(!isDashboard && 'pointer-events-none')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Emergency Chat</span>
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant={isDashboard ? 'default' : 'ghost'}
              size="sm"
              className={cn(isDashboard && 'pointer-events-none')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
