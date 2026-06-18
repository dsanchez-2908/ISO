'use client';

import { useRouter } from 'next/navigation';
import { Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardHeaderProps {
  userName: string;
  empresaNombre?: string;
  tenant: string;
  logoBase64?: string;
}

export function DashboardHeader({ userName, empresaNombre, tenant, logoBase64 }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        {logoBase64 ? (
          <img 
            src={`data:image/png;base64,${logoBase64}`} 
            alt="Logo" 
            className="h-12 w-auto object-contain"
          />
        ) : (
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {empresaNombre || 'Sistema de Gestión ISO'}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push(`/dashboard/${tenant}`)}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Inicio
        </Button>
        <ThemeToggle />
        <UserMenu userName={userName} tenant={tenant} />
      </div>
    </div>
  );
}
