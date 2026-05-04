'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, Briefcase, DollarSign, UserCog, MapPin, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectoresList } from '@/components/admin/sectores-list';
import { PuestosList } from '@/components/admin/puestos-list';
import { PresupuestosList } from '@/components/admin/presupuestos-list';
import { ClientesUsuariosList } from '@/components/admin/clientes-usuarios-list';
import { ClienteFormDialog } from '@/components/admin/cliente-form-dialog';
import { CertificacionesList } from '@/components/admin/certificaciones-list';

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cdCliente = params.id as string;
  const tenant = params.tenant as string;

  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadCliente();
  }, [cdCliente]);

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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/${tenant}/clientes`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Clientes
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.dsRazonSocial}</h1>
            <p className="text-gray-500 mt-1">
              CUIT: {cliente.dsCUIT || 'No especificado'} • Estado: {cliente.dsEstado}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Building2 className="mr-2 h-4 w-4" />
              Editar Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Info Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cliente.dsContacto1 || 'No especificado'}</p>
            <p className="text-sm text-gray-500">{cliente.dsMail1 || cliente.dsMail || ''}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Teléfono</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cliente.dsTelefono || 'No especificado'}</p>
            <p className="text-sm text-gray-500">{cliente.dsCelular1 || ''}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cliente.dsLocalidad || 'No especificado'}</p>
            <p className="text-sm text-gray-500">{cliente.dsDomicilio || ''}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Tipo Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cliente.dsEstado || 'Activo'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {cliente.cdEmpresaConsultora ? (
        <Tabs defaultValue="sectores" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sectores">
              <MapPin className="mr-2 h-4 w-4" />
              Sectores
            </TabsTrigger>
            <TabsTrigger value="puestos">
              <UserCog className="mr-2 h-4 w-4" />
              Puestos
            </TabsTrigger>
            <TabsTrigger value="presupuestos">
              <DollarSign className="mr-2 h-4 w-4" />
              Presupuestos
            </TabsTrigger>
            <TabsTrigger value="empleados">
              <Users className="mr-2 h-4 w-4" />
              Empleados
            </TabsTrigger>
            <TabsTrigger value="certificaciones">
              <Award className="mr-2 h-4 w-4" />
              Certificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sectores" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sectores del Cliente</CardTitle>
                <CardDescription>
                  Gestiona los sectores organizacionales del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SectoresList 
                  cdCliente={parseInt(cdCliente)} 
                  cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="puestos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Puestos de Trabajo</CardTitle>
                <CardDescription>
                  Gestiona los puestos de trabajo disponibles en el cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PuestosList 
                  cdCliente={parseInt(cdCliente)} 
                  cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                />
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="empleados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Empleados del Cliente</CardTitle>
                <CardDescription>
                  Gestiona el personal y empleados del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientesUsuariosList 
                  cdCliente={parseInt(cdCliente)} 
                  cdEmpresaConsultora={cliente.cdEmpresaConsultora}
                />
              </CardContent>
            </Card>
          </TabsContent>

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
        </Tabs>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando información del cliente...</p>
        </div>
      )}

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
