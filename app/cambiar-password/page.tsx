'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Key, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CambiarPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        router.push('/login/0');
        return;
      }

      setUser(data.data.user);
    } catch (error) {
      router.push('/login/0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.passwordNueva || !formData.passwordConfirmar) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (formData.passwordNueva.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (formData.passwordNueva !== formData.passwordConfirmar) {
      setError('Las contraseñas no coinciden');
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
          nuevaClave: formData.passwordNueva,
          esClaveTemporal: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirigir según el tipo de usuario
        const tenant = user.cdEmpresaConsultora || 0;
        if (user.cdTipoUsuario === 1) {
          router.push('/admin/0/empresas');
        } else if (user.cdTipoUsuario === 2) {
          router.push(`/dashboard/${tenant}`);
        } else {
          router.push(`/dashboard/${tenant}/clientes`);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Cambio de Contraseña Obligatorio</CardTitle>
          <CardDescription>
            {user.snClaveTemporal
              ? 'Su contraseña es temporal. Por seguridad, debe cambiarla antes de continuar.'
              : 'Es su primer ingreso. Por favor, establezca una nueva contraseña.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirmar">Confirmar Contraseña</Label>
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
                <li>Recomendado: Combine letras, números y símbolos</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando Contraseña...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
