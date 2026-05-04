'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoginFormProps {
  tenant: number; // 0 para super admin, ID de empresa para consultora
  empresaInfo?: {
    dsNombreEmpresaConsultora: string;
    dsLogo?: string;
  };
}

export function LoginForm({ tenant, empresaInfo }: LoginFormProps) {
  const router = useRouter();
  const [dsUsuario, setDsUsuario] = useState('');
  const [dsClave, setDsClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = tenant === 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dsUsuario,
          dsClave,
          cdEmpresaConsultora: isSuperAdmin ? 0 : tenant,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Verificar si necesita cambiar contraseña
        const user = data.data.user;
        if (user.snClaveTemporal || user.snPrimerIngreso) {
          // Redirigir a cambio de contraseña obligatorio
          router.push('/cambiar-password');
          router.refresh();
          return;
        }

        // Redirigir según el tipo de usuario
        if (user.cdTipoUsuario === 1) {
          // Super Admin
          router.push('/admin/0/empresas');
        } else if (user.cdTipoUsuario === 2) {
          // Usuario interno (consultor)
          router.push(`/dashboard/${tenant}`);
        } else {
          // Usuario externo (cliente)
          router.push(`/dashboard/${tenant}/clientes`);
        }
        router.refresh();
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {/* Logo: Super Admin usa logo estático, empresas usan logo de BD */}
          {(isSuperAdmin || empresaInfo?.dsLogo) && (
            <div className="flex justify-center">
              <img
                src={isSuperAdmin ? '/logo.png' : `data:image/png;base64,${empresaInfo?.dsLogo}`}
                alt="Logo"
                className="h-20 object-contain"
              />
            </div>
          )}
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isSuperAdmin ? 'Super Administrador' : empresaInfo?.dsNombreEmpresaConsultora || 'Iniciar Sesión'}
            </CardTitle>
            <CardDescription>
              Sistema de Gestión de Calidad ISO
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                type="text"
                placeholder="Ingrese su usuario"
                value={dsUsuario}
                onChange={(e) => setDsUsuario(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={dsClave}
                onChange={(e) => setDsClave(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            {!isSuperAdmin && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>¿Olvidó su contraseña?</p>
                <Button variant="link" className="p-0 h-auto font-normal" type="button">
                  Recuperar contraseña
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
