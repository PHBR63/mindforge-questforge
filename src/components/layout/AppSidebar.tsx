import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Scroll,
  Map,
  Users,
  MapPin,
  Calendar,
  Clock,
  FolderOpen,
  Shield,
  Swords,
  LogOut,
  Settings,
  Search,
} from 'lucide-react';

const mainNavItems = [
  { icon: Scroll, label: 'Campanhas', href: '/campaigns' },
  { icon: Map, label: 'Mapa Mental', href: '/mind-map' },
  { icon: Search, label: 'Investigação', href: '/investigation' },
  { icon: Users, label: 'NPCs', href: '/npcs' },
  { icon: MapPin, label: 'Locais', href: '/locations' },
  { icon: Shield, label: 'Facções', href: '/factions' },
  { icon: Swords, label: 'Missões', href: '/quests' },
  { icon: Calendar, label: 'Sessões', href: '/sessions' },
  { icon: Clock, label: 'Linha do Tempo', href: '/timeline' },
  { icon: FolderOpen, label: 'Biblioteca', href: '/resources' },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar className="border-r border-border/50 h-full">
      <SidebarHeader className="p-3 md:p-4">
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Scroll className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base md:text-lg font-bold text-gold truncate">BrainPG</h1>
            <p className="text-xs text-muted-foreground truncate">Gestão de Campanhas</p>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="bg-border/50" />

      <SidebarContent>
        <ScrollArea className="flex-1 px-2 md:px-3 py-3 md:py-4">
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.href}
                  className={cn(
                    'w-full justify-start gap-2 md:gap-3 px-2 md:px-3 py-2 font-body text-sm md:text-base',
                    location.pathname === item.href && 'bg-primary/10 text-primary border-l-2 border-primary'
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <Separator className="bg-border/50" />

      <SidebarFooter className="p-3 md:p-4 space-y-2">
        <div className="flex items-center gap-2 px-1 md:px-2 py-1">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium truncate">
              {user?.email?.split('@')[0] || 'Mestre'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs md:text-sm" asChild>
            <Link to="/settings">
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              Config
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
