'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Estado {
  cdEstado: number;
  dsEstado: string;
}

interface CambiarEstadoRegistroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cdRegistroDocumento: number;
  cdEstadoActual: number;
  dsNombreDocumento: string;
  onSuccess: () => void;
}

export function CambiarEstadoRegistroDialog({
  open,
  onOpenChange,
  cdRegistroDocumento,
  cdEstadoActual,
  dsNombreDocumento,
  onSuccess
}: CambiarEstadoRegistroDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');

  useEffect(() => {
    if (open) {
      loadEstados();
      setEstadoSeleccionado(cdEstadoActual.toString());
    }
  }, [open, cdEstadoActual]);

  const loadEstados = async () => {
    try {
      setLoading(true);
      // Obtener estados disponibles para documentos
      // Típicamente: 1=Borrador, 2=Activo, 3=Inactivo
      const res = await fetch('/api/catalogos/estados?tipo=DOCUMENTO');
      const data = await res.json();
      if (data.success) {
        setEstados(data.data);
      } else {
        // Fallback con estados predefinidos
        setEstados([
          { cdEstado: 1, dsEstado: 'Borrador' },
          { cdEstado: 2, dsEstado: 'Activo' },
          { cdEstado: 3, dsEstado: 'Inactivo' }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar estados:', error);
      // Fallback con estados predefinidos
      setEstados([
        { cdEstado: 1, dsEstado: 'Borrador' },
        { cdEstado: 2, dsEstado: 'Activo' },
        { cdEstado: 3, dsEstado: 'Inactivo' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!estadoSeleccionado) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un estado',
      });
      return;
    }

    if (parseInt(estadoSeleccionado) === cdEstadoActual) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un estado diferente al actual',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/registros-documentos/${cdRegistroDocumento}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdEstadoDocumento: parseInt(estadoSeleccionado)
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Estado actualizado correctamente',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cambiar el estado',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Estado del Registro</DialogTitle>
          <DialogDescription>
            Registro: <strong>{dsNombreDocumento}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <Select value={estadoSeleccionado} onValueChange={setEstadoSeleccionado}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Seleccione un estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((estado) => (
                  <SelectItem 
                    key={estado.cdEstado} 
                    value={estado.cdEstado.toString()}
                  >
                    {estado.dsEstado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCambiarEstado} disabled={loading}>
            {loading ? 'Cambiando...' : 'Cambiar Estado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
