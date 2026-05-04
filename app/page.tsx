import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir a login super admin por defecto
  redirect('/login/0');
}
