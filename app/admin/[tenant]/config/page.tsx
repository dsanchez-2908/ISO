'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, Plus, Edit, Trash2, Key, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

interface ConfigGlobal {
  dsURLBase: string;
  dsLogoBase64: string | null;
  dsUsuarioTokenAditus: string | null;
  dsClaveTokenAditus: string | null;
  dsURLTokenAditus: string | null;
  dsURLAgregarDocumentoAditus: string | null;
  dsURLModificarDocumentoAditus: string | null;
  dsURLVisorAditus: string | null;
}

interface SuperUsuario {
  cdUsuario: number;
  dsUsuario: string;
  dsNombreCompleto: string | null;
  dsMail: string | null;
  cdEstado: number;
  dsEstado: string;
  feCreacion: string;
  feUltimoAcceso: string | null;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Config general
  const [config, setConfig] = useState<ConfigGlobal>({
    dsURLBase: '',
    dsLogoBase64: null,
    dsUsuarioTokenAditus: null,
    dsClaveTokenAditus: null,
    dsURLTokenAditus: null,
    dsURLAgregarDocumentoAditus: null,
    dsURLModificarDocumentoAditus: null,
    dsURLVisorAditus: null,
  });

  // Super usuarios
  const [superUsuarios, setSuperUsuarios] = useState<SuperUsuario[]>([]);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [cambiarClaveDialogOpen, setCambiarClaveDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<SuperUsuario | null>(null);
  
  const [usuarioForm, setUsuarioForm] = useState({
    dsUsuario: '',
    dsClave: '',
    dsNombreCompleto: '',
    dsMail: '',
  });

  const [claveForm, setClaveForm] = useState({
    dsClave: '',
    snClaveTemporal: false,
  });

  useEffect(() => {
    checkAuth();
    loadConfig();
    loadSuperUsuarios();
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

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar configuración',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuperUsuarios = async () => {
    try {
      const response = await fetch('/api/admin/super-usuarios');
      const data = await response.json();

      if (data.success) {
        setSuperUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar super usuarios:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Configuración guardada correctamente',
        });
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor seleccione una imagen válida',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      setConfig({ ...config, dsLogoBase64: base64Data });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateUsuario = async () => {
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

      const response = await fetch('/api/admin/super-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioForm),
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
        });
        loadSuperUsuarios();
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

      const response = await fetch(`/api/admin/super-usuarios/${selectedUsuario.cdUsuario}`, {
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

  const handleDesactivarUsuario = async (cdUsuario: number) => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/super-usuarios/${cdUsuario}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Usuario desactivado correctamente',
        });
        loadSuperUsuarios();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/0/empresas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Configuración Global</h1>
        </div>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usuarios">Super Administradores</TabsTrigger>
          <TabsTrigger value="aditus">Gestor Documental</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configuración base del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="urlBase">URL Base</Label>
                <Input
                  id="urlBase"
                  value={config.dsURLBase || ''}
                  onChange={(e) => setConfig({ ...config, dsURLBase: e.target.value })}
                  placeholder="http://localhost:3000/login/"
                />
                <p className="text-sm text-gray-500">
                  URL base para acceso de empresas consultoras
                </p>
              </div>

              <div className="space-y-2">
                <Label>Logo Super Administrador</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  {config.dsLogoBase64 && (
                    <div className="flex items-center space-x-2">
                      <img
                        src={`data:image/png;base64,${config.dsLogoBase64}`}
                        alt="Logo preview"
                        className="h-16 object-contain border border-gray-200 rounded p-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfig({ ...config, dsLogoBase64: null })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Logo que se mostrará en la pantalla de login del super administrador
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={saving}>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuarios Super Administradores</CardTitle>
                  <CardDescription>
                    Gestionar usuarios con acceso total al sistema
                  </CardDescription>
                </div>
                <Button onClick={() => setUsuarioDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Ingreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superUsuarios.map((usuario) => (
                    <TableRow key={usuario.cdUsuario}>
                      <TableCell className="font-medium">{usuario.dsUsuario}</TableCell>
                      <TableCell>
                        {usuario.dsNombreCompleto || '-'}
                      </TableCell>
                      <TableCell>{usuario.dsMail}</TableCell>
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
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {usuario.cdEstado === 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDesactivarUsuario(usuario.cdUsuario)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aditus">
          <Card>
            <CardHeader>
              <CardTitle>Gestor Documental Aditus</CardTitle>
              <CardDescription>
                Configuración de integración con Aditus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usuarioToken">Usuario Token</Label>
                  <Input
                    id="usuarioToken"
                    value={config.dsUsuarioTokenAditus || ''}
                    onChange={(e) => setConfig({ ...config, dsUsuarioTokenAditus: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claveToken">Clave Token</Label>
                  <Input
                    id="claveToken"
                    type="password"
                    value={config.dsClaveTokenAditus || ''}
                    onChange={(e) => setConfig({ ...config, dsClaveTokenAditus: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urlToken">URL Token</Label>
                  <Input
                    id="urlToken"
                    value={config.dsURLTokenAditus || ''}
                    onChange={(e) => setConfig({ ...config, dsURLTokenAditus: e.target.value })}
                    placeholder="http://172.16.16.60:8981/realms/aditus/protocol/openid-connect/token"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlAgregar">URL Agregar Documento</Label>
                  <Input
                    id="urlAgregar"
                    value={config.dsURLAgregarDocumentoAditus || ''}
                    onChange={(e) => setConfig({ ...config, dsURLAgregarDocumentoAditus: e.target.value })}
                    placeholder="http://172.16.16.60:8093/documents/base64"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlModificar">URL Modificar Documento</Label>
                  <Input
                    id="urlModificar"
                    value={config.dsURLModificarDocumentoAditus || ''}
                    onChange={(e) => setConfig({ ...config, dsURLModificarDocumentoAditus: e.target.value })}
                    placeholder="http://172.16.16.60:8093/documents/base64"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlVisor">URL Visor</Label>
                  <Input
                    id="urlVisor"
                    value={config.dsURLVisorAditus || ''}
                    onChange={(e) => setConfig({ ...config, dsURLVisorAditus: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={saving}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nuevo Usuario */}
      <Dialog open={usuarioDialogOpen} onOpenChange={setUsuarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Super Administrador</DialogTitle>
            <DialogDescription>
              Crear un nuevo usuario con acceso total al sistema
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
            <Button onClick={handleCreateUsuario} disabled={saving}>
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
            <DialogDescription>
              Usuario: {selectedUsuario?.dsUsuario}
            </DialogDescription>
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
