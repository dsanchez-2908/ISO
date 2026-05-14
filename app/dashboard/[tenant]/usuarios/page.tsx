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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Loader2,
  LogOut,
  Building2,
} from 'lucide-react';
import { UsuarioFormDialog } from '@/components/admin/usuario-form-dialog';
import { CambiarPasswordDialog } from '@/components/admin/cambiar-password-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface Usuario {
  cdUsuario: number;
  dsUsuario: string;
  dsNombreCompleto: string;
  dsMail: string;
  cdTipoUsuario: number;
  dsTipoUsuario: string;
  cdCliente?: number;
  dsCliente?: string;
  dsRoles?: string;
  snClaveTemporal: boolean;
  snPrimerIngreso: boolean;
  feUltimoAcceso?: string;
  feAltaUsuario: string;
  cdEstado: number;
  dsEstado: string;
}

interface Cliente {
  cdCliente: number;
  dsRazonSocial: string;
}

interface Rol {
  cdRol: number;
  dsRol: string;
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant ? parseInt(params.tenant as string) : 0;

  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');

  // Catálogos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
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
    loadCatalogos();
  }, []);

  useEffect(() => {
    // Filtrar usuarios según el término de búsqueda
    if (searchTerm) {
      const filtered = usuarios.filter(user =>
        user.dsNombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.dsUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.dsMail && user.dsMail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.dsTipoUsuario && user.dsTipoUsuario.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsuarios(filtered);
    } else {
      setFilteredUsuarios(usuarios);
    }
  }, [searchTerm, usuarios]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success) {
        router.push(`/login/${tenant}`);
        return;
      }

      const user = data.data.user;

      // Solo administradores de empresa pueden acceder
      if (user.cdTipoUsuario !== 2) {
        router.push(`/dashboard/${tenant}`);
        return;
      }

      // Validar que el usuario pertenezca a esta empresa
      if (user.cdEmpresaConsultora !== tenant) {
        router.push(`/login/${tenant}`);
        return;
      }

      setUserName(user.dsNombreCompleto || user.dsUsuario);
    } catch (error) {
      router.push(`/login/${tenant}`);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar empresa
      const empresaResponse = await fetch(`/api/admin/empresas/${tenant}`);
      const empresaData = await empresaResponse.json();
      if (empresaData.success) {
        setEmpresaNombre(empresaData.data.empresa.dsNombreEmpresaConsultora);
      }

      // Cargar usuarios de esta empresa solamente
      const response = await fetch(`/api/admin/usuarios?cdEmpresaConsultora=${tenant}`);
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.data);
        setFilteredUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogos = async () => {
    try {
      // Cargar clientes (para usuarios externos)
      // TODO: Crear endpoint de clientes cuando se implemente ese módulo
      setClientes([]);

      // Cargar roles de esta empresa
      const rolesResponse = await fetch(`/api/admin/roles?cdEmpresaConsultora=${tenant}`);
      const rolesData = await rolesResponse.json();
      if (rolesData.success) {
        setRoles(rolesData.data);
      } else {
        // Roles por defecto mientras se crea el módulo
        setRoles([
          { cdRol: 2, dsRol: 'Administrador' },
          { cdRol: 3, dsRol: 'Consultor' },
          { cdRol: 4, dsRol: 'Cliente' },
        ]);
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      // Roles por defecto
      setRoles([
        { cdRol: 2, dsRol: 'Administrador' },
        { cdRol: 3, dsRol: 'Consultor' },
        { cdRol: 4, dsRol: 'Cliente' },
      ]);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/login/${tenant}`);
  };

  const handleNuevoUsuario = () => {
    setSelectedUsuario(null);
    setFormDialogOpen(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormDialogOpen(true);
  };

  const handleCambiarPassword = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setPasswordDialogOpen(true);
  };

  const handleEliminarUsuario = (cdUsuario: number) => {
    setConfirmAction({
      type: 'delete',
      id: cdUsuario,
      title: '¿Desactivar usuario?',
      description: 'Esta acción desactivará el usuario. Podrá reactivarlo más tarde si es necesario.',
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      const response = await fetch(`/api/admin/usuarios/${confirmAction.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadData();
        toast({
          title: "Usuario desactivado",
          description: "El usuario se desactivó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al desactivar usuario',
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

  const getTipoUsuarioBadge = (tipo: string) => {
    switch (tipo) {
      case 'Super Admin':
        return <Badge className="bg-purple-600">{tipo}</Badge>;
      case 'Interno':
        return <Badge className="bg-blue-600">{tipo}</Badge>;
      case 'Externo':
        return <Badge className="bg-green-600">{tipo}</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-sm text-gray-600">
                  {empresaNombre} - {userName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/${tenant}`)}>
                <Building2 className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Usuarios</CardDescription>
              <CardTitle className="text-3xl">{usuarios.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Usuarios Activos</CardDescription>
              <CardTitle className="text-3xl">
                {usuarios.filter(u => u.cdEstado === 1).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Usuarios Internos</CardDescription>
              <CardTitle className="text-3xl">
                {usuarios.filter(u => u.cdTipoUsuario === 2).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Usuarios Externos</CardDescription>
              <CardTitle className="text-3xl">
                {usuarios.filter(u => u.cdTipoUsuario === 3).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de Usuarios */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Usuarios del Sistema</CardTitle>
                <CardDescription>Gestione los usuarios y sus permisos</CardDescription>
              </div>
              <Button onClick={handleNuevoUsuario}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </div>

            {/* Buscador */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, usuario, email o tipo..."
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
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Intente con otros términos de búsqueda' : 'Comience creando un nuevo usuario'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNuevoUsuario}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Alta</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.cdUsuario}>
                        <TableCell className="font-mono text-sm">{usuario.dsUsuario}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{usuario.dsNombreCompleto}</div>
                            {usuario.dsCliente && (
                              <div className="text-sm text-gray-600">{usuario.dsCliente}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{usuario.dsMail}</TableCell>
                        <TableCell>{getTipoUsuarioBadge(usuario.dsTipoUsuario)}</TableCell>
                        <TableCell>
                          {usuario.dsRoles ? (
                            <div className="flex flex-wrap gap-1">
                              {usuario.dsRoles.split(', ').map((rol, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {rol}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin roles</span>
                          )}
                        </TableCell>
                        <TableCell>{getEstadoBadge(usuario.dsEstado)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(new Date(usuario.feAltaUsuario), 'short')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCambiarPassword(usuario)}
                              title="Cambiar contraseña"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditarUsuario(usuario)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {usuario.cdEstado === 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEliminarUsuario(usuario.cdUsuario)}
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
      <UsuarioFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        usuario={selectedUsuario}
        cdEmpresaConsultora={tenant}
        clientes={clientes}
        roles={roles}
        onSuccess={loadData}
      />

      <CambiarPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        usuario={selectedUsuario}
        onSuccess={loadData}
      />

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
