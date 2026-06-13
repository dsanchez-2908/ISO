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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Template {
  cdTemplateDocumento: number;
  dsNombre: string;
}

interface AgregarRegistroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cdCertificacion: number;
  cdRequisito: number;
  dsRequisito: string;
  onSuccess: () => void;
}

export function AgregarRegistroDialog({
  open,
  onOpenChange,
  cdCertificacion,
  cdRequisito,
  dsRequisito,
  onSuccess
}: AgregarRegistroDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateSeleccionado, setTemplateSeleccionado] = useState('');
  const [tituloRegistro, setTituloRegistro] = useState('');

  useEffect(() => {
    if (open) {
      loadTemplates();
      setTemplateSeleccionado('');
      setTituloRegistro('');
    }
  }, [open, cdRequisito]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/requisitos/${cdRequisito}/templates?cdCertificacion=${cdCertificacion}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error al cargar templates:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los formularios',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = async () => {
    if (!templateSeleccionado) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un formulario',
      });
      return;
    }

    if (!tituloRegistro.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El título del registro es requerido',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/registros-documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdCertificacion,
          cdTemplateDocumento: parseInt(templateSeleccionado),
          cdRequisito,
          dsCodigoDocumento: `REQ-${cdRequisito}-${Date.now()}`,
          dsNombreDocumento: tituloRegistro
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Registro creado correctamente',
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
        description: error.message || 'No se pudo crear el registro',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Registro</DialogTitle>
          <DialogDescription>
            Requisito: <strong>{dsRequisito}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Formulario *</Label>
            <Select value={templateSeleccionado} onValueChange={setTemplateSeleccionado}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Seleccione un formulario" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem 
                    key={template.cdTemplateDocumento} 
                    value={template.cdTemplateDocumento.toString()}
                  >
                    {template.dsNombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título del Registro *</Label>
            <Input
              id="titulo"
              value={tituloRegistro}
              onChange={(e) => setTituloRegistro(e.target.value)}
              placeholder="Ingrese el título del registro"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleAgregar} disabled={loading}>
            {loading ? 'Agregando...' : 'Agregar Registro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
