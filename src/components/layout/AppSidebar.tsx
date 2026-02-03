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
  Network,
  Clock,
  FolderOpen,
  Shield,
  Swords,
  LogOut,
  Settings,
} from 'lucide-react';

const mainNavItems = [
  { icon: Scroll, label: 'Campanhas', href: '/campaigns' },
  { icon: Map, label: 'Mapa Mental', href: '/mind-map' },
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
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Scroll className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-gold">BrainPG</h1>
            <p className="text-xs text-muted-foreground">Gestão de Campanhas</p>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="bg-border/50" />

      <SidebarContent>
        <ScrollArea className="flex-1 px-3 py-4">
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.href}
                  className={cn(
                    'w-full justify-start gap-3 px-3 py-2 font-body',
                    location.pathname === item.href && 'bg-primary/10 text-primary border-l-2 border-primary'
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <Separator className="bg-border/50" />

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.email?.split('@')[0] || 'Mestre'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" asChild>
            <Link to="/settings">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
