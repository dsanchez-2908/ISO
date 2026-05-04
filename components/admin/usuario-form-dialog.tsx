'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: any;
  cdEmpresaConsultora: number;
  clientes: Array<{ cdCliente: number; dsRazonSocial: string }>;
  roles: Array<{ cdRol: number; dsRol: string }>;
  onSuccess: () => void;
}

export function UsuarioFormDialog({
  open,
  onOpenChange,
  usuario,
  cdEmpresaConsultora,
  clientes,
  roles,
  onSuccess,
}: UsuarioFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    dsUsuario: '',
    dsNombreCompleto: '',
    dsMail: '',
    dsClave: '',
    cdTipoUsuario: '2', // Por defecto: Interno
    cdCliente: '',
    snClaveTemporal: true,
  });

  const [rolesSeleccionados, setRolesSeleccionados] = useState<number[]>([]);

  useEffect(() => {
    if (usuario && open) {
      setFormData({
        dsUsuario: usuario.dsUsuario || '',
        dsNombreCompleto: usuario.dsNombreCompleto || '',
        dsMail: usuario.dsMail || '',
        dsClave: '',
        cdTipoUsuario: usuario.cdTipoUsuario?.toString() || '2',
        cdCliente: usuario.cdCliente?.toString() || '',
        snClaveTemporal: false,
      });
      // Cargar roles del usuario
      loadRolesUsuario(usuario.cdUsuario);
    } else {
      setFormData({
        dsUsuario: '',
        dsNombreCompleto: '',
        dsMail: '',
        dsClave: '',
        cdTipoUsuario: '2',
        cdCliente: '',
        snClaveTemporal: true,
      });
      setRolesSeleccionados([]);
    }
    setError('');
    setSuccess(false);
  }, [usuario, open]);

  const loadRolesUsuario = async (cdUsuario: number) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${cdUsuario}`);
      const data = await response.json();
      if (data.success && data.data.roles) {
        setRolesSeleccionados(data.data.roles.map((r: any) => r.cdRol));
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const toggleRol = (cdRol: number) => {
    setRolesSeleccionados(prev =>
      prev.includes(cdRol)
        ? prev.filter(r => r !== cdRol)
        : [...prev, cdRol]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = usuario
        ? `/api/admin/usuarios/${usuario.cdUsuario}`
        : '/api/admin/usuarios';
      const method = usuario ? 'PUT' : 'POST';

      const payload: any = {
        dsNombreCompleto: formData.dsNombreCompleto,
        dsMail: formData.dsMail,
        cdTipoUsuario: parseInt(formData.cdTipoUsuario),
        cdCliente: formData.cdCliente ? parseInt(formData.cdCliente) : null,
        roles: rolesSeleccionados,
      };

      if (!usuario) {
        // Solo en creación
        payload.cdEmpresaConsultora = cdEmpresaConsultora;
        payload.dsUsuario = formData.dsUsuario;
        payload.dsClave = formData.dsClave;
        payload.snClaveTemporal = formData.snClaveTemporal;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 1500);
      } else {
        setError(data.error || 'Error al guardar usuario');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const esUsuarioExterno = formData.cdTipoUsuario === '3';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            Complete la información del usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span>{usuario ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente'}</span>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Información Básica</h3>

            <div className="grid grid-cols-2 gap-4">
              {!usuario && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="dsUsuario">
                    Usuario <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dsUsuario"
                    value={formData.dsUsuario}
                    onChange={(e) => setFormData(prev => ({ ...prev, dsUsuario: e.target.value }))}
                    required
                    placeholder="usuario.sistema"
                    autoComplete="off"
                  />
                </div>
              )}

              <div className="col-span-2 space-y-2">
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

              <div className="col-span-2 space-y-2">
                <Label htmlFor="dsMail">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dsMail"
                  type="email"
                  value={formData.dsMail}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsMail: e.target.value }))}
                  required
                  placeholder="usuario@empresa.com"
                />
              </div>

              {!usuario && (
                <>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="dsClave">
                      Contraseña {!usuario && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="dsClave"
                      type="password"
                      value={formData.dsClave}
                      onChange={(e) => setFormData(prev => ({ ...prev, dsClave: e.target.value }))}
                      required={!usuario}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="snClaveTemporal"
                        checked={formData.snClaveTemporal}
                        onChange={(e) => setFormData(prev => ({ ...prev, snClaveTemporal: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="snClaveTemporal" className="cursor-pointer">
                        Contraseña temporal (debe cambiarla en el primer ingreso)
                      </Label>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="cdTipoUsuario">
                  Tipo de Usuario <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.cdTipoUsuario}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cdTipoUsuario: value, cdCliente: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Interno (Consultor)</SelectItem>
                    <SelectItem value="3">Externo (Cliente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {esUsuarioExterno && (
                <div className="space-y-2">
                  <Label htmlFor="cdCliente">
                    Cliente <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.cdCliente}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cdCliente: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.cdCliente} value={cliente.cdCliente.toString()}>
                          {cliente.dsRazonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Roles y Permisos</h3>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((rol) => (
                <div key={rol.cdRol} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`rol-${rol.cdRol}`}
                    checked={rolesSeleccionados.includes(rol.cdRol)}
                    onChange={() => toggleRol(rol.cdRol)}
                    className="rounded"
                  />
                  <Label htmlFor={`rol-${rol.cdRol}`} className="cursor-pointer font-normal">
                    {rol.dsRol}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                usuario ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
