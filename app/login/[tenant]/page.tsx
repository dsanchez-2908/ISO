import { LoginForm } from '@/components/auth/login-form';
import { query } from '@/lib/db';
import { EmpresaConsultora } from '@/lib/types';
import { notFound } from 'next/navigation';

interface LoginPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { tenant } = await params;
  const tenantId = parseInt(tenant, 10);

  // Si es super admin (0), no necesitamos buscar empresa
  if (tenantId === 0) {
    return <LoginForm tenant={0} />;
  }

  // Si es una empresa consultora, buscar su información
  try {
    const empresas = await query<EmpresaConsultora>(
      `
      SELECT 
        cdEmpresaConsultora,
        dsNombreEmpresaConsultora,
        dsLogo
      FROM TD_EMPRESAS_CONSULTORAS
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora AND cdEstado = 1
      `,
      { cdEmpresaConsultora: tenantId }
    );

    if (empresas.length === 0) {
      notFound();
    }

    const empresa = empresas[0];

    return (
      <LoginForm
        tenant={tenantId}
        empresaInfo={{
          dsNombreEmpresaConsultora: empresa.dsNombreEmpresaConsultora,
          dsLogo: empresa.dsLogo || undefined,
        }}
      />
    );
  } catch (error) {
    console.error('Error al cargar empresa:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: LoginPageProps) {
  const { tenant } = await params;
  const tenantId = parseInt(tenant, 10);

  if (tenantId === 0) {
    return {
      title: 'Super Administrador - Login | Sistema ISO',
      description: 'Acceso al módulo de administración del sistema',
    };
  }

  try {
    const empresas = await query<EmpresaConsultora>(
      `SELECT dsNombreEmpresaConsultora FROM TD_EMPRESAS_CONSULTORAS WHERE cdEmpresaConsultora = @cdEmpresaConsultora AND cdEstado = 1`,
      { cdEmpresaConsultora: tenantId }
    );

    if (empresas.length > 0) {
      return {
        title: `${empresas[0].dsNombreEmpresaConsultora} - Login | Sistema ISO`,
        description: 'Acceso al sistema de gestión de calidad ISO',
      };
    }
  } catch (error) {
    console.error('Error al generar metadata:', error);
  }

  return {
    title: 'Login | Sistema ISO',
    description: 'Sistema de gestión de calidad ISO',
  };
}
