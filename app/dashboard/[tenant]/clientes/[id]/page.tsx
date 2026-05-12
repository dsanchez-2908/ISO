'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, FileText, List, DollarSign, Users, MapPin, UserCog } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectoresList } from '@/components/admin/sectores-list';
import { PuestosList } from '@/components/admin/puestos-list';
import { PresupuestosList } from '@/components/admin/presupuestos-list';
import { ClientesUsuariosList } from '@/components/admin/clientes-usuarios-list';
import { ClienteFormDialog } from '@/components/admin/cliente-form-dialog';
import { CertificacionesList } from '@/components/admin/certificaciones-list';
import { ClienteDetalle } from '@/components/admin/cliente-detalle';
import { ListasClienteList } from '@/components/admin/listas-cliente-list';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cdCliente = params.id as string;
  const tenant = params.tenant as string;

  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');

  useEffect(() => {
    checkAuth();
    loadCliente();
  }, [cdCliente]);

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
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.push(`/login/${tenant}`);
    }
  };

  const loadCliente = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/clientes/${cdCliente}`);
      const data = await response.json();
      
      if (data.success) {
        setCliente(data.data.cliente);
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
    } finally {
      setLoading(false);
    }
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

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Cliente no encontrado</p>
          <Button onClick={() => router.push(`/dashboard/${tenant}/clientes`)} className="mt-4">
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader 
        userName={userName}
        empresaNombre={empresaNombre}
        tenant={tenant}
        logoBase64={empresaLogo}
      />

      <div className="container mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Gestión de Clientes', href: `/dashboard/${tenant}/clientes` },
            { label: `Detalle del Cliente: ${cliente.dsRazonSocial}` }
          ]}
        />

        {/* Título */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{cliente.dsRazonSocial}</h1>
              <p className="text-gray-500 mt-1">
                CUIT: {cliente.dsCUIT || 'No especificado'} • Estado: {cliente.dsEstado}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="certificaciones" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="certificaciones">
              <Award className="mr-2 h-4 w-4" />
              Certificaciones
            </TabsTrigger>
            <TabsTrigger value="informacion">
              <FileText className="mr-2 h-4 w-4" />
              Información Detallada
            </TabsTrigger>
            <TabsTrigger value="listas">
              <List className="mr-2 h-4 w-4" />
              Listas Clientes
            </TabsTrigger>
            <TabsTrigger value="presupuestos">
              <DollarSign className="mr-2 h-4 w-4" />
              Presupuestos
            </TabsTrigger>
          </TabsList>

          {/* Pestaña 1: Certificaciones */}
          <TabsContent value="certificaciones" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificaciones ISO</CardTitle>
                <CardDescription>
                  Gestiona las certificaciones y procesos de calidad del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CertificacionesList 
                  cdCliente={parseInt(cdCliente)} 
                  cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña 2: Información Detallada (con sub-tabs) */}
          <TabsContent value="informacion" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="detalle" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="detalle">Detalle</TabsTrigger>
                    <TabsTrigger value="empleados">
                      <Users className="mr-2 h-4 w-4" />
                      Empleados
                    </TabsTrigger>
                    <TabsTrigger value="sectores">
                      <MapPin className="mr-2 h-4 w-4" />
                      Sectores
                    </TabsTrigger>
                    <TabsTrigger value="puestos">
                      <UserCog className="mr-2 h-4 w-4" />
                      Puestos
                    </TabsTrigger>
                  </TabsList>

                  {/* Sub-pestaña: Detalle */}
                  <TabsContent value="detalle" className="mt-6">
                    <ClienteDetalle 
                      cliente={cliente} 
                      cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                      onEdit={() => setEditDialogOpen(true)}
                    />
                  </TabsContent>

                  {/* Sub-pestaña: Empleados */}
                  <TabsContent value="empleados" className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Empleados del Cliente</h3>
                      <p className="text-sm text-gray-500">Gestiona el personal y empleados del cliente</p>
                    </div>
                    <ClientesUsuariosList 
                      cdCliente={parseInt(cdCliente)} 
                      cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                    />
                  </TabsContent>

                  {/* Sub-pestaña: Sectores */}
                  <TabsContent value="sectores" className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Sectores del Cliente</h3>
                      <p className="text-sm text-gray-500">Gestiona los sectores organizacionales del cliente</p>
                    </div>
                    <SectoresList 
                      cdCliente={parseInt(cdCliente)} 
                      cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                    />
                  </TabsContent>

                  {/* Sub-pestaña: Puestos */}
                  <TabsContent value="puestos" className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Puestos de Trabajo</h3>
                      <p className="text-sm text-gray-500">Gestiona los puestos de trabajo disponibles en el cliente</p>
                    </div>
                    <PuestosList 
                      cdCliente={parseInt(cdCliente)} 
                      cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña 3: Listas Clientes */}
          <TabsContent value="listas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Listas del Cliente</CardTitle>
                <CardDescription>
                  Gestiona las listas personalizadas que pueden ser heredadas en las normas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ListasClienteList 
                  cdCliente={parseInt(cdCliente)} 
                  cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña 4: Presupuestos */}
          <TabsContent value="presupuestos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Presupuestos</CardTitle>
                <CardDescription>
                  Gestiona los presupuestos y cotizaciones del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PresupuestosList 
                  cdCliente={parseInt(cdCliente)} 
                  cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para editar cliente */}
      <ClienteFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        cliente={cliente}
        cdEmpresaConsultora={cliente?.cdEmpresaConsultora || 0}
        onSuccess={() => {
          loadCliente();
        }}
      />
    </div>
  );
}
