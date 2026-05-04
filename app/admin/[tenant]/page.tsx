import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AdminPage() {
  // Verificar autenticación
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    redirect('/login/0');
  }

  // Redirigir al módulo de empresas
  redirect('/admin/0/empresas');
}
