import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <FileQuestion className="h-24 w-24 text-gray-400 mx-auto" />
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Página no encontrada</h2>
        <p className="text-gray-600 max-w-md">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/login/0">
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
