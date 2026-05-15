'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ListaItem {
  cdListaItem: number;
  cdLista: number;
  dsValor: string;
  dsDescripcion: string | null;
  nuOrden: number;
  snActivo: boolean;
}

interface Lista {
  cdLista: number;
  dsNombreLista: string;
  dsDescripcion: string | null;
  nuItems: number;
}

interface ListaItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lista: Lista | null;
  onUpdate: () => void;
}

export function ListaItemsModal({ open, onOpenChange, lista, onUpdate }: ListaItemsModalProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ListaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ListaItem | null>(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    dsValor: '',
    dsDescripcion: '',
    nuOrden: '',
  });
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (open && lista) {
      loadItems();
    }
  }, [open, lista]);

  const loadItems = async () => {
    if (!lista) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/listas-items?cdLista=${lista.cdLista}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.data.sort((a: ListaItem, b: ListaItem) => a.nuOrden - b.nuOrden));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItemForm = (item?: ListaItem) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        dsValor: item.dsValor,
        dsDescripcion: item.dsDescripcion || '',
        nuOrden: item.nuOrden.toString(),
      });
    } else {
      setEditingItem(null);
      const maxOrden = items.length > 0 ? Math.max(...items.map(i => i.nuOrden)) : 0;
      setItemFormData({
        dsValor: '',
        dsDescripcion: '',
        nuOrden: (maxOrden + 1).toString(),
      });
    }
    setItemFormOpen(true);
  };

  const handleSaveItem = async () => {
    if (!lista) return;
    
    if (!itemFormData.dsValor.trim()) {
      toast({
        title: 'Error',
        description: 'El valor del item es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingItem
        ? `/api/admin/listas-items/${editingItem.cdListaItem}`
        : '/api/admin/listas-items';

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdLista: lista.cdLista,
          dsValor: itemFormData.dsValor,
          dsDescripcion: itemFormData.dsDescripcion || null,
          nuOrden: parseInt(itemFormData.nuOrden) || 1,
          snActivo: editingItem?.snActivo !== undefined ? editingItem.snActivo : true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: `Item ${editingItem ? 'actualizado' : 'creado'} correctamente`,
        });
        setItemFormOpen(false);
        await loadItems();
        onUpdate();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar item',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEstado = async (item: ListaItem) => {
    const nuevoEstado = !item.snActivo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    setConfirmAction({
      action: async () => {
        try {
          const response = await fetch(`/api/admin/listas-items/${item.cdListaItem}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cdLista: item.cdLista,
              dsValor: item.dsValor,
              dsDescripcion: item.dsDescripcion,
              nuOrden: item.nuOrden,
              snActivo: nuevoEstado,
            }),
          });

          const data = await response.json();
          if (data.success) {
            toast({
              title: 'Éxito',
              description: `Item ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`,
            });
            await loadItems();
            onUpdate();
          } else {
            throw new Error(data.error);
          }
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || `Error al ${accion} item`,
            variant: 'destructive',
          });
        }
      },
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} item`,
      description: `¿Está seguro que desea ${accion} el item "${item.dsValor}"?`,
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

  if (!lista) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestión de Items - {lista.dsNombreLista}</DialogTitle>
            <DialogDescription>
              <div className="space-y-1 mt-2">
                <p><strong>Descripción:</strong> {lista.dsDescripcion || 'Sin descripción'}</p>
                <p><strong>Cantidad de Items:</strong> {items.length}</p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Items de la lista</h3>
              <Button onClick={() => handleOpenItemForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Item
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando items...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay items. Haga clic en "Nuevo Item" para agregar uno.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Orden</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-[100px]">Estado</TableHead>
                      <TableHead className="w-[120px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.cdListaItem}>
                        <TableCell className="font-medium">{item.nuOrden}</TableCell>
                        <TableCell className="font-medium">{item.dsValor}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.dsDescripcion || '-'}
                        </TableCell>
                        <TableCell>
                          {item.snActivo ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <Check className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <X className="h-3 w-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenItemForm(item)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleEstado(item)}
                              title={item.snActivo ? 'Desactivar' : 'Activar'}
                            >
                              {item.snActivo ? (
                                <X className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar/editar item */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Nuevo'} Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dsValor">Valor *</Label>
              <Input
                id="dsValor"
                value={itemFormData.dsValor}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, dsValor: e.target.value })
                }
                placeholder="Ingrese el valor del item"
              />
            </div>
            <div>
              <Label htmlFor="dsDescripcion">Descripción</Label>
              <Textarea
                id="dsDescripcion"
                value={itemFormData.dsDescripcion}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, dsDescripcion: e.target.value })
                }
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="nuOrden">Orden</Label>
              <Input
                id="nuOrden"
                type="number"
                value={itemFormData.nuOrden}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, nuOrden: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={executeConfirmAction}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        variant="destructive"
      />
    </>
  );
}
