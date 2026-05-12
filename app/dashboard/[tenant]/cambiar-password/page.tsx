'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Key, Loader2, CheckCircle2 } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';

export const dynamic = 'force-dynamic';

export default function CambiarPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = params.tenant as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    passwordActual: '',
    passwordNueva: '',
    passwordConfirmar: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success) {
        router.push(`/login/${tenant}`);
        return;
      }

      setUser(data.data.user);
    } catch (error) {
      router.push(`/login/${tenant}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validaciones
    if (!formData.passwordActual || !formData.passwordNueva || !formData.passwordConfirmar) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (formData.passwordNueva.length < 4) {
      setError('La contraseña nueva debe tener al menos 4 caracteres');
      return;
    }

    if (formData.passwordNueva !== formData.passwordConfirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (formData.passwordActual === formData.passwordNueva) {
      setError('La contraseña nueva debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/usuarios/${user.cdUsuario}/cambiar-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordActual: formData.passwordActual,
          nuevaClave: formData.passwordNueva,
          esClaveTemporal: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          passwordActual: '',
          passwordNueva: '',
          passwordConfirmar: '',
        });
      } else {
        setError(data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userName={user.dsNombreCompleto}
        empresaNombre={user.dsEmpresaNombre}
        tenant={tenant}
        logoBase64={user.dsLogoEmpresa}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Cambiar Contraseña' },
          ]}
        />

        <div className="mt-6 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Cambiar Contraseña</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Contraseña actualizada exitosamente</p>
                      <p className="text-sm mt-1">Su contraseña ha sido cambiada correctamente.</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/${tenant}`)}
                    className="w-full"
                  >
                    Volver al Inicio
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordActual">Contraseña Actual</Label>
                    <Input
                      id="passwordActual"
                      name="passwordActual"
                      type="password"
                      value={formData.passwordActual}
                      onChange={handleChange}
                      placeholder="Ingrese su contraseña actual"
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="passwordNueva">Nueva Contraseña</Label>
                      <Input
                        id="passwordNueva"
                        name="passwordNueva"
                        type="password"
                        value={formData.passwordNueva}
                        onChange={handleChange}
                        placeholder="Ingrese su nueva contraseña"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirmar">Confirmar Nueva Contraseña</Label>
                      <Input
                        id="passwordConfirmar"
                        name="passwordConfirmar"
                        type="password"
                        value={formData.passwordConfirmar}
                        onChange={handleChange}
                        placeholder="Confirme su nueva contraseña"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Requisitos de contraseña:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Mínimo 4 caracteres</li>
                      <li>Debe ser diferente a la contraseña actual</li>
                      <li>Recomendado: Combine letras, números y símbolos</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/${tenant}`)}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cambiando...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Cambiar Contraseña
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
