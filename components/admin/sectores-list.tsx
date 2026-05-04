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

interface SectoresListProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function SectoresList({ cdCliente, cdEmpresaConsultora }: SectoresListProps) {
  const { toast } = useToast();
  const [sectores, setSectores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dsSector: '',
    dsDescripcion: '',
  });

  useEffect(() => {
    loadSectores();
  }, [cdCliente]);

  const loadSectores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sectores?cdCliente=${cdCliente}`);
      const data = await response.json();
      
      if (data.success) {
        setSectores(data.data);
      }
    } catch (error) {
      console.error('Error al cargar sectores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sector?: any) => {
    if (sector) {
      setEditingSector(sector);
      setFormData({
        dsSector: sector.dsSector,
        dsDescripcion: sector.dsDescripcion || '',
      });
    } else {
      setEditingSector(null);
      setFormData({
        dsSector: '',
        dsDescripcion: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingSector
        ? `/api/admin/sectores/${editingSector.cdSector}`
        : '/api/admin/sectores';
      const method = editingSector ? 'PUT' : 'POST';

      const dataToSend = editingSector
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
        loadSectores();
        toast({
          title: editingSector ? "Sector actualizado" : "Sector creado",
          description: editingSector ? "El sector se actualizó correctamente" : "El sector se creó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al guardar sector',
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

  const handleDelete = async (cdSector: number) => {
    if (!confirm('¿Está seguro de eliminar este sector?')) return;

    try {
      const response = await fetch(`/api/admin/sectores/${cdSector}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadSectores();
        toast({
          title: "Sector eliminado",
          description: "El sector se eliminó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al eliminar sector',
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
          {sectores.length} sector(es) registrado(s)
        </p>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Sector
        </Button>
      </div>

      {sectores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay sectores registrados. Haz clic en &quot;Nuevo Sector&quot; para agregar uno.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sector</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectores.map((sector) => (
              <TableRow key={sector.cdSector}>
                <TableCell className="font-medium">{sector.dsSector}</TableCell>
                <TableCell>{sector.dsDescripcion || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sector.cdEstado === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sector.dsEstado}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(sector)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sector.cdSector)}
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
              {editingSector ? 'Editar Sector' : 'Nuevo Sector'}
            </DialogTitle>
            <DialogDescription>
              {editingSector
                ? 'Modifica los datos del sector'
                : 'Completa los datos del nuevo sector'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dsSector">Nombre del Sector *</Label>
                <Input
                  id="dsSector"
                  value={formData.dsSector}
                  onChange={(e) =>
                    setFormData({ ...formData, dsSector: e.target.value })
                  }
                  required
                  placeholder="Ej: Producción, Administración, Ventas"
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
                  placeholder="Descripción opcional del sector"
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
                {editingSector ? 'Guardar Cambios' : 'Crear Sector'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
