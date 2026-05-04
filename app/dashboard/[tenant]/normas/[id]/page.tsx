'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ClipboardList, Building2, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequisitosTemplates } from '@/components/admin/requisitos-templates';
import { ListasNorma } from '@/components/admin/listas-norma';

interface Norma {
  cdNorma: number;
  cdEmpresaConsultora: number;
  cdCodigoNorma: string;
  dsNombre: string;
  dsDescripcion: string;
  snAcreditacion: boolean;
  snCertificacion: boolean;
  dsOrganismoCertificador: string;
  dsObservaciones: string;
  cdEstado: number;
  dsEstado: string;
}

export default function NormaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cdNorma = params.id as string;
  const tenant = params.tenant as string;

  const [norma, setNorma] = useState<Norma | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNorma();
  }, [cdNorma]);

  const loadNorma = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/normas/${cdNorma}`);
      const data = await response.json();
      
      if (data.success) {
        setNorma(data.data);
      }
    } catch (error) {
      console.error('Error al cargar norma:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!norma) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Norma no encontrada</p>
          <Button onClick={() => router.push(`/dashboard/${tenant}/normas`)} className="mt-4">
            Volver a Normas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/${tenant}/normas`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Normas
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{norma.dsNombre}</h1>
            <p className="text-gray-500 mt-1">
              Código: {norma.cdCodigoNorma} • Estado: {norma.dsEstado}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/${tenant}/normas?edit=${cdNorma}`)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Editar Norma
            </Button>
          </div>
        </div>
      </div>

      {/* Info Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {norma.snCertificacion && (
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-1">
                  Certificación
                </span>
              )}
              {norma.snAcreditacion && (
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Acreditación
                </span>
              )}
              {!norma.snCertificacion && !norma.snAcreditacion && (
                <span className="text-sm text-gray-500">No especificado</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Organismo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{norma.dsOrganismoCertificador || 'No especificado'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-2">{norma.dsDescripcion || 'Sin descripción'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`inline-block px-2 py-1 rounded text-xs ${
                norma.cdEstado === 1
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {norma.dsEstado}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Requisitos y Listas */}
      <Tabs defaultValue="requisitos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="requisitos">
            <ClipboardList className="h-4 w-4 mr-2" />
            Requisitos y Templates
          </TabsTrigger>
          <TabsTrigger value="listas">
            <List className="h-4 w-4 mr-2" />
            Listas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requisitos">
          <Card>
            <CardHeader>
              <CardTitle>Requisitos de la Norma</CardTitle>
              <CardDescription>
                Gestione los requisitos y sus templates asociados. Cada requisito puede tener uno o más templates de documentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequisitosTemplates cdNorma={parseInt(cdNorma)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listas">
          <Card>
            <CardHeader>
              <CardTitle>Listas de Valores Fijos</CardTitle>
              <CardDescription>
                Defina listas con valores fijos que podrán ser utilizadas en los campos de tipo Lista de los templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListasNorma 
                cdNorma={parseInt(cdNorma)} 
                cdEmpresaConsultora={norma?.cdEmpresaConsultora || 0}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
