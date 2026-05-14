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
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { NormaFormDialog } from '@/components/admin/norma-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Norma {
  cdNorma: number;
  cdCodigo: string;
  dsNombre: string;
  dsVersion?: string;
  dsOrganismoEmisor?: string;
  feVigenteDesde?: string;
  dsDescripcion?: string;
  cdEstado: number;
  dsEstado: string;
  feCreacion: string;
  feModificacion?: string;
  nuClientesAsociados: number;
}

export default function NormasPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant ? parseInt(params.tenant as string) : 0;

  const [loading, setLoading] = useState(true);
  const [normas, setNormas] = useState<Norma[]>([]);
  const [filteredNormas, setFilteredNormas] = useState<Norma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedNorma, setSelectedNorma] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'reactivate';
    cdNorma: number;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar normas según el término de búsqueda
    if (searchTerm) {
      const filtered = normas.filter(norma =>
        norma.cdCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        norma.dsNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (norma.dsVersion && norma.dsVersion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (norma.dsOrganismoEmisor && norma.dsOrganismoEmisor.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredNormas(filtered);
    } else {
      setFilteredNormas(normas);
    }
  }, [searchTerm, normas]);

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
      setEmpresaLogo(user.dsLogoEmpresa || '');
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
      } else {
        // Si falla, usar el nombre de la sesión
        const authResponse = await fetch('/api/auth/me');
        const authData = await authResponse.json();
        if (authData.success) {
          setEmpresaNombre(authData.data.user.dsNombreEmpresaConsultora || '');
        }
      }

      // Cargar normas de esta empresa
      const response = await fetch(`/api/admin/normas?cdEmpresaConsultora=${tenant}`);
      const data = await response.json();

      if (data.success) {
        setNormas(data.data);
        setFilteredNormas(data.data);
      }
    } catch (error) {
      console.error('Error al cargar normas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaNorma = () => {
    setSelectedNorma(null);
    setFormDialogOpen(true);
  };

  const handleEditarNorma = (norma: Norma) => {
    setSelectedNorma(norma);
    setFormDialogOpen(true);
  };

  const handleEliminarNorma = (cdNorma: number, nuClientesAsociados: number) => {
    if (nuClientesAsociados > 0) {
      toast({
        variant: 'destructive',
        title: 'No se puede desactivar',
        description: `Esta norma está asociada a ${nuClientesAsociados} cliente(s).`,
      });
      return;
    }

    setConfirmAction({
      type: 'delete',
      cdNorma,
      title: 'Desactivar Norma',
      description: '¿Está seguro que desea desactivar esta norma? Podrá reactivarla más adelante.',
    });
    setConfirmDialogOpen(true);
  };

  const handleReactivarNorma = (cdNorma: number) => {
    setConfirmAction({
      type: 'reactivate',
      cdNorma,
      title: 'Reactivar Norma',
      description: '¿Está seguro que desea reactivar esta norma?',
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      const isDelete = confirmAction.type === 'delete';
      const url = isDelete
        ? `/api/admin/normas/${confirmAction.cdNorma}`
        : `/api/admin/normas/${confirmAction.cdNorma}/reactivar`;
      const method = isDelete ? 'DELETE' : 'POST';

      const response = await fetch(url, { method });
      const data = await response.json();

      if (data.success) {
        loadData();
        toast({
          title: isDelete ? 'Norma desactivada' : 'Norma reactivada',
          description: isDelete
            ? 'La norma se desactivó correctamente'
            : 'La norma se reactivó correctamente',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || `Error al ${isDelete ? 'desactivar' : 'reactivar'} norma`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servidor',
        variant: 'destructive',
      });
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
        <Breadcrumb
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Gestión de Normas' },
          ]}
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Normas</CardDescription>
              <CardTitle className="text-3xl">{normas.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Normas Activas</CardDescription>
              <CardTitle className="text-3xl">
                {normas.filter(n => n.cdEstado === 1).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>En Uso por Clientes</CardDescription>
              <CardTitle className="text-3xl">
                {normas.filter(n => n.nuClientesAsociados > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de Normas */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Normas Configuradas</CardTitle>
                <CardDescription>Gestione las normas ISO de su empresa</CardDescription>
              </div>
              <Button onClick={handleNuevaNorma}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Norma
              </Button>
            </div>

            {/* Buscador */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, nombre, versión u organismo..."
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
            ) : filteredNormas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron normas' : 'No hay normas configuradas'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Intente con otros términos de búsqueda' : 'Comience creando una nueva norma ISO'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNuevaNorma}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Norma
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead>Organismo</TableHead>
                      <TableHead>Vigente Desde</TableHead>
                      <TableHead>Clientes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNormas.map((norma) => (
                      <TableRow key={norma.cdNorma}>
                        <TableCell className="font-mono font-semibold">{norma.cdCodigo}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{norma.dsNombre}</div>
                            {norma.dsDescripcion && (
                              <div className="text-sm text-gray-600 line-clamp-1">
                                {norma.dsDescripcion}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {norma.dsVersion && (
                            <Badge variant="outline">{norma.dsVersion}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{norma.dsOrganismoEmisor || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {norma.feVigenteDesde ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDate(new Date(norma.feVigenteDesde), 'short')}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {norma.nuClientesAsociados > 0 ? (
                            <Badge className="bg-green-600">{norma.nuClientesAsociados}</Badge>
                          ) : (
                            <span className="text-sm text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell>{getEstadoBadge(norma.dsEstado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/dashboard/${tenant}/normas/${norma.cdNorma}`)}
                              title="Ver Detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditarNorma(norma)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {norma.cdEstado === 1 ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEliminarNorma(norma.cdNorma, norma.nuClientesAsociados)}
                                title="Desactivar"
                                disabled={norma.nuClientesAsociados > 0}
                              >
                                <Trash2 className={`h-4 w-4 ${norma.nuClientesAsociados > 0 ? 'text-gray-400' : 'text-red-600'}`} />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReactivarNorma(norma.cdNorma)}
                                title="Reactivar"
                              >
                                <RefreshCw className="h-4 w-4 text-green-600" />
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
      <NormaFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        norma={selectedNorma}
        cdEmpresaConsultora={tenant}
        onSuccess={loadData}
      />

      {confirmAction && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={executeConfirmAction}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText={confirmAction.type === 'delete' ? 'Desactivar' : 'Reactivar'}
          variant={confirmAction.type === 'delete' ? 'destructive' : 'default'}
        />
      )}
    </div>
  );
}
