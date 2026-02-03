import { createContext, useContext, useState, ReactNode } from 'react';
import { Campaign } from '@/hooks/useCampaigns';

interface CampaignContextType {
  activeCampaign: Campaign | null;
  setActiveCampaign: (campaign: Campaign | null) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  return (
    <CampaignContext.Provider value={{ activeCampaign, setActiveCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignContext() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaignContext must be used within a CampaignProvider');
  }
  return context;
}
