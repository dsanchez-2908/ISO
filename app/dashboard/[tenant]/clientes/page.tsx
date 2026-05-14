'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  LogOut,
  FileText,
  Users,
  Eye,
} from 'lucide-react';
import { ClienteFormDialog } from '@/components/admin/cliente-form-dialog';
import { AsociarNormasDialog } from '@/components/admin/asociar-normas-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';

interface Cliente {
  cdCliente: number;
  cdCodigoInternoCliente?: string;
  dsRazonSocial: string;
  dsCUIT?: string;
  dsDomicilio?: string;
  dsLocalidad?: string;
  dsTelefono?: string;
  dsMail?: string;
  dsContacto1?: string;
  cdEstado: number;
  dsEstado: string;
  nuNormasAsociadas: number;
  nuUsuarios: number;
}

export default function ClientesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant ? parseInt(params.tenant as string) : 0;

  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [normasDialogOpen, setNormasDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete';
    id: number;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar clientes según el término de búsqueda
    if (searchTerm) {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.dsRazonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cliente.dsCUIT && cliente.dsCUIT.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cliente.cdCodigoInternoCliente &&
            cliente.cdCodigoInternoCliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cliente.dsLocalidad &&
            cliente.dsLocalidad.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClientes(filtered);
    } else {
      setFilteredClientes(clientes);
    }
  }, [searchTerm, clientes]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success) {
        router.push(`/login/${tenant}`);
        return;
      }

      const user = data.data.user;

      // Administradores y consultores pueden acceder
      if (user.cdTipoUsuario !== 2 && user.cdTipoUsuario !== 3) {
        router.push(`/dashboard/${tenant}`);
        return;
      }

      // Validar que el usuario pertenezca a esta empresa
      if (user.cdEmpresaConsultora !== tenant) {
        router.push(`/login/${tenant}`);
        return;
      }

      setUserName(user.dsNombreCompleto || user.dsUsuario);
      setEmpresaNombre(user.dsNombreEmpresaConsultora || '');
      setEmpresaLogo(user.dsLogoEmpresa || '');
    } catch (error) {
      router.push(`/login/${tenant}`);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar clientes
      const response = await fetch(`/api/admin/clientes?cdEmpresaConsultora=${tenant}`);
      const data = await response.json();

      if (data.success) {
        setClientes(data.data);
        setFilteredClientes(data.data);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/login/${tenant}`);
  };

  const handleNuevoCliente = () => {
    setSelectedCliente(null);
    setFormDialogOpen(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormDialogOpen(true);
  };

  const handleAsociarNormas = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setNormasDialogOpen(true);
  };

  const handleEliminarCliente = (cdCliente: number) => {
    setConfirmAction({
      type: 'delete',
      id: cdCliente,
      title: '¿Desactivar cliente?',
      description: 'Esta acción desactivará el cliente. Podrá reactivarlo más tarde si es necesario.',
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      const response = await fetch(`/api/admin/clientes/${confirmAction.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadData();
        toast({
          title: "Cliente desactivado",
          description: "El cliente se desactivó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al desactivar cliente',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return <Badge variant="success">{estado}</Badge>;
      case 'Inactivo':
        return <Badge variant="secondary">{estado}</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader 
        userName={userName}
        empresaNombre={empresaNombre}
        tenant={tenant.toString()}
        logoBase64={empresaLogo}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Gestión de Clientes' }
          ]}
        />

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">Administre las empresas cliente que audita</p>
        </div>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Clientes</CardDescription>
              <CardTitle className="text-3xl">{clientes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Clientes Activos</CardDescription>
              <CardTitle className="text-3xl">
                {clientes.filter((c) => c.cdEstado === 1).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Con Normas Asociadas</CardDescription>
              <CardTitle className="text-3xl">
                {clientes.filter((c) => c.nuNormasAsociadas > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Con Usuarios</CardDescription>
              <CardTitle className="text-3xl">
                {clientes.filter((c) => c.nuUsuarios > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de Clientes */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Clientes</CardTitle>
                <CardDescription>Gestione las empresas cliente que audita</CardDescription>
              </div>
              <Button onClick={handleNuevoCliente}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </div>

            {/* Buscador */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por razón social, CUIT, código o localidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? 'Intente con otros términos de búsqueda'
                    : 'Comience agregando un nuevo cliente'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNuevoCliente}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead>Localidad</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Normas</TableHead>
                      <TableHead>Usuarios</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente) => (
                      <TableRow key={cliente.cdCliente}>
                        <TableCell className="font-mono text-sm">
                          {cliente.cdCodigoInternoCliente || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{cliente.dsRazonSocial}</div>
                          {cliente.dsContacto1 && (
                            <div className="text-sm text-gray-600">{cliente.dsContacto1}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{cliente.dsCUIT || '-'}</TableCell>
                        <TableCell className="text-sm">{cliente.dsLocalidad || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {cliente.dsTelefono && (
                            <div className="text-xs">{cliente.dsTelefono}</div>
                          )}
                          {cliente.dsMail && (
                            <div className="text-xs text-blue-600">{cliente.dsMail}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAsociarNormas(cliente)}
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            {cliente.nuNormasAsociadas}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {cliente.nuUsuarios > 0 ? (
                            <Badge variant="outline">
                              <Users className="mr-1 h-3 w-3" />
                              {cliente.nuUsuarios}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell>{getEstadoBadge(cliente.dsEstado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/dashboard/${tenant}/clientes/${cliente.cdCliente}`)}
                              title="Ver Detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditarCliente(cliente)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {cliente.cdEstado === 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEliminarCliente(cliente.cdCliente)}
                                title="Desactivar"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ClienteFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        cliente={selectedCliente}
        cdEmpresaConsultora={tenant}
        onSuccess={loadData}
      />

      {selectedCliente && (
        <AsociarNormasDialog
          open={normasDialogOpen}
          onOpenChange={setNormasDialogOpen}
          clienteId={selectedCliente.cdCliente}
          clienteNombre={selectedCliente.dsRazonSocial}
          onSuccess={loadData}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={executeConfirmAction}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText="Desactivar"
          variant="destructive"
        />
      )}
    </div>
  );
}
