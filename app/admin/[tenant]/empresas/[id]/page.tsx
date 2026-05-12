'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  Plus,
  Key,
  Loader2,
  UserPlus,
  Save,
  Mail,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  cdEmpresaConsultora: number;
  dsNombreEmpresaConsultora: string;
  dsCUIT: string;
  dsMail: string;
  dsTelefono: string | null;
  dsLogo: string | null;
  dsDomicilio: string | null;
  dsLocalidad: string | null;
  dsCodigoPostal: string | null;
  dsProvincia: string | null;
  dsPais: string | null;
  dsContactoNombre: string | null;
  dsContactoTelefono: string | null;
  dsContactoEmail: string | null;
  cdEstado: number;
  feCreacion: string;
}

interface Usuario {
  cdUsuario: number;
  dsUsuario: string;
  dsNombreCompleto: string | null;
  dsMail: string | null;
  cdEstado: number;
  dsEstado: string;
  dsRoles: string;
  feUltimoAcceso: string | null;
}

interface GestorDocumental {
  cdEmpresaGestorDocumental?: number;
  dsCodigoLibreria: string;
  dsCodigoClase: string;
}

export default function EmpresaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const cdEmpresaConsultora = params?.id ? parseInt(params.id as string) : 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [gestorDocumental, setGestorDocumental] = useState<GestorDocumental>({
    dsCodigoLibreria: '',
    dsCodigoClase: '',
  });

  // Dialogs
  const [editarDialogOpen, setEditarDialogOpen] = useState(false);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [cambiarClaveDialogOpen, setCambiarClaveDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  // Forms
  const [empresaForm, setEmpresaForm] = useState<Empresa | null>(null);
  const [usuarioForm, setUsuarioForm] = useState({
    dsUsuario: '',
    dsClave: '',
    dsNombreCompleto: '',
    dsMail: '',
    cdTipoUsuario: 2, // Admin de empresa
  });
  const [claveForm, setClaveForm] = useState({
    dsClave: '',
    snClaveTemporal: false,
  });

  useEffect(() => {
    checkAuth();
    loadEmpresa();
    loadUsuarios();
    loadGestorDocumental();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success || data.data.user.cdTipoUsuario !== 1) {
        router.push('/login/0');
      }
    } catch (error) {
      router.push('/login/0');
    }
  };

  const loadEmpresa = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}`);
      const data = await response.json();

      if (data.success) {
        setEmpresa(data.data.empresa);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Empresa no encontrada',
        });
        router.push('/admin/0/empresas');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar empresa',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await fetch(`/api/admin/usuarios?cdEmpresaConsultora=${cdEmpresaConsultora}`);
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadGestorDocumental = async () => {
    try {
      const response = await fetch(`/api/admin/empresas-gestor-documental?cdEmpresaConsultora=${cdEmpresaConsultora}`);
      const data = await response.json();

      if (data.success && data.data) {
        setGestorDocumental({
          cdEmpresaGestorDocumental: data.data.cdEmpresaGestorDocumental,
          dsCodigoLibreria: data.data.dsCodigoLibreria || '',
          dsCodigoClase: data.data.dsCodigoClase || '',
        });
      }
    } catch (error) {
      console.error('Error al cargar gestor documental:', error);
    }
  };

  const handleEditarEmpresa = () => {
    setEmpresaForm({ ...empresa! });
    setEditarDialogOpen(true);
  };

  const handleSaveEmpresa = async () => {
    try {
      if (!empresaForm) return;

      setSaving(true);

      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaForm),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Empresa actualizada correctamente',
        });
        setEditarDialogOpen(false);
        loadEmpresa();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al actualizar empresa',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivarEmpresa = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Empresa desactivada correctamente',
        });
        router.push('/admin/0/empresas');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al desactivar empresa',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReactivarEmpresa = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}/reactivar`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Empresa reactivada correctamente',
        });
        loadEmpresa();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al reactivar empresa',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCrearUsuario = async () => {
    try {
      if (!usuarioForm.dsUsuario || !usuarioForm.dsClave) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Usuario y contraseña son obligatorios',
        });
        return;
      }

      setSaving(true);

      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...usuarioForm,
          cdEmpresaConsultora,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Usuario creado correctamente',
        });
        setUsuarioDialogOpen(false);
        setUsuarioForm({
          dsUsuario: '',
          dsClave: '',
          dsNombreCompleto: '',
          dsMail: '',
          cdTipoUsuario: 2,
        });
        loadUsuarios();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al crear usuario',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarClave = async () => {
    try {
      if (!selectedUsuario || !claveForm.dsClave) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La contraseña es obligatoria',
        });
        return;
      }

      setSaving(true);

      const response = await fetch(`/api/admin/usuarios/${selectedUsuario.cdUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claveForm),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Contraseña actualizada correctamente',
        });
        setCambiarClaveDialogOpen(false);
        setSelectedUsuario(null);
        setClaveForm({ dsClave: '', snClaveTemporal: false });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al cambiar contraseña',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivarUsuario = async (cdUsuario: number, dsUsuario: string) => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/usuarios/${cdUsuario}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: `Usuario "${dsUsuario}" desactivado correctamente`,
        });
        loadUsuarios();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al desactivar usuario',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGestorDocumental = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/empresas-gestor-documental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdEmpresaConsultora,
          ...gestorDocumental,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Configuración del gestor documental guardada correctamente',
        });
        loadGestorDocumental();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al guardar configuración',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!empresa) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header con botón volver */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/0/empresas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Detalle de Empresa</h1>
        </div>
        <div className="flex items-center space-x-2">
          {empresa.cdEstado === 2 && (
            <Button onClick={handleReactivarEmpresa} disabled={saving}>
              <UserPlus className="h-4 w-4 mr-2" />
              Reactivar
            </Button>
          )}
        </div>
      </div>

      {/* Card con información de la empresa */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {empresa.dsLogo ? (
                <img
                  src={`data:image/png;base64,${empresa.dsLogo}`}
                  alt="Logo"
                  className="h-20 w-20 object-contain rounded border border-gray-200"
                />
              ) : (
                <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{empresa.dsNombreEmpresaConsultora}</CardTitle>
                <CardDescription>CUIT: {empresa.dsCUIT}</CardDescription>
                <Badge variant={empresa.cdEstado === 1 ? 'default' : 'secondary'} className="mt-2">
                  {empresa.cdEstado === 1 ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleEditarEmpresa}>
                <Edit className="h-4 w-4 mr-2" />
                Modificar
              </Button>
              {empresa.cdEstado === 1 && (
                <Button variant="destructive" onClick={handleDesactivarEmpresa} disabled={saving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Desactivar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Información de Contacto</div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {empresa.dsMail || 'No especificado'}
                  </div>
                  {empresa.dsTelefono && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {empresa.dsTelefono}
                    </div>
                  )}
                </div>
              </div>

              {(empresa.dsDomicilio || empresa.dsLocalidad || empresa.dsProvincia) && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Dirección</div>
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      {empresa.dsDomicilio && <div>{empresa.dsDomicilio}</div>}
                      {empresa.dsLocalidad && (
                        <div>
                          {empresa.dsCodigoPostal && `${empresa.dsCodigoPostal} - `}
                          {empresa.dsLocalidad}
                        </div>
                      )}
                      {empresa.dsProvincia && <div>{empresa.dsProvincia}</div>}
                      {empresa.dsPais && <div>{empresa.dsPais}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(empresa.dsContactoNombre || empresa.dsContactoEmail || empresa.dsContactoTelefono) && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Persona de Contacto</div>
                  <div className="space-y-2">
                    {empresa.dsContactoNombre && (
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {empresa.dsContactoNombre}
                      </div>
                    )}
                    {empresa.dsContactoEmail && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {empresa.dsContactoEmail}
                      </div>
                    )}
                    {empresa.dsContactoTelefono && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {empresa.dsContactoTelefono}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Fecha de Creación</div>
                <div className="text-sm">
                  {new Date(empresa.feCreacion).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Usuarios y Gestor Documental */}
      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="gestor">Gestor Documental</TabsTrigger>
        </TabsList>

        {/* Tab Usuarios */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuarios de la Empresa</CardTitle>
                  <CardDescription>
                    Gestionar usuarios con acceso a la plataforma
                  </CardDescription>
                </div>
                <Button onClick={() => setUsuarioDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usuarios.length === 0 ? (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay usuarios registrados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comience creando un usuario administrador
                  </p>
                  <Button onClick={() => setUsuarioDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Ingreso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.cdUsuario}>
                        <TableCell className="font-medium">{usuario.dsUsuario}</TableCell>
                        <TableCell>
                          {usuario.dsNombreCompleto || '-'}
                        </TableCell>
                        <TableCell>{usuario.dsMail}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{usuario.dsRoles || 'Sin roles'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={usuario.cdEstado === 1 ? 'default' : 'secondary'}>
                            {usuario.dsEstado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {usuario.feUltimoAcceso
                            ? new Date(usuario.feUltimoAcceso).toLocaleDateString()
                            : 'Nunca'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUsuario(usuario);
                                setCambiarClaveDialogOpen(true);
                              }}
                              title="Cambiar Contraseña"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            {usuario.cdEstado === 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDesactivarUsuario(usuario.cdUsuario, usuario.dsUsuario)}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Gestor Documental */}
        <TabsContent value="gestor">
          <Card>
            <CardHeader>
              <CardTitle>Gestor Documental</CardTitle>
              <CardDescription>
                Configuración de integración con Aditus para esta empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="codigoLibreria">Código Librería</Label>
                  <Input
                    id="codigoLibreria"
                    value={gestorDocumental.dsCodigoLibreria}
                    onChange={(e) =>
                      setGestorDocumental({ ...gestorDocumental, dsCodigoLibreria: e.target.value })
                    }
                    placeholder="Ingrese código de librería"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoClase">Código Clase</Label>
                  <Input
                    id="codigoClase"
                    value={gestorDocumental.dsCodigoClase}
                    onChange={(e) =>
                      setGestorDocumental({ ...gestorDocumental, dsCodigoClase: e.target.value })
                    }
                    placeholder="Ingrese código de clase"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveGestorDocumental} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Editar Empresa */}
      <Dialog open={editarDialogOpen} onOpenChange={setEditarDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modificar Empresa</DialogTitle>
            <DialogDescription>
              Actualizar información de la empresa consultora
            </DialogDescription>
          </DialogHeader>
          {empresaForm && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="editNombreEmpresa">Nombre de la Empresa *</Label>
                  <Input
                    id="editNombreEmpresa"
                    value={empresaForm.dsNombreEmpresaConsultora}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, dsNombreEmpresaConsultora: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCUIT">CUIT *</Label>
                  <Input
                    id="editCUIT"
                    value={empresaForm.dsCUIT}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsCUIT: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editMail">Email *</Label>
                  <Input
                    id="editMail"
                    type="email"
                    value={empresaForm.dsMail}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsMail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editTelefono">Teléfono</Label>
                  <Input
                    id="editTelefono"
                    value={empresaForm.dsTelefono || ''}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsTelefono: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDomicilio">Domicilio</Label>
                  <Input
                    id="editDomicilio"
                    value={empresaForm.dsDomicilio || ''}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsDomicilio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editLocalidad">Localidad</Label>
                  <Input
                    id="editLocalidad"
                    value={empresaForm.dsLocalidad || ''}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsLocalidad: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCodigoPostal">Código Postal</Label>
                  <Input
                    id="editCodigoPostal"
                    value={empresaForm.dsCodigoPostal || ''}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, dsCodigoPostal: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editProvincia">Provincia</Label>
                  <Input
                    id="editProvincia"
                    value={empresaForm.dsProvincia || ''}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsProvincia: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editPais">País</Label>
                  <Input
                    id="editPais"
                    value={empresaForm.dsPais || ''}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, dsPais: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-base font-semibold">Persona de Contacto</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editContactoNombre">Nombre</Label>
                  <Input
                    id="editContactoNombre"
                    value={empresaForm.dsContactoNombre || ''}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, dsContactoNombre: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editContactoEmail">Email</Label>
                  <Input
                    id="editContactoEmail"
                    type="email"
                    value={empresaForm.dsContactoEmail || ''}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, dsContactoEmail: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="editContactoTelefono">Teléfono</Label>
                  <Input
                    id="editContactoTelefono"
                    value={empresaForm.dsContactoTelefono || ''}
                    onChange={(e) =>
                      setEmpresaForm({ ...empresaForm, dsContactoTelefono: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEmpresa} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuevo Usuario */}
      <Dialog open={usuarioDialogOpen} onOpenChange={setUsuarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crear un nuevo usuario para {empresa.dsNombreEmpresaConsultora}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newUsuario">Usuario *</Label>
              <Input
                id="newUsuario"
                value={usuarioForm.dsUsuario}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, dsUsuario: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClave">Contraseña *</Label>
              <Input
                id="newClave"
                type="password"
                value={usuarioForm.dsClave}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, dsClave: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newNombreCompleto">Nombre Completo</Label>
              <Input
                id="newNombreCompleto"
                value={usuarioForm.dsNombreCompleto}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, dsNombreCompleto: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newMail">Email</Label>
              <Input
                id="newMail"
                type="email"
                value={usuarioForm.dsMail}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, dsMail: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setUsuarioDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearUsuario} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Cambiar Clave */}
      <Dialog open={cambiarClaveDialogOpen} onOpenChange={setCambiarClaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>Usuario: {selectedUsuario?.dsUsuario}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nuevaClave">Nueva Contraseña *</Label>
              <Input
                id="nuevaClave"
                type="password"
                value={claveForm.dsClave}
                onChange={(e) => setClaveForm({ ...claveForm, dsClave: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="claveTemporal"
                checked={claveForm.snClaveTemporal}
                onChange={(e) => setClaveForm({ ...claveForm, snClaveTemporal: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="claveTemporal" className="cursor-pointer">
                Establecer como contraseña temporal (el usuario deberá cambiarla al ingresar)
              </Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setCambiarClaveDialogOpen(false);
                setSelectedUsuario(null);
                setClaveForm({ dsClave: '', snClaveTemporal: false });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCambiarClave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
