'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  FileText,
  Award,
  BarChart3,
  Settings,
  Loader2,
} from 'lucide-react';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant ? parseInt(params.tenant as string) : 0;

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState(0);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success) {
        router.push(`/login/${tenant}`);
        return;
      }

      const user = data.data.user;
      setUserName(user.dsNombreCompleto || user.dsUsuario);
      setUserType(user.cdTipoUsuario);
      setEmpresaNombre(user.dsNombreEmpresaConsultora || '');
      setEmpresaLogo(user.dsLogoEmpresa || '');

      // Validar que el usuario pertenezca a esta empresa
      if (user.cdEmpresaConsultora !== tenant) {
        router.push(`/login/${tenant}`);
        return;
      }

      setLoading(false);
    } catch (error) {
      router.push(`/login/${tenant}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/login/${tenant}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }


  const menuItems = [
    {
      title: 'Usuarios y Roles',
      description: 'Gestione los usuarios y permisos de su empresa',
      icon: Users,
      href: `/dashboard/${tenant}/usuarios`,
      color: 'bg-blue-500',
      visible: userType === 2, // Solo administradores
    },
    {
      title: 'Gestión de Normas',
      description: 'Administre las normas ISO y sus versiones',
      icon: FileText,
      href: `/dashboard/${tenant}/normas`,
      color: 'bg-green-500',
      visible: userType === 2, // Solo administradores
    },
    {
      title: 'Clientes',
      description: 'Gestione las empresas cliente que audita',
      icon: Building2,
      href: `/dashboard/${tenant}/clientes`,
      color: 'bg-purple-500',
      visible: userType === 2 || userType === 3, // Admin y Consultores
    },
    {
      title: 'Certificaciones',
      description: 'Seguimiento de certificaciones de clientes',
      icon: Award,
      href: `/dashboard/${tenant}/certificaciones`,
      color: 'bg-amber-500',
      visible: true,
      comingSoon: true,
    },
    {
      title: 'Documentos',
      description: 'Genere documentos y reportes',
      icon: FileText,
      href: `/dashboard/${tenant}/documentos`,
      color: 'bg-indigo-500',
      visible: true,
      comingSoon: true,
    },
    {
      title: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: BarChart3,
      href: `/dashboard/${tenant}/reportes`,
      color: 'bg-red-500',
      visible: true,
      comingSoon: true,
    },
    {
      title: 'Configuración',
      description: 'Parámetros de la empresa consultora',
      icon: Settings,
      href: `/dashboard/${tenant}/configuracion`,
      color: 'bg-gray-500',
      visible: userType === 2, // Solo administradores
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <DashboardHeader 
        userName={userName}
        empresaNombre={empresaNombre}
        tenant={tenant.toString()}
        logoBase64={empresaLogo}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Panel de Control</h2>
          <p className="text-gray-600 dark:text-gray-400">Seleccione un módulo para comenzar</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems
            .filter((item) => item.visible)
            .map((item, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  item.comingSoon ? 'opacity-75' : ''
                }`}
                onClick={() => !item.comingSoon && router.push(item.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`${item.color} p-3 rounded-lg text-white mb-4`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    {item.comingSoon && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-medium">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!item.comingSoon ? (
                    <Button className="w-full" variant="outline">
                      Acceder
                    </Button>
                  ) : (
                    <Button className="w-full" variant="ghost" disabled>
                      En desarrollo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">Bienvenido al Sistema de Gestión ISO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              Este sistema le permite gestionar de forma integral todos los aspectos relacionados con las
              certificaciones de calidad ISO de sus clientes. Utilice el menú superior para navegar entre
              los diferentes módulos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
