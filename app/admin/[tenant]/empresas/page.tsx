'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  UserPlus,
  Loader2,
  LogOut,
} from 'lucide-react';
import { EmpresaFormDialog } from '@/components/admin/empresa-form-dialog';
import { UsuarioAdminDialog } from '@/components/admin/usuario-admin-dialog';
import { formatDate } from '@/lib/utils';

interface Empresa {
  cdEmpresaConsultora: number;
  dsNombreEmpresaConsultora: string;
  dsCUIT: string;
  dsMail: string;
  dsTelefono: string;
  dsLocalidad: string;
  cdEstado: number;
  dsEstado: string;
  nuUsuarios: number;
  nuClientes: number;
  feCreacion: string;
}

export default function EmpresasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar empresas según el término de búsqueda
    if (searchTerm) {
      const filtered = empresas.filter(emp =>
        emp.dsNombreEmpresaConsultora.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.dsCUIT.includes(searchTerm) ||
        (emp.dsMail && emp.dsMail.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEmpresas(filtered);
    } else {
      setFilteredEmpresas(empresas);
    }
  }, [searchTerm, empresas]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success || data.data.user.cdTipoUsuario !== 1) {
        router.push('/login/0');
        return;
      }

      setUserName(data.data.user.dsNombres || data.data.user.dsUsuario);
    } catch (error) {
      router.push('/login/0');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/empresas');
      const data = await response.json();

      if (data.success) {
        setEmpresas(data.data);
        setFilteredEmpresas(data.data);
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/0');
  };

  const handleNuevaEmpresa = () => {
    setSelectedEmpresa(null);
    setFormDialogOpen(true);
  };

  const handleEditarEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setFormDialogOpen(true);
  };

  const handleCrearUsuarioAdmin = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setUsuarioDialogOpen(true);
  };

  const handleEliminarEmpresa = async (cdEmpresaConsultora: number) => {
    if (!confirm('¿Está seguro que desea desactivar esta empresa?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadData();
      } else {
        alert(data.error || 'Error al desactivar empresa');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas Consultoras</h1>
                <p className="text-sm text-gray-600">Super Administrador - {userName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Empresas</CardDescription>
              <CardTitle className="text-3xl">{empresas.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Empresas Activas</CardDescription>
              <CardTitle className="text-3xl">
                {empresas.filter(e => e.cdEstado === 1).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Usuarios</CardDescription>
              <CardTitle className="text-3xl">
                {empresas.reduce((sum, e) => sum + e.nuUsuarios, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de Empresas */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Empresas Consultoras</CardTitle>
                <CardDescription>Gestione las empresas del sistema</CardDescription>
              </div>
              <Button onClick={handleNuevaEmpresa}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Empresa
              </Button>
            </div>

            {/* Buscador */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, CUIT o email..."
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
            ) : filteredEmpresas.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Intente con otros términos de búsqueda' : 'Comience creando una nueva empresa'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNuevaEmpresa}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Empresa
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead className="text-center">Usuarios</TableHead>
                      <TableHead className="text-center">Clientes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmpresas.map((empresa) => (
                      <TableRow key={empresa.cdEmpresaConsultora}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{empresa.dsNombreEmpresaConsultora}</div>
                            {empresa.dsLocalidad && (
                              <div className="text-sm text-gray-600">{empresa.dsLocalidad}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{empresa.dsCUIT}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{empresa.dsMail}</div>
                            {empresa.dsTelefono && (
                              <div className="text-gray-600">{empresa.dsTelefono}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{empresa.nuUsuarios}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{empresa.nuClientes}</Badge>
                        </TableCell>
                        <TableCell>{getEstadoBadge(empresa.dsEstado)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(new Date(empresa.feCreacion), 'short')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCrearUsuarioAdmin(empresa)}
                              title="Crear Usuario Admin"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditarEmpresa(empresa)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {empresa.cdEstado === 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEliminarEmpresa(empresa.cdEmpresaConsultora)}
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
      <EmpresaFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        empresa={selectedEmpresa}
        onSuccess={loadData}
      />

      <UsuarioAdminDialog
        open={usuarioDialogOpen}
        onOpenChange={setUsuarioDialogOpen}
        cdEmpresaConsultora={selectedEmpresa?.cdEmpresaConsultora}
        dsNombreEmpresa={selectedEmpresa?.dsNombreEmpresaConsultora}
        onSuccess={() => {
          loadData();
          setUsuarioDialogOpen(false);
        }}
      />
    </div>
  );
}
