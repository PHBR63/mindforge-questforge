import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-display">{title || 'Dashboard'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 overflow-auto p-6 parchment-texture">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
