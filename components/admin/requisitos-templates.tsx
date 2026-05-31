'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { RequisitoFormularios } from '@/components/admin/requisito-formularios';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Requisito {
  cdRequisito: number;
  cdNorma: number;
  cdCodigoRequisito: string | null;
  dsRequisito: string;
  dsDescripcion: string | null;
  nuOrden: number | null;
  cdEstado: number;
  dsEstado: string;
}

interface RequisitosTemplatesProps {
  cdNorma: number;
}

export function RequisitosTemplates({ cdNorma }: RequisitosTemplatesProps) {
  const { toast } = useToast();
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequisito, setExpandedRequisito] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState<Requisito | null>(null);
  const [formData, setFormData] = useState({
    cdCodigoRequisito: '',
    dsRequisito: '',
    dsDescripcion: '',
    nuOrden: '',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'reactivate';
    cdRequisito: number;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    loadRequisitos();
  }, [cdNorma]);

  const loadRequisitos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/requisitos?cdNorma=${cdNorma}`);
      const data = await response.json();
      if (data.success) {
        setRequisitos(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar requisitos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (requisito?: Requisito) => {
    if (requisito) {
      setEditingRequisito(requisito);
      setFormData({
        cdCodigoRequisito: requisito.cdCodigoRequisito || '',
        dsRequisito: requisito.dsRequisito,
        dsDescripcion: requisito.dsDescripcion || '',
        nuOrden: requisito.nuOrden?.toString() || '',
      });
    } else {
      setEditingRequisito(null);
      setFormData({
        cdCodigoRequisito: '',
        dsRequisito: '',
        dsDescripcion: '',
        nuOrden: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRequisito
        ? `/api/admin/requisitos/${editingRequisito.cdRequisito}`
        : '/api/admin/requisitos';

      const response = await fetch(url, {
        method: editingRequisito ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cdNorma,
          nuOrden: formData.nuOrden ? parseInt(formData.nuOrden) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: editingRequisito ? 'Requisito actualizado' : 'Requisito creado',
          variant: 'success',
        });
        setDialogOpen(false);
        loadRequisitos();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (cdRequisito: number) => {
    setConfirmAction({
      type: 'delete',
      cdRequisito,
      title: 'Desactivar Requisito',
      description: '¿Está seguro de desactivar este requisito? Podrá reactivarlo más adelante.',
    });
    setConfirmDialogOpen(true);
  };

  const handleReactivar = (cdRequisito: number) => {
    setConfirmAction({
      type: 'reactivate',
      cdRequisito,
      title: 'Reactivar Requisito',
      description: '¿Está seguro de reactivar este requisito?',
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    const { type, cdRequisito } = confirmAction;

    try {
      const url = type === 'delete'
        ? `/api/admin/requisitos/${cdRequisito}`
        : `/api/admin/requisitos/${cdRequisito}/reactivar`;
      const method = type === 'delete' ? 'DELETE' : 'POST';

      const response = await fetch(url, { method });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: type === 'delete' ? 'Requisito desactivado' : 'Requisito reactivado',
          variant: 'success',
        });
        loadRequisitos();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleRequisito = (cdRequisito: number) => {
    setExpandedRequisito(expandedRequisito === cdRequisito ? null : cdRequisito);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando requisitos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {requisitos.length} requisito{requisitos.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Requisito
        </Button>
      </div>

      {/* Lista de Requisitos con Accordion */}
      {requisitos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay requisitos definidos. Click en "Nuevo Requisito" para agregar uno.
        </div>
      ) : (
        <div className="space-y-2">
          {requisitos.map((requisito) => (
            <div key={requisito.cdRequisito} className="border rounded-lg overflow-hidden">
              {/* Requisito Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => handleToggleRequisito(requisito.cdRequisito)}
                  className="flex items-center gap-2 flex-1 text-left hover:text-blue-600"
                >
                  {expandedRequisito === requisito.cdRequisito ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {requisito.cdCodigoRequisito} - {requisito.dsRequisito}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          requisito.cdEstado === 1
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {requisito.dsEstado}
                      </span>
                    </div>
                    {requisito.dsDescripcion && (
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {requisito.dsDescripcion}
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(requisito)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {requisito.cdEstado === 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(requisito.cdRequisito)}
                      title="Desactivar requisito"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReactivar(requisito.cdRequisito)}
                      title="Reactivar requisito"
                    >
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Formularios del Requisito */}
              {expandedRequisito === requisito.cdRequisito && (
                <div className="p-4 bg-white border-t">
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Formularios Asociados
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Los formularios son los documentos que se generarán para este requisito
                    </p>
                  </div>
                  <RequisitoFormularios
                    cdNorma={cdNorma}
                    cdRequisito={requisito.cdRequisito}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog CRUD */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRequisito ? 'Editar Requisito' : 'Nuevo Requisito'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del requisito de la norma
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cdCodigoRequisito">Código</Label>
              <Input
                id="cdCodigoRequisito"
                value={formData.cdCodigoRequisito}
                onChange={(e) =>
                  setFormData({ ...formData, cdCodigoRequisito: e.target.value })
                }
                placeholder="Ej: 4.1"
              />
            </div>

            <div>
              <Label htmlFor="dsRequisito">Nombre *</Label>
              <Input
                id="dsRequisito"
                value={formData.dsRequisito}
                onChange={(e) =>
                  setFormData({ ...formData, dsRequisito: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="dsDescripcion">Descripción</Label>
              <Textarea
                id="dsDescripcion"
                value={formData.dsDescripcion}
                onChange={(e) =>
                  setFormData({ ...formData, dsDescripcion: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="nuOrden">Orden</Label>
              <Input
                id="nuOrden"
                type="number"
                value={formData.nuOrden}
                onChange={(e) =>
                  setFormData({ ...formData, nuOrden: e.target.value })
                }
                placeholder="Número de orden"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingRequisito ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación */}
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
