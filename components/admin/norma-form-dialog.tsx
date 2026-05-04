'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';

interface NormaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  norma: any | null;
  cdEmpresaConsultora: number;
  onSuccess: () => void;
}

export function NormaFormDialog({
  open,
  onOpenChange,
  norma,
  cdEmpresaConsultora,
  onSuccess,
}: NormaFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    cdCodigo: '',
    dsNombre: '',
    dsVersion: '',
    dsOrganismoEmisor: '',
    feVigenteDesde: '',
    dsDescripcion: '',
  });

  useEffect(() => {
    if (norma) {
      // Modo edición
      setFormData({
        cdCodigo: norma.cdCodigo || '',
        dsNombre: norma.dsNombre || '',
        dsVersion: norma.dsVersion || '',
        dsOrganismoEmisor: norma.dsOrganismoEmisor || '',
        feVigenteDesde: norma.feVigenteDesde ? norma.feVigenteDesde.split('T')[0] : '',
        dsDescripcion: norma.dsDescripcion || '',
      });
    } else {
      // Modo creación
      setFormData({
        cdCodigo: '',
        dsNombre: '',
        dsVersion: '',
        dsOrganismoEmisor: '',
        feVigenteDesde: '',
        dsDescripcion: '',
      });
    }
    setError('');
  }, [norma, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.cdCodigo || !formData.dsNombre) {
      setError('Código y nombre son campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const url = norma
        ? `/api/admin/normas/${norma.cdNorma}`
        : '/api/admin/normas';

      const method = norma ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cdEmpresaConsultora,
          ...formData,
          feVigenteDesde: formData.feVigenteDesde || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(data.error || 'Error al guardar norma');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{norma ? 'Editar Norma' : 'Nueva Norma'}</DialogTitle>
          <DialogDescription>
            {norma
              ? 'Modifique los datos de la norma'
              : 'Complete los datos para crear una nueva norma ISO'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="cdCodigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cdCodigo"
                name="cdCodigo"
                value={formData.cdCodigo}
                onChange={handleChange}
                placeholder="Ej: ISO9001"
                required
                disabled={loading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">Código único de la norma</p>
            </div>

            {/* Versión */}
            <div className="space-y-2">
              <Label htmlFor="dsVersion">Versión</Label>
              <Input
                id="dsVersion"
                name="dsVersion"
                value={formData.dsVersion}
                onChange={handleChange}
                placeholder="Ej: 2015"
                disabled={loading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">Año o versión de la norma</p>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="dsNombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dsNombre"
              name="dsNombre"
              value={formData.dsNombre}
              onChange={handleChange}
              placeholder="Ej: Sistema de Gestión de la Calidad"
              required
              disabled={loading}
              maxLength={250}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organismo Emisor */}
            <div className="space-y-2">
              <Label htmlFor="dsOrganismoEmisor">Organismo Emisor</Label>
              <Input
                id="dsOrganismoEmisor"
                name="dsOrganismoEmisor"
                value={formData.dsOrganismoEmisor}
                onChange={handleChange}
                placeholder="Ej: ISO, IRAM"
                disabled={loading}
                maxLength={250}
              />
            </div>

            {/* Vigente Desde */}
            <div className="space-y-2">
              <Label htmlFor="feVigenteDesde">Vigente Desde</Label>
              <Input
                id="feVigenteDesde"
                name="feVigenteDesde"
                type="date"
                value={formData.feVigenteDesde}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="dsDescripcion">Descripción</Label>
            <Textarea
              id="dsDescripcion"
              name="dsDescripcion"
              value={formData.dsDescripcion}
              onChange={handleChange}
              placeholder="Descripción detallada de la norma, sus objetivos y alcances..."
              disabled={loading}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : norma ? (
                'Actualizar'
              ) : (
                'Crear Norma'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
