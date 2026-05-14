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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface RequisitosListProps {
  cdNorma: number;
}

export function RequisitosList({ cdNorma }: RequisitosListProps) {
  const { toast } = useToast();
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState<Requisito | null>(null);
  const [formData, setFormData] = useState({
    cdCodigoRequisito: '',
    dsRequisito: '',
    dsDescripcion: '',
    nuOrden: '',
  });

  // Confirm Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});

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

      const method = editingRequisito ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        cdNorma,
        cdEstado: editingRequisito?.cdEstado || 1,
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
          description: `Requisito ${editingRequisito ? 'actualizado' : 'creado'} correctamente`,
          variant: 'success',
        });
        setDialogOpen(false);
        loadRequisitos();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar requisito',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar requisito',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (cdRequisito: number) => {
    setConfirmMessage('¿Está seguro de eliminar este requisito?');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/admin/requisitos/${cdRequisito}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'Éxito',
            description: 'Requisito eliminado correctamente',
            variant: 'success',
          });
          loadRequisitos();
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Error al eliminar requisito',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al eliminar requisito',
          variant: 'destructive',
        });
      }
    });
    setConfirmDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando requisitos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Requisitos de la Norma</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Requisito
        </Button>
      </div>

      {requisitos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay requisitos cargados
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Requisito</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisitos.map((requisito) => (
              <TableRow key={requisito.cdRequisito}>
                <TableCell className="font-medium">
                  {requisito.cdCodigoRequisito || '-'}
                </TableCell>
                <TableCell>{requisito.dsRequisito}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {requisito.dsDescripcion || '-'}
                </TableCell>
                <TableCell>{requisito.nuOrden || '-'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      requisito.cdEstado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {requisito.dsEstado}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRequisito ? 'Editar Requisito' : 'Nuevo Requisito'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del requisito
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cdCodigoRequisito">Código Requisito</Label>
                <Input
                  id="cdCodigoRequisito"
                  value={formData.cdCodigoRequisito}
                  onChange={(e) =>
                    setFormData({ ...formData, cdCodigoRequisito: e.target.value })
                  }
                  placeholder="Ej: REQ-001"
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
            </div>

            <div>
              <Label htmlFor="dsRequisito">
                Requisito <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dsRequisito"
                value={formData.dsRequisito}
                onChange={(e) =>
                  setFormData({ ...formData, dsRequisito: e.target.value })
                }
                required
                placeholder="Nombre del requisito"
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
                rows={4}
                placeholder="Descripción detallada del requisito"
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
