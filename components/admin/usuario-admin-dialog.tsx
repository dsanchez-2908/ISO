'use client';

import { useState, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

interface UsuarioAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cdEmpresaConsultora: number;
  dsNombreEmpresa: string;
  onSuccess: () => void;
}

export function UsuarioAdminDialog({ 
  open, 
  onOpenChange, 
  cdEmpresaConsultora,
  dsNombreEmpresa,
  onSuccess 
}: UsuarioAdminDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    dsUsuario: '',
    dsNombreCompleto: '',
    dsMail: '',
    dsClaveTemporal: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}/usuario-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          // Reset form
          setFormData({
            dsUsuario: '',
            dsNombreCompleto: '',
            dsMail: '',
            dsClaveTemporal: '',
          });
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.error || 'Error al crear el usuario');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Usuario Administrador</DialogTitle>
          <DialogDescription>
            Crear usuario administrador para <strong>{dsNombreEmpresa}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>Usuario creado exitosamente</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dsUsuario">
              Usuario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dsUsuario"
              value={formData.dsUsuario}
              onChange={(e) => setFormData(prev => ({ ...prev, dsUsuario: e.target.value }))}
              required
              placeholder="admin_empresa"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dsNombreCompleto">
              Nombre Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dsNombreCompleto"
              value={formData.dsNombreCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, dsNombreCompleto: e.target.value }))}
              required
              placeholder="Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dsMail">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dsMail"
              type="email"
              value={formData.dsMail}
              onChange={(e) => setFormData(prev => ({ ...prev, dsMail: e.target.value }))}
              required
              placeholder="admin@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dsClaveTemporal">
              Contraseña Temporal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dsClaveTemporal"
              type="password"
              value={formData.dsClaveTemporal}
              onChange={(e) => setFormData(prev => ({ ...prev, dsClaveTemporal: e.target.value }))}
              required
              placeholder="Contraseña temporal"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              El usuario deberá cambiar esta contraseña en su primer ingreso
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
