'use client';

import { useState, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface CambiarPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: any;
  onSuccess: () => void;
}

export function CambiarPasswordDialog({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: CambiarPasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [esClaveTemporal, setEsClaveTemporal] = useState(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (nuevaClave !== confirmarClave) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (nuevaClave.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.cdUsuario}/cambiar-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevaClave,
          esClaveTemporal,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setNuevaClave('');
          setConfirmarClave('');
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.error || 'Error al cambiar contraseña');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Cambiar contraseña para: <strong>{usuario?.dsNombreCompleto}</strong>
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
              <CheckCircle className="h-4 w-4" />
              <span>Contraseña actualizada exitosamente</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nuevaClave">
              Nueva Contraseña <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nuevaClave"
              type="password"
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarClave">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmarClave"
              type="password"
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="esClaveTemporal"
              checked={esClaveTemporal}
              onChange={(e) => setEsClaveTemporal(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="esClaveTemporal" className="cursor-pointer font-normal">
              Contraseña temporal (debe cambiarla en el primer ingreso)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
