'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Award, FileCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Certificacion {
  cdCertificacion: number;
  cdCliente: number;
  cdNorma: number;
  dsNombreNorma: string;
  cdCodigoNorma: string;
  dsCodigo: string | null;
  cdEstado: number;
  dsEstado: string;
  feInicio: string | null;
  feFin: string | null;
  feVencimiento: string | null;
  feCertificacion: string | null;
  dsAuditor: string | null;
  dsObservaciones: string | null;
  nuTotalDocumentos: number;
  nuDocumentosCompletos: number;
}

interface Norma {
  cdNorma: number;
  cdCodigoNorma: string;
  dsNombre: string;
  cdEstado: number;
}

interface Estado {
  cdEstado: number;
  dsEstado: string;
}

interface CertificacionesListProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function CertificacionesList({ cdCliente, cdEmpresaConsultora }: CertificacionesListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [normas, setNormas] = useState<Norma[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCertificacion, setEditingCertificacion] = useState<Certificacion | null>(null);

  const [formData, setFormData] = useState({
    cdNorma: '',
    dsCodigo: '',
    cdEstado: '1',
    feInicio: '',
    feFin: '',
    feVencimiento: '',
    feCertificacion: '',
    dsAuditor: '',
    dsObservaciones: '',
  });

  useEffect(() => {
    loadCertificaciones();
    loadNormas();
    loadEstados();
  }, [cdCliente]);

  const loadCertificaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/certificaciones?cdCliente=${cdCliente}`);
      const data = await response.json();
      if (data.success) {
        setCertificaciones(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar certificaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNormas = async () => {
    try {
      const response = await fetch(`/api/admin/normas?cdEmpresaConsultora=${cdEmpresaConsultora}`);
      const data = await response.json();
      if (data.success) {
        setNormas(data.data.filter((n: any) => n.cdEstado === 1)); // Solo activas
      }
    } catch (error) {
      console.error('Error al cargar normas:', error);
    }
  };

  const loadEstados = async () => {
    try {
      const response = await fetch('/api/admin/estados');
      const data = await response.json();
      if (data.success) {
        setEstados(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estados:', error);
    }
  };

  const handleOpenDialog = (certificacion?: Certificacion) => {
    if (certificacion) {
      setEditingCertificacion(certificacion);
      setFormData({
        cdNorma: certificacion.cdNorma.toString(),
        dsCodigo: certificacion.dsCodigo || '',
        cdEstado: certificacion.cdEstado.toString(),
        feInicio: certificacion.feInicio ? certificacion.feInicio.split('T')[0] : '',
        feFin: certificacion.feFin ? certificacion.feFin.split('T')[0] : '',
        feVencimiento: certificacion.feVencimiento ? certificacion.feVencimiento.split('T')[0] : '',
        feCertificacion: certificacion.feCertificacion ? certificacion.feCertificacion.split('T')[0] : '',
        dsAuditor: certificacion.dsAuditor || '',
        dsObservaciones: certificacion.dsObservaciones || '',
      });
    } else {
      setEditingCertificacion(null);
      setFormData({
        cdNorma: '',
        dsCodigo: '',
        cdEstado: '1',
        feInicio: '',
        feFin: '',
        feVencimiento: '',
        feCertificacion: '',
        dsAuditor: '',
        dsObservaciones: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cdNorma) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar una norma',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const url = editingCertificacion
        ? `/api/admin/certificaciones/${editingCertificacion.cdCertificacion}`
        : '/api/admin/certificaciones';

      const method = editingCertificacion ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        cdCliente,
        cdEmpresaConsultora,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: editingCertificacion
            ? 'Certificación actualizada correctamente'
            : 'Certificación creada correctamente. Click en "Documentos" para gestionarla.',
          variant: 'success',
        });
        setDialogOpen(false);
        loadCertificaciones();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar certificación',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar certificación',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cdCertificacion: number) => {
    if (!confirm('¿Está seguro de eliminar esta certificación?')) return;

    try {
      const response = await fetch(`/api/admin/certificaciones/${cdCertificacion}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Certificación eliminada correctamente',
          variant: 'success',
        });
        loadCertificaciones();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar certificación',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar certificación',
        variant: 'destructive',
      });
    }
  };

  const handleVerDocumentos = (cdCertificacion: number) => {
    // Navegar a página de documentos de la certificación
    router.push(`/dashboard/${cdEmpresaConsultora}/certificaciones/${cdCertificacion}`);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando certificaciones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Certificaciones del Cliente</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      {certificaciones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No hay certificaciones registradas</p>
          <p className="text-sm mt-2">Cree una certificación para iniciar el proceso</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Norma</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Auditor</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificaciones.map((cert) => {
              const progreso = cert.nuTotalDocumentos > 0
                ? Math.round((cert.nuDocumentosCompletos / cert.nuTotalDocumentos) * 100)
                : 0;

              return (
                <TableRow key={cert.cdCertificacion}>
                  <TableCell className="font-mono text-sm">{cert.dsCodigo || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cert.dsNombreNorma}</p>
                      <p className="text-xs text-gray-500">{cert.cdCodigoNorma}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        cert.cdEstado === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : cert.cdEstado === 3
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cert.dsEstado}
                    </span>
                  </TableCell>
                  <TableCell>{cert.dsAuditor || '-'}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {cert.feInicio && <p>Inicio: {new Date(cert.feInicio).toLocaleDateString()}</p>}
                      {cert.feVencimiento && (
                        <p>Vence: {new Date(cert.feVencimiento).toLocaleDateString()}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progreso === 100 ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {cert.nuDocumentosCompletos}/{cert.nuTotalDocumentos}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerDocumentos(cert.cdCertificacion)}
                      >
                        <FileCheck className="h-4 w-4 mr-1" />
                        Documentos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(cert)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cert.cdCertificacion)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCertificacion ? 'Editar Certificación' : 'Nueva Certificación'}
            </DialogTitle>
            <DialogDescription>
              {editingCertificacion
                ? 'Actualice los datos de la certificación'
                : 'Complete los datos de la certificación. Luego podrá gestionar los documentos desde el botón "Documentos".'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cdNorma">
                  Norma <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.cdNorma}
                  onValueChange={(value) => setFormData({ ...formData, cdNorma: value })}
                  disabled={!!editingCertificacion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione norma" />
                  </SelectTrigger>
                  <SelectContent>
                    {normas.map((norma) => (
                      <SelectItem key={norma.cdNorma} value={norma.cdNorma.toString()}>
                        {norma.cdCodigoNorma} - {norma.dsNombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!!editingCertificacion && (
                  <p className="text-xs text-gray-500 mt-1">La norma no puede ser modificada</p>
                )}
              </div>

              <div>
                <Label htmlFor="dsCodigo">Código</Label>
                <Input
                  id="dsCodigo"
                  value={formData.dsCodigo}
                  onChange={(e) => setFormData({ ...formData, dsCodigo: e.target.value })}
                  placeholder="Ej: CERT-2024-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cdEstado">Estado</Label>
                <Select
                  value={formData.cdEstado}
                  onValueChange={(value) => setFormData({ ...formData, cdEstado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((estado) => (
                      <SelectItem key={estado.cdEstado} value={estado.cdEstado.toString()}>
                        {estado.dsEstado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dsAuditor">Auditor</Label>
                <Input
                  id="dsAuditor"
                  value={formData.dsAuditor}
                  onChange={(e) => setFormData({ ...formData, dsAuditor: e.target.value })}
                  placeholder="Nombre del auditor"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feInicio">Fecha Inicio</Label>
                <Input
                  id="feInicio"
                  type="date"
                  value={formData.feInicio}
                  onChange={(e) => setFormData({ ...formData, feInicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="feFin">Fecha Fin</Label>
                <Input
                  id="feFin"
                  type="date"
                  value={formData.feFin}
                  onChange={(e) => setFormData({ ...formData, feFin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feCertificacion">Fecha Certificación</Label>
                <Input
                  id="feCertificacion"
                  type="date"
                  value={formData.feCertificacion}
                  onChange={(e) => setFormData({ ...formData, feCertificacion: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="feVencimiento">Fecha Vencimiento</Label>
                <Input
                  id="feVencimiento"
                  type="date"
                  value={formData.feVencimiento}
                  onChange={(e) => setFormData({ ...formData, feVencimiento: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dsObservaciones">Observaciones</Label>
              <Textarea
                id="dsObservaciones"
                value={formData.dsObservaciones}
                onChange={(e) => setFormData({ ...formData, dsObservaciones: e.target.value })}
                rows={3}
                placeholder="Observaciones adicionales"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCertificacion ? 'Actualizar' : 'Crear Certificación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
