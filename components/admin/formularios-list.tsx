'use client';

import { useEffect, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Settings, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplatesCamposList } from '@/components/admin/templates-campos-list';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Formulario {
  cdTemplateDocumento: number;
  cdNorma: number;
  cdRequisito: number | null;
  cdCodigo: string | null;
  dsNombre: string;
  cdTipoDocumento: number | null;
  dsVersionTemplate: string | null;
  dsArchivoWord: string | null;
  dsNombreArchivo: string | null;
  snActivo: boolean;
  nuRequisitosAsociados?: number;
}

interface FormulariosListProps {
  cdNorma: number;
}

export function FormulariosList({ cdNorma }: FormulariosListProps) {
  const { toast } = useToast();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [camposDialogOpen, setCamposDialogOpen] = useState(false);
  const [editingFormulario, setEditingFormulario] = useState<Formulario | null>(null);
  const [selectedFormularioForCampos, setSelectedFormularioForCampos] = useState<Formulario | null>(null);
  const [formData, setFormData] = useState({
    cdCodigo: '',
    dsNombre: '',
    dsVersionTemplate: '',
    dsNombreArchivo: '',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'reactivate';
    cdTemplateDocumento: number;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    loadFormularios();
  }, [cdNorma]);

  const loadFormularios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/formularios?cdNorma=${cdNorma}`);
      const data = await response.json();
      if (data.success) {
        setFormularios(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar formularios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (formulario?: Formulario) => {
    if (formulario) {
      setEditingFormulario(formulario);
      setFormData({
        cdCodigo: formulario.cdCodigo || '',
        dsNombre: formulario.dsNombre,
        dsVersionTemplate: formulario.dsVersionTemplate || '',
        dsNombreArchivo: formulario.dsNombreArchivo || '',
      });
    } else {
      setEditingFormulario(null);
      setFormData({
        cdCodigo: '',
        dsNombre: '',
        dsVersionTemplate: '',
        dsNombreArchivo: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingFormulario
        ? `/api/admin/formularios/${editingFormulario.cdTemplateDocumento}`
        : '/api/admin/formularios';

      const method = editingFormulario ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        cdNorma,
        snActivo: editingFormulario?.snActivo !== undefined ? editingFormulario.snActivo : true,
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
          description: `Formulario ${editingFormulario ? 'actualizado' : 'creado'} correctamente`,
          variant: 'success',
        });
        setDialogOpen(false);
        loadFormularios();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar formulario',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar formulario',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (cdTemplateDocumento: number) => {
    setConfirmAction({
      type: 'delete',
      cdTemplateDocumento,
      title: 'Desactivar Formulario',
      description: '¿Está seguro de desactivar este formulario? Se desasociará de todos los requisitos y podrá reactivarlo más adelante.',
    });
    setConfirmDialogOpen(true);
  };

  const handleReactivar = (cdTemplateDocumento: number) => {
    setConfirmAction({
      type: 'reactivate',
      cdTemplateDocumento,
      title: 'Reactivar Formulario',
      description: '¿Está seguro de reactivar este formulario?',
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    const { type, cdTemplateDocumento } = confirmAction;

    try {
      const url = type === 'delete'
        ? `/api/admin/formularios/${cdTemplateDocumento}`
        : `/api/admin/formularios/${cdTemplateDocumento}/reactivar`;
      const method = type === 'delete' ? 'DELETE' : 'POST';

      const response = await fetch(url, { method });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: type === 'delete' ? 'Formulario desactivado correctamente' : 'Formulario reactivado correctamente',
          variant: 'success',
        });
        loadFormularios();
      } else {
        toast({
          title: 'Error',
          description: data.error || `Error al ${type === 'delete' ? 'desactivar' : 'reactivar'} formulario`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error al ${type === 'delete' ? 'desactivar' : 'reactivar'} formulario`,
        variant: 'destructive',
      });
    }
  };

  const handleOpenCamposDialog = (formulario: Formulario) => {
    setSelectedFormularioForCampos(formulario);
    setCamposDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando formularios...</div>;
  }

  const formulariosActivos = formularios.filter(f => f.snActivo);
  const formulariosInactivos = formularios.filter(f => !f.snActivo);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {formulariosActivos.length} formulario{formulariosActivos.length !== 1 ? 's' : ''} activo{formulariosActivos.length !== 1 ? 's' : ''}
            {formulariosInactivos.length > 0 && ` • ${formulariosInactivos.length} inactivo${formulariosInactivos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Formulario
        </Button>
      </div>

      {/* Lista de Formularios */}
      {formularios.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          No hay formularios definidos. Click en "Nuevo Formulario" para agregar uno.
        </div>
      ) : (
        <>
          {/* Formularios Activos */}
          {formulariosActivos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Formularios Activos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead>Requisitos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulariosActivos.map((formulario) => (
                    <TableRow key={formulario.cdTemplateDocumento}>
                      <TableCell className="font-mono text-sm">
                        {formulario.cdCodigo || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{formulario.dsNombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formulario.dsVersionTemplate || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {formulario.nuRequisitosAsociados || 0} requisito{(formulario.nuRequisitosAsociados || 0) !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCamposDialog(formulario)}
                            title="Configurar campos"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(formulario)}
                            title="Editar formulario"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(formulario.cdTemplateDocumento)}
                            title="Desactivar formulario"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Formularios Inactivos */}
          {formulariosInactivos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Formularios Inactivos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulariosInactivos.map((formulario) => (
                    <TableRow key={formulario.cdTemplateDocumento} className="opacity-60">
                      <TableCell className="font-mono text-sm">
                        {formulario.cdCodigo || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{formulario.dsNombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formulario.dsVersionTemplate || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivar(formulario.cdTemplateDocumento)}
                          title="Reactivar formulario"
                        >
                          <RefreshCw className="h-4 w-4 text-green-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Dialog CRUD Formulario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFormulario ? 'Editar Formulario' : 'Nuevo Formulario'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del formulario. Los formularios pueden ser asociados a múltiples requisitos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cdCodigo">Código</Label>
                <Input
                  id="cdCodigo"
                  value={formData.cdCodigo}
                  onChange={(e) => setFormData({ ...formData, cdCodigo: e.target.value })}
                  placeholder="Ej: FORM-001"
                />
              </div>

              <div>
                <Label htmlFor="dsVersionTemplate">Versión</Label>
                <Input
                  id="dsVersionTemplate"
                  value={formData.dsVersionTemplate}
                  onChange={(e) => setFormData({ ...formData, dsVersionTemplate: e.target.value })}
                  placeholder="Ej: 1.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dsNombre">Nombre del Formulario *</Label>
              <Input
                id="dsNombre"
                value={formData.dsNombre}
                onChange={(e) => setFormData({ ...formData, dsNombre: e.target.value })}
                required
                placeholder="Ej: Registro de Capacitaciones"
              />
            </div>

            <div>
              <Label htmlFor="dsNombreArchivo">Nombre de Archivo</Label>
              <Input
                id="dsNombreArchivo"
                value={formData.dsNombreArchivo}
                onChange={(e) => setFormData({ ...formData, dsNombreArchivo: e.target.value })}
                placeholder="Ej: registro_capacitaciones.docx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre que tendrá el archivo cuando se genere
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFormulario ? 'Actualizar' : 'Crear'} Formulario
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Configurar Campos */}
      <Dialog open={camposDialogOpen} onOpenChange={setCamposDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Campos - {selectedFormularioForCampos?.dsNombre}</DialogTitle>
            <DialogDescription>
              Configure los campos que compondrán este formulario. Los campos se utilizarán para capturar información en las certificaciones.
            </DialogDescription>
          </DialogHeader>

          {selectedFormularioForCampos && (
            <TemplatesCamposList
              cdTemplateDocumento={selectedFormularioForCampos.cdTemplateDocumento}
              cdNorma={cdNorma}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        onConfirm={executeConfirmAction}
      />
    </div>
  );
}
