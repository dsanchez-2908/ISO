'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PresupuestosListProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function PresupuestosList({ cdCliente, cdEmpresaConsultora }: PresupuestosListProps) {
  const { toast } = useToast();
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    description: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    fePresupuesto: '',
    dsDescripcion: '',
    dsPresupuesto: '',
  });

  useEffect(() => {
    loadPresupuestos();
  }, [cdCliente]);

  const loadPresupuestos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/presupuestos?cdCliente=${cdCliente}`);
      const data = await response.json();
      
      if (data.success) {
        setPresupuestos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (presupuesto?: any) => {
    if (presupuesto) {
      setEditingPresupuesto(presupuesto);
      setFormData({
        fePresupuesto: presupuesto.fePresupuesto ? presupuesto.fePresupuesto.split('T')[0] : '',
        dsDescripcion: presupuesto.dsDescripcion || '',
        dsPresupuesto: presupuesto.dsPresupuesto || '',
      });
    } else {
      setEditingPresupuesto(null);
      setFormData({
        fePresupuesto: new Date().toISOString().split('T')[0],
        dsDescripcion: '',
        dsPresupuesto: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingPresupuesto
        ? `/api/admin/presupuestos/${editingPresupuesto.cdPresupuesto}`
        : '/api/admin/presupuestos';
      const method = editingPresupuesto ? 'PUT' : 'POST';

      const dataToSend = editingPresupuesto
        ? formData
        : { ...formData, cdEmpresaConsultora, cdCliente };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        setDialogOpen(false);
        loadPresupuestos();
        toast({
          title: editingPresupuesto ? "Presupuesto actualizado" : "Presupuesto creado",
          description: editingPresupuesto ? "El presupuesto se actualizó correctamente" : "El presupuesto se creó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al guardar presupuesto',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cdPresupuesto: number) => {
    setConfirmAction({
      action: async () => {
        try {
          const response = await fetch(`/api/admin/presupuestos/${cdPresupuesto}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            loadPresupuestos();
            toast({
              title: "Presupuesto eliminado",
              description: "El presupuesto se eliminó correctamente",
              variant: "success",
            });
          } else {
            toast({
              title: "Error",
              description: data.error || 'Error al eliminar presupuesto',
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error:', error);
          toast({
            title: "Error de conexión",
            description: "No se pudo conectar con el servidor",
            variant: "destructive",
          });
        }
      },
      title: 'Eliminar Presupuesto',
      description: '¿Está seguro de eliminar este presupuesto?',
    });
    setConfirmDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {presupuestos.length} presupuesto(s) registrado(s)
        </p>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      {presupuestos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay presupuestos registrados. Haz clic en &quot;Nuevo Presupuesto&quot; para agregar uno.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {presupuestos.map((presupuesto) => (
              <TableRow key={presupuesto.cdPresupuesto}>
                <TableCell className="font-medium">
                  {formatDate(presupuesto.fePresupuesto)}
                </TableCell>
                <TableCell>{presupuesto.dsDescripcion || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    presupuesto.cdEstado === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {presupuesto.dsEstado}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(presupuesto)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(presupuesto.cdPresupuesto)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog para Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </DialogTitle>
            <DialogDescription>
              {editingPresupuesto
                ? 'Modifica los datos del presupuesto'
                : 'Completa los datos del nuevo presupuesto'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fePresupuesto">Fecha del Presupuesto *</Label>
                <Input
                  id="fePresupuesto"
                  type="date"
                  value={formData.fePresupuesto}
                  onChange={(e) =>
                    setFormData({ ...formData, fePresupuesto: e.target.value })
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
                  placeholder="Descripción del presupuesto"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="dsPresupuesto">Contenido del Presupuesto</Label>
                <Textarea
                  id="dsPresupuesto"
                  value={formData.dsPresupuesto}
                  onChange={(e) =>
                    setFormData({ ...formData, dsPresupuesto: e.target.value })
                  }
                  placeholder="Detalle de items, montos, etc."
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPresupuesto ? 'Guardar Cambios' : 'Crear Presupuesto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {confirmAction && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={confirmAction.action}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText="Eliminar"
          variant="destructive"
        />
      )}
    </div>
  );
}
