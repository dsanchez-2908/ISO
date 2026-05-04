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
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Norma {
  cdNorma: number;
  cdCodigo: string;
  dsNombre: string;
  dsVersion?: string;
  dsOrganismoEmisor?: string;
  snAsociada: number;
}

interface AsociarNormasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: number;
  clienteNombre: string;
  onSuccess: () => void;
}

export function AsociarNormasDialog({
  open,
  onOpenChange,
  clienteId,
  clienteNombre,
  onSuccess,
}: AsociarNormasDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [normas, setNormas] = useState<Norma[]>([]);
  const [selectedNormas, setSelectedNormas] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      loadNormas();
    }
  }, [open, clienteId]);

  const loadNormas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/clientes/${clienteId}/normas`);
      const data = await response.json();

      if (data.success) {
        setNormas(data.data);
        // Pre-seleccionar normas ya asociadas
        const asociadas = data.data
          .filter((n: Norma) => n.snAsociada === 1)
          .map((n: Norma) => n.cdNorma);
        setSelectedNormas(asociadas);
      }
    } catch (error) {
      console.error('Error al cargar normas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNorma = (cdNorma: number) => {
    setSelectedNormas((prev) =>
      prev.includes(cdNorma)
        ? prev.filter((id) => id !== cdNorma)
        : [...prev, cdNorma]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/clientes/${clienteId}/normas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normasIds: selectedNormas }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onOpenChange(false);
        toast({
          title: "Normas actualizadas",
          description: "Las asociaciones de normas se guardaron correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al asociar normas',
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
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Asociar Normas ISO</DialogTitle>
          <DialogDescription>
            Seleccione las normas que aplican para <strong>{clienteNombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : normas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                No hay normas disponibles. Cree normas primero en el módulo de Gestión de Normas.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
              {normas.map((norma) => (
                <div
                  key={norma.cdNorma}
                  onClick={() => toggleNorma(norma.cdNorma)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer
                    transition-all hover:border-blue-300
                    ${
                      selectedNormas.includes(norma.cdNorma)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${
                          selectedNormas.includes(norma.cdNorma)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }
                      `}
                    >
                      {selectedNormas.includes(norma.cdNorma) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">
                          {norma.cdCodigo}
                        </span>
                        {norma.dsVersion && (
                          <Badge variant="outline" className="text-xs">
                            {norma.dsVersion}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{norma.dsNombre}</div>
                      {norma.dsOrganismoEmisor && (
                        <div className="text-xs text-gray-500">
                          {norma.dsOrganismoEmisor}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>{selectedNormas.length}</strong> norma(s) seleccionada(s)
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Asociaciones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
