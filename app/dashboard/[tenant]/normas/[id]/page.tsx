'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ClipboardList, Building2, List, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequisitosTemplates } from '@/components/admin/requisitos-templates';
import { FormulariosList } from '@/components/admin/formularios-list';
import { ListasNorma } from '@/components/admin/listas-norma';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { NormaFormDialog } from '@/components/admin/norma-form-dialog';

interface Norma {
  cdNorma: number;
  cdEmpresaConsultora: number;
  cdCodigoNorma: string;
  dsNombre: string;
  dsDescripcion: string;
  snAcreditacion: boolean;
  snCertificacion: boolean;
  dsOrganismoCertificador: string;
  dsObservaciones: string;
  cdEstado: number;
  dsEstado: string;
}

export const dynamic = 'force-dynamic';

export default function NormaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cdNorma = params.id as string;
  const tenant = params.tenant as string;

  const [norma, setNorma] = useState<Norma | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');
  const [copiarDialogOpen, setCopiarDialogOpen] = useState(false);
  const [cdEmpresaConsultora, setCdEmpresaConsultora] = useState(0);

  useEffect(() => {
    checkAuth();
    loadNorma();
  }, [cdNorma]);

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
      setEmpresaNombre(user.dsNombreEmpresaConsultora || '');
      setEmpresaLogo(user.dsLogoEmpresa || '');
      setCdEmpresaConsultora(user.cdEmpresaConsultora || 0);
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.push(`/login/${tenant}`);
    }
  };

  const loadNorma = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/normas/${cdNorma}`);
      const data = await response.json();
      
      if (data.success) {
        setNorma(data.data);
      }
    } catch (error) {
      console.error('Error al cargar norma:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarSuccess = () => {
    router.push(`/dashboard/${tenant}/normas`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!norma) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Norma no encontrada</p>
          <Button onClick={() => router.push(`/dashboard/${tenant}/normas`)} className="mt-4">
            Volver a Normas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        empresaNombre={empresaNombre}
        tenant={tenant}
        logoBase64={empresaLogo}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Gestión de Normas', href: `/dashboard/${tenant}/normas` },
            { label: norma.dsNombre },
          ]}
        />

        {/* Info de la Norma */}
        <div className="mt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{norma.dsNombre}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Código: {norma.cdCodigoNorma} • Estado: {norma.dsEstado}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/${tenant}/normas?edit=${cdNorma}`)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Editar Norma
              </Button>
              <Button 
                variant="default" 
                onClick={() => setCopiarDialogOpen(true)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Norma
              </Button>
            </div>
          </div>
        </div>

      {/* Info Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {norma.snCertificacion && (
                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded mr-1">
                  Certificación
                </span>
              )}
              {norma.snAcreditacion && (
                <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                  Acreditación
                </span>
              )}
              {!norma.snCertificacion && !norma.snAcreditacion && (
                <span className="text-sm text-gray-500 dark:text-gray-400">No especificado</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Organismo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300">{norma.dsOrganismoCertificador || 'No especificado'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 line-clamp-2">{norma.dsDescripcion || 'Sin descripción'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`inline-block px-2 py-1 rounded text-xs ${
                norma.cdEstado === 1
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {norma.dsEstado}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Requisitos, Formularios y Listas */}
      <Tabs defaultValue="requisitos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="requisitos">
            <ClipboardList className="h-4 w-4 mr-2" />
            Requisitos
          </TabsTrigger>
          <TabsTrigger value="formularios">
            <FileText className="h-4 w-4 mr-2" />
            Formularios
          </TabsTrigger>
          <TabsTrigger value="listas">
            <List className="h-4 w-4 mr-2" />
            Listas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requisitos">
          <Card>
            <CardHeader>
              <CardTitle>Requisitos de la Norma</CardTitle>
              <CardDescription>
                Gestione los requisitos de la norma y asocie los formularios correspondientes. Cada requisito puede tener uno o más formularios asociados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequisitosTemplates cdNorma={parseInt(cdNorma)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formularios">
          <Card>
            <CardHeader>
              <CardTitle>Formularios de la Norma</CardTitle>
              <CardDescription>
                Gestione los formularios que pueden ser asociados a los requisitos. Los formularios son reutilizables entre diferentes requisitos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormulariosList cdNorma={parseInt(cdNorma)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listas">
          <Card>
            <CardHeader>
              <CardTitle>Listas de Valores Fijos</CardTitle>
              <CardDescription>
                Defina listas con valores fijos que podrán ser utilizadas en los campos de tipo Lista de los formularios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListasNorma 
                cdNorma={parseInt(cdNorma)} 
                cdEmpresaConsultora={norma?.cdEmpresaConsultora || 0}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Dialog para Copiar Norma */}
      <NormaFormDialog
        open={copiarDialogOpen}
        onOpenChange={setCopiarDialogOpen}
        norma={null}
        cdEmpresaConsultora={cdEmpresaConsultora}
        onSuccess={handleCopiarSuccess}
        modoCopia={true}
        cdNormaOrigen={parseInt(cdNorma)}
      />
    </div>
  );
}
