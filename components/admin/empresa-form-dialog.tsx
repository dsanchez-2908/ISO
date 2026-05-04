'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { fileToBase64 } from '@/lib/utils';

interface EmpresaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: any;
  onSuccess: () => void;
}

export function EmpresaFormDialog({ 
  open, 
  onOpenChange, 
  empresa, 
  onSuccess 
}: EmpresaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    dsNombreEmpresaConsultora: '',
    dsCUIT: '',
    dsDomicilio: '',
    dsCodigoPostal: '',
    dsLocalidad: '',
    dsProvincia: '',
    dsPais: '',
    dsTelefono: '',
    dsMail: '',
    dsLogo: '',
    dsContactoNombre: '',
    dsContactoTelefono: '',
    dsContactoEmail: '',
  });

  const [parametros, setParametros] = useState([
    { dsCodigoParametro: 'URL_AGREGAR_DOCUMENTO', dsValorParametro: '' },
    { dsCodigoParametro: 'URL_TOKEN', dsValorParametro: '' },
    { dsCodigoParametro: 'USUARIO_TOKEN', dsValorParametro: '' },
    { dsCodigoParametro: 'CLAVE_TOKEN', dsValorParametro: '' },
    { dsCodigoParametro: 'CODIGO_LIBRERIA', dsValorParametro: '' },
    { dsCodigoParametro: 'CODIGO_CLASE', dsValorParametro: '' },
    { dsCodigoParametro: 'URL_VISOR', dsValorParametro: '' },
    { dsCodigoParametro: 'CLIENT_ID', dsValorParametro: '' },
  ]);

  useEffect(() => {
    if (empresa) {
      setFormData({
        dsNombreEmpresaConsultora: empresa.dsNombreEmpresaConsultora || '',
        dsCUIT: empresa.dsCUIT || '',
        dsDomicilio: empresa.dsDomicilio || '',
        dsCodigoPostal: empresa.dsCodigoPostal || '',
        dsLocalidad: empresa.dsLocalidad || '',
        dsProvincia: empresa.dsProvincia || '',
        dsPais: empresa.dsPais || '',
        dsTelefono: empresa.dsTelefono || '',
        dsMail: empresa.dsMail || '',
        dsLogo: empresa.dsLogo || '',
        dsContactoNombre: empresa.dsContactoNombre || '',
        dsContactoTelefono: empresa.dsContactoTelefono || '',
        dsContactoEmail: empresa.dsContactoEmail || '',
      });

      if (empresa.dsLogo) {
        setLogoPreview(`data:image/png;base64,${empresa.dsLogo}`);
      }

      // Cargar parámetros existentes
      if (empresa.cdEmpresaConsultora) {
        loadParametros(empresa.cdEmpresaConsultora);
      }
    } else {
      // Reset form
      setFormData({
        dsNombreEmpresaConsultora: '',
        dsCUIT: '',
        dsDomicilio: '',
        dsCodigoPostal: '',
        dsLocalidad: '',
        dsProvincia: '',
        dsPais: '',
        dsTelefono: '',
        dsMail: '',
        dsLogo: '',
        dsContactoNombre: '',
        dsContactoTelefono: '',
        dsContactoEmail: '',
      });
      setLogoPreview(null);
      setParametros([
        { dsCodigoParametro: 'URL_AGREGAR_DOCUMENTO', dsValorParametro: '' },
        { dsCodigoParametro: 'URL_TOKEN', dsValorParametro: '' },
        { dsCodigoParametro: 'USUARIO_TOKEN', dsValorParametro: '' },
        { dsCodigoParametro: 'CLAVE_TOKEN', dsValorParametro: '' },
        { dsCodigoParametro: 'CODIGO_LIBRERIA', dsValorParametro: '' },
        { dsCodigoParametro: 'CODIGO_CLASE', dsValorParametro: '' },
        { dsCodigoParametro: 'URL_VISOR', dsValorParametro: '' },
        { dsCodigoParametro: 'CLIENT_ID', dsValorParametro: '' },
      ]);
    }
  }, [empresa, open]);

  const loadParametros = async (cdEmpresaConsultora: number) => {
    try {
      const response = await fetch(`/api/admin/empresas/${cdEmpresaConsultora}`);
      const data = await response.json();
      if (data.success && data.data.parametros) {
        setParametros(data.data.parametros);
      }
    } catch (error) {
      console.error('Error al cargar parámetros:', error);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, dsLogo: base64 }));
        setLogoPreview(`data:image/png;base64,${base64}`);
      } catch (error) {
        setError('Error al cargar el logo');
      }
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, dsLogo: '' }));
    setLogoPreview(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = empresa 
        ? `/api/admin/empresas/${empresa.cdEmpresaConsultora}`
        : '/api/admin/empresas';
      
      const method = empresa ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        parametros: parametros,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(data.error || 'Error al guardar la empresa');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const updateParametro = (codigo: string, valor: string) => {
    setParametros(prev => 
      prev.map(p => p.dsCodigoParametro === codigo ? { ...p, dsValorParametro: valor } : p)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {empresa ? 'Editar Empresa Consultora' : 'Nueva Empresa Consultora'}
          </DialogTitle>
          <DialogDescription>
            Complete la información de la empresa consultora
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="dsNombreEmpresaConsultora">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dsNombreEmpresaConsultora"
                  value={formData.dsNombreEmpresaConsultora}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsNombreEmpresaConsultora: e.target.value }))}
                  required
                  placeholder="Ej: DC - Gestión & Estrategia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsCUIT">
                  CUIT <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dsCUIT"
                  value={formData.dsCUIT}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsCUIT: e.target.value }))}
                  required
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsMail">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dsMail"
                  type="email"
                  value={formData.dsMail}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsMail: e.target.value }))}
                  required
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsTelefono">Teléfono</Label>
                <Input
                  id="dsTelefono"
                  value={formData.dsTelefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsTelefono: e.target.value }))}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                {logoPreview ? (
                  <div className="flex items-center gap-2">
                    <img src={logoPreview} alt="Logo" className="h-16 object-contain border rounded p-2" />
                    <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Dirección</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="dsDomicilio">Domicilio</Label>
                <Input
                  id="dsDomicilio"
                  value={formData.dsDomicilio}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsDomicilio: e.target.value }))}
                  placeholder="Calle 123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsLocalidad">Localidad</Label>
                <Input
                  id="dsLocalidad"
                  value={formData.dsLocalidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsLocalidad: e.target.value }))}
                  placeholder="San Fernando"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsCodigoPostal">Código Postal</Label>
                <Input
                  id="dsCodigoPostal"
                  value={formData.dsCodigoPostal}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsCodigoPostal: e.target.value }))}
                  placeholder="1646"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsProvincia">Provincia</Label>
                <Input
                  id="dsProvincia"
                  value={formData.dsProvincia}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsProvincia: e.target.value }))}
                  placeholder="Buenos Aires"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsPais">País</Label>
                <Input
                  id="dsPais"
                  value={formData.dsPais}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsPais: e.target.value }))}
                  placeholder="Argentina"
                />
              </div>
            </div>
          </div>

          {/* Persona de Contacto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Persona de Contacto</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="dsContactoNombre">Nombre Completo</Label>
                <Input
                  id="dsContactoNombre"
                  value={formData.dsContactoNombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsContactoNombre: e.target.value }))}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsContactoTelefono">Teléfono</Label>
                <Input
                  id="dsContactoTelefono"
                  value={formData.dsContactoTelefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsContactoTelefono: e.target.value }))}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsContactoEmail">Email</Label>
                <Input
                  id="dsContactoEmail"
                  type="email"
                  value={formData.dsContactoEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, dsContactoEmail: e.target.value }))}
                  placeholder="contacto@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Parámetros Aditus */}
          {empresa && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Configuración Aditus DMS</h3>
              <div className="grid grid-cols-1 gap-4">
                {parametros.map((param) => (
                  <div key={param.dsCodigoParametro} className="space-y-2">
                    <Label htmlFor={param.dsCodigoParametro}>
                      {param.dsCodigoParametro.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={param.dsCodigoParametro}
                      value={param.dsValorParametro}
                      onChange={(e) => updateParametro(param.dsCodigoParametro, e.target.value)}
                      placeholder={`Ingrese ${param.dsCodigoParametro.toLowerCase()}`}
                      type={param.dsCodigoParametro.includes('CLAVE') ? 'password' : 'text'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                empresa ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
