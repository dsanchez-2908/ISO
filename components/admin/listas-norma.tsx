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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, List as ListIcon, Eye, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ListaItemsModal } from '@/components/admin/lista-items-modal';

interface Lista {
  cdLista: number;
  cdEmpresaConsultora: number;
  cdNorma: number;
  dsNombreLista: string;
  dsDescripcion: string | null;
  dsTipo: string;
  cdEstado: number;
  dsEstado: string;
  nuItems: number;
}

interface ListaItem {
  cdListaItem: number;
  cdLista: number;
  dsValor: string;
  dsDescripcion: string | null;
  nuOrden: number;
  snActivo: boolean;
}

interface ListasNormaProps {
  cdNorma: number;
  cdEmpresaConsultora: number;
}

export function ListasNorma({ cdNorma, cdEmpresaConsultora }: ListasNormaProps) {
  const { toast } = useToast();
  const [listas, setListas] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    description: string;
  } | null>(null);
  
  // Dialogs para Lista
  const [listaDialogOpen, setListaDialogOpen] = useState(false);
  const [editingLista, setEditingLista] = useState<Lista | null>(null);
  const [listaFormData, setListaFormData] = useState({
    dsNombreLista: '',
    dsDescripcion: '',
  });

  // Modal para gestionar items
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedListaForItems, setSelectedListaForItems] = useState<Lista | null>(null);

  useEffect(() => {
    loadListas();
  }, [cdNorma]);

  const loadListas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/listas?cdNorma=${cdNorma}`);
      const data = await response.json();
      if (data.success) {
        setListas(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar listas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItemsModal = (lista: Lista) => {
    setSelectedListaForItems(lista);
    setItemsModalOpen(true);
  };

  const handleToggleEstadoLista = async (lista: Lista) => {
    const nuevoEstado = lista.cdEstado === 1 ? 2 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';

    setConfirmAction({
      action: async () => {
        try {
          const response = await fetch(`/api/admin/listas/${lista.cdLista}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dsNombreLista: lista.dsNombreLista,
              dsDescripcion: lista.dsDescripcion,
              cdEstado: nuevoEstado,
            }),
          });

          const data = await response.json();

          if (data.success) {
            toast({
              title: 'Éxito',
              description: `Lista ${accion === 'activar' ? 'activada' : 'desactivada'} correctamente`,
            });
            loadListas();
          } else {
            throw new Error(data.error);
          }
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || `Error al ${accion} lista`,
            variant: 'destructive',
          });
        }
      },
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} lista`,
      description: `¿Está seguro que desea ${accion} la lista "${lista.dsNombreLista}"?`,
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (confirmAction) {
      await confirmAction.action();
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  // === CRUD de Listas ===
  const handleOpenListaDialog = (lista?: Lista) => {
    if (lista) {
      setEditingLista(lista);
      setListaFormData({
        dsNombreLista: lista.dsNombreLista,
        dsDescripcion: lista.dsDescripcion || '',
      });
    } else {
      setEditingLista(null);
      setListaFormData({
        dsNombreLista: '',
        dsDescripcion: '',
      });
    }
    setListaDialogOpen(true);
  };

  const handleSubmitLista = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingLista
        ? `/api/admin/listas/${editingLista.cdLista}`
        : '/api/admin/listas';

      const method = editingLista ? 'PUT' : 'POST';

      const payload = {
        ...listaFormData,
        cdNorma,
        cdEmpresaConsultora,
        cdEstado: editingLista?.cdEstado || 1,
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
          description: `Lista ${editingLista ? 'actualizada' : 'creada'} correctamente`,
          variant: 'success',
        });
        setListaDialogOpen(false);
        loadListas();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar lista',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar lista',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando listas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-gray-100">Listas de la Norma</h3>
        <Button onClick={() => handleOpenListaDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Lista
        </Button>
      </div>

      {listas.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ListIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p>No hay listas definidas para esta norma</p>
          <p className="text-sm mt-2">Las listas permiten definir valores fijos para campos de tipo Lista</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listas.map((lista) => (
            <div key={lista.cdLista} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium dark:text-gray-200">{lista.dsNombreLista}</p>
                      {lista.cdEstado === 1 ? (
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    {lista.dsDescripcion && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lista.dsDescripcion}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {lista.nuItems} {lista.nuItems === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenItemsModal(lista)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Items
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleEstadoLista(lista)}
                    title={lista.cdEstado === 1 ? 'Desactivar' : 'Activar'}
                  >
                    {lista.cdEstado === 1 ? (
                      <X className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenListaDialog(lista)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar Lista */}
      <Dialog open={listaDialogOpen} onOpenChange={setListaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLista ? 'Editar Lista' : 'Nueva Lista'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos de la lista de valores fijos
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLista} className="space-y-4">
            <div>
              <Label htmlFor="dsNombreLista">
                Nombre de la Lista <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dsNombreLista"
                value={listaFormData.dsNombreLista}
                onChange={(e) =>
                  setListaFormData({ ...listaFormData, dsNombreLista: e.target.value })
                }
                required
                placeholder="Ej: Tipo de Documento"
              />
            </div>

            <div>
              <Label htmlFor="dsDescripcion">Descripción</Label>
              <Textarea
                id="dsDescripcion"
                value={listaFormData.dsDescripcion}
                onChange={(e) =>
                  setListaFormData({ ...listaFormData, dsDescripcion: e.target.value })
                }
                rows={3}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setListaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingLista ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar Lista */}
      <Dialog open={listaDialogOpen} onOpenChange={setListaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLista ? 'Editar Lista' : 'Nueva Lista'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos de la lista de valores fijos de la norma
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLista} className="space-y-4">
            <div>
              <Label htmlFor="dsNombreLista">
                Nombre de la Lista <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dsNombreLista"
                value={listaFormData.dsNombreLista}
                onChange={(e) =>
                  setListaFormData({ ...listaFormData, dsNombreLista: e.target.value })
                }
                required
                placeholder="Ej: Tipo de Documento"
              />
            </div>

            <div>
              <Label htmlFor="dsDescripcion">Descripción</Label>
              <Textarea
                id="dsDescripcion"
                value={listaFormData.dsDescripcion}
                onChange={(e) =>
                  setListaFormData({ ...listaFormData, dsDescripcion: e.target.value })
                }
                rows={3}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setListaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingLista ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para gestionar items */}
      <ListaItemsModal
        open={itemsModalOpen}
        onOpenChange={setItemsModalOpen}
        lista={selectedListaForItems}
        onUpdate={loadListas}
      />

      {/* Dialog de confirmación */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={executeConfirmAction}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        variant="destructive"
      />
    </div>
  );
}
