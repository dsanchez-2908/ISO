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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PuestosListProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function PuestosList({ cdCliente, cdEmpresaConsultora }: PuestosListProps) {
  const { toast } = useToast();
  const [puestos, setPuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPuesto, setEditingPuesto] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dsPuesto: '',
    dsDescripcion: '',
  });

  useEffect(() => {
    loadPuestos();
  }, [cdCliente]);

  const loadPuestos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/puestos?cdCliente=${cdCliente}`);
      const data = await response.json();
      
      if (data.success) {
        setPuestos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar puestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (puesto?: any) => {
    if (puesto) {
      setEditingPuesto(puesto);
      setFormData({
        dsPuesto: puesto.dsPuesto,
        dsDescripcion: puesto.dsDescripcion || '',
      });
    } else {
      setEditingPuesto(null);
      setFormData({
        dsPuesto: '',
        dsDescripcion: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingPuesto
        ? `/api/admin/puestos/${editingPuesto.cdPuesto}`
        : '/api/admin/puestos';
      const method = editingPuesto ? 'PUT' : 'POST';

      const dataToSend = editingPuesto
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
        loadPuestos();
        toast({
          title: editingPuesto ? "Puesto actualizado" : "Puesto creado",
          description: editingPuesto ? "El puesto se actualizó correctamente" : "El puesto se creó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al guardar puesto',
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

  const handleDelete = async (cdPuesto: number) => {
    if (!confirm('¿Está seguro de eliminar este puesto?')) return;

    try {
      const response = await fetch(`/api/admin/puestos/${cdPuesto}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadPuestos();
        toast({
          title: "Puesto eliminado",
          description: "El puesto se eliminó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al eliminar puesto',
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
          {puestos.length} puesto(s) registrado(s)
        </p>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Puesto
        </Button>
      </div>

      {puestos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay puestos registrados. Haz clic en &quot;Nuevo Puesto&quot; para agregar uno.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Puesto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {puestos.map((puesto) => (
              <TableRow key={puesto.cdPuesto}>
                <TableCell className="font-medium">{puesto.dsPuesto}</TableCell>
                <TableCell>{puesto.dsDescripcion || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    puesto.cdEstado === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {puesto.dsEstado}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(puesto)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(puesto.cdPuesto)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPuesto ? 'Editar Puesto' : 'Nuevo Puesto'}
            </DialogTitle>
            <DialogDescription>
              {editingPuesto
                ? 'Modifica los datos del puesto'
                : 'Completa los datos del nuevo puesto'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dsPuesto">Nombre del Puesto *</Label>
                <Input
                  id="dsPuesto"
                  value={formData.dsPuesto}
                  onChange={(e) =>
                    setFormData({ ...formData, dsPuesto: e.target.value })
                  }
                  required
                  placeholder="Ej: Gerente, Operario, Supervisor"
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
                  placeholder="Descripción opcional del puesto"
                  rows={3}
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
                {editingPuesto ? 'Guardar Cambios' : 'Crear Puesto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
