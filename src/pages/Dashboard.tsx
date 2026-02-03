import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Scroll,
  Users,
  MapPin,
  Calendar,
  Network,
  Clock,
  FolderOpen,
  Shield,
  Swords,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const quickActions = [
  { icon: Network, label: 'Mapa Mental', href: '/mind-map', color: 'text-blue-500' },
  { icon: Users, label: 'NPCs', href: '/npcs', color: 'text-green-500' },
  { icon: MapPin, label: 'Locais', href: '/locations', color: 'text-amber-500' },
  { icon: Swords, label: 'Missões', href: '/quests', color: 'text-red-500' },
  { icon: Clock, label: 'Timeline', href: '/timeline', color: 'text-purple-500' },
  { icon: FolderOpen, label: 'Biblioteca', href: '/resources', color: 'text-cyan-500' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { campaigns, isLoading } = useCampaigns();
  const { activeCampaign, setActiveCampaign } = useCampaignContext();

  useEffect(() => {
    if (!activeCampaign && campaigns.length > 0) {
      setActiveCampaign(campaigns[0]);
    }
  }, [campaigns, activeCampaign, setActiveCampaign]);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary font-medium">RPG Master</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Bem-vindo, Mestre!
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Organize suas campanhas, crie NPCs memoráveis, construa mundos 
              épicos e mantenha tudo conectado com mapas mentais.
            </p>
            {!activeCampaign && (
              <Button className="mt-6 glow-gold" onClick={() => navigate('/campaigns')}>
                <Scroll className="w-4 h-4 mr-2" />
                Começar uma Campanha
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Active Campaign */}
        {activeCampaign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-xl font-bold mb-4">Campanha Ativa</h2>
            <Card 
              className="border-ornate cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate('/mind-map')}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl text-gold">
                    {activeCampaign.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Scroll className="w-3 h-3" />
                    {activeCampaign.system}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate('/campaigns');
                }}>
                  Trocar Campanha
                </Button>
              </CardHeader>
              {activeCampaign.description && (
                <CardContent>
                  <p className="text-muted-foreground">{activeCampaign.description}</p>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-xl font-bold mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-all group"
                  onClick={() => navigate(action.href)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <action.icon className={`w-8 h-8 mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
                    <span className="font-display text-sm">{action.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Campaigns */}
        {campaigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Suas Campanhas</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.slice(0, 3).map((campaign) => (
                <Card 
                  key={campaign.id}
                  className={`cursor-pointer transition-all ${
                    activeCampaign?.id === campaign.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setActiveCampaign(campaign);
                    navigate('/mind-map');
                  }}
                >
                  <CardHeader>
                    <CardTitle className="font-display text-base">{campaign.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(campaign.updated_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
