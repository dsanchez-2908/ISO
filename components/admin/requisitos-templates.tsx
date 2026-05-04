'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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
import { TemplatesList } from '@/components/admin/templates-list';

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

  const handleDelete = async (cdRequisito: number) => {
    if (!confirm('¿Está seguro de eliminar este requisito?')) return;

    try {
      const response = await fetch(`/api/admin/requisitos/${cdRequisito}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Requisito eliminado',
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
                    <div className="font-semibold">
                      {requisito.cdCodigoRequisito} - {requisito.dsRequisito}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(requisito.cdRequisito)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Templates del Requisito */}
              {expandedRequisito === requisito.cdRequisito && (
                <div className="p-4 bg-white border-t">
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Templates del Requisito
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Los templates son los documentos que se generarán para este requisito
                    </p>
                  </div>
                  <TemplatesList
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
    </div>
  );
}
