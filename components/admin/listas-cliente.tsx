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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lista {
  cdLista: number;
  cdEmpresaConsultora: number;
  cdCliente: number;
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

interface ListasClienteProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function ListasCliente({ cdCliente, cdEmpresaConsultora }: ListasClienteProps) {
  const { toast } = useToast();
  const [listas, setListas] = useState<Lista[]>([]);
  const [items, setItems] = useState<{ [key: number]: ListaItem[] }>({});
  const [expandedListas, setExpandedListas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Dialogs para Lista
  const [listaDialogOpen, setListaDialogOpen] = useState(false);
  const [editingLista, setEditingLista] = useState<Lista | null>(null);
  const [listaFormData, setListaFormData] = useState({
    dsNombreLista: '',
    dsDescripcion: '',
  });

  // Dialogs para Items
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListaItem | null>(null);
  const [selectedListaForItem, setSelectedListaForItem] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    dsValor: '',
    dsDescripcion: '',
    nuOrden: '',
  });

  // Confirm Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});

  useEffect(() => {
    loadListas();
  }, [cdCliente]);

  const loadListas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/listas?cdCliente=${cdCliente}`);
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

  const loadItems = async (cdLista: number) => {
    try {
      const response = await fetch(`/api/admin/listas-items?cdLista=${cdLista}`);
      const data = await response.json();
      if (data.success) {
        setItems((prev) => ({ ...prev, [cdLista]: data.data }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar items',
        variant: 'destructive',
      });
    }
  };

  const toggleLista = (cdLista: number) => {
    const newExpanded = new Set(expandedListas);
    if (newExpanded.has(cdLista)) {
      newExpanded.delete(cdLista);
    } else {
      newExpanded.add(cdLista);
      if (!items[cdLista]) {
        loadItems(cdLista);
      }
    }
    setExpandedListas(newExpanded);
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
        cdCliente,
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

  const handleDeleteLista = async (cdLista: number) => {
    setConfirmMessage('¿Está seguro de eliminar esta lista?');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/admin/listas/${cdLista}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'Éxito',
            description: 'Lista eliminada correctamente',
            variant: 'success',
          });
          loadListas();
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Error al eliminar lista',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al eliminar lista',
          variant: 'destructive',
        });
      }
    });
    setConfirmDialogOpen(true);
  };

  // === CRUD de Items ===
  const handleOpenItemDialog = (cdLista: number, item?: ListaItem) => {
    setSelectedListaForItem(cdLista);
    if (item) {
      setEditingItem(item);
      setItemFormData({
        dsValor: item.dsValor,
        dsDescripcion: item.dsDescripcion || '',
        nuOrden: item.nuOrden.toString(),
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        dsValor: '',
        dsDescripcion: '',
        nuOrden: '',
      });
    }
    setItemDialogOpen(true);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedListaForItem) return;

    try {
      const url = editingItem
        ? `/api/admin/listas-items/${editingItem.cdListaItem}`
        : '/api/admin/listas-items';

      const method = editingItem ? 'PUT' : 'POST';

      const payload = {
        ...itemFormData,
        cdLista: selectedListaForItem,
        snActivo: editingItem?.snActivo !== undefined ? editingItem.snActivo : true,
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
          description: `Item ${editingItem ? 'actualizado' : 'creado'} correctamente`,
          variant: 'success',
        });
        setItemDialogOpen(false);
        loadItems(selectedListaForItem);
        loadListas(); // Para actualizar el contador de items
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar item',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (cdListaItem: number, cdLista: number) => {
    setConfirmMessage('¿Está seguro de eliminar este item?');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/admin/listas-items/${cdListaItem}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'Éxito',
            description: 'Item eliminado correctamente',
            variant: 'success',
          });
          loadItems(cdLista);
          loadListas(); // Para actualizar el contador
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Error al eliminar item',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al eliminar item',
          variant: 'destructive',
        });
      }
    });
    setConfirmDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando listas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Listas del Cliente</h3>
          <p className="text-sm text-gray-500 mt-1">
            Defina listas con valores fijos que podrán ser heredadas en los campos de tipo Lista de los templates
          </p>
        </div>
        <Button onClick={() => handleOpenListaDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Lista
        </Button>
      </div>

      {listas.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
          <List className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No hay listas definidas para este cliente</p>
          <p className="text-sm mt-2">
            Las listas permiten definir valores fijos que pueden ser heredados en las normas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {listas.map((lista) => {
            const isExpanded = expandedListas.has(lista.cdLista);
            const listaItems = items[lista.cdLista] || [];

            return (
              <div key={lista.cdLista} className="border rounded-lg overflow-hidden">
                {/* Header de la Lista */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleLista(lista.cdLista)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <p className="font-medium">{lista.dsNombreLista}</p>
                      {lista.dsDescripcion && (
                        <p className="text-sm text-gray-500">{lista.dsDescripcion}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {lista.nuItems} {lista.nuItems === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItemDialog(lista.cdLista);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Item
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenListaDialog(lista);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLista(lista.cdLista);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Contenido expandible - Items */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    {listaItems.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p>No hay items en esta lista</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Valor</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Orden</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listaItems.map((item) => (
                            <TableRow key={item.cdListaItem}>
                              <TableCell className="font-medium">{item.dsValor}</TableCell>
                              <TableCell>{item.dsDescripcion || '-'}</TableCell>
                              <TableCell>{item.nuOrden}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    item.snActivo
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {item.snActivo ? 'Activo' : 'Inactivo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenItemDialog(lista.cdLista, item)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.cdListaItem, lista.cdLista)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
              Complete los datos de la lista de valores fijos del cliente
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
                placeholder="Ej: Tipos de Documento"
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

      {/* Dialog para crear/editar Item */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Nuevo Item'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del item de la lista
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitItem} className="space-y-4">
            <div>
              <Label htmlFor="dsValor">
                Valor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dsValor"
                value={itemFormData.dsValor}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, dsValor: e.target.value })
                }
                required
                placeholder="Ej: DNI"
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
                rows={2}
                placeholder="Descripción opcional"
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
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirmar acción"
        description={confirmMessage}
        onConfirm={() => {
          confirmAction();
          setConfirmDialogOpen(false);
        }}
      />
    </div>
  );
}
