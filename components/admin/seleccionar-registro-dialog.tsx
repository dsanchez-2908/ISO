'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SeleccionarRegistroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeleccionar: (cdRegistroDocumento: number, nombreRegistro: string) => void;
  cdCliente: number;
  cdEmpresaConsultora: number;
}

interface Certificacion {
  cdCertificacion: number;
  dsNombre: string;
  dsNombreNorma: string;
}

interface Requisito {
  cdRequisito: number;
  cdCodigoRequisito: string;
  dsRequisito: string;
}

interface Template {
  cdTemplateDocumento: number;
  dsNombre: string;
  cdCodigo: string;
}

interface Registro {
  cdRegistroDocumento: number;
  dsCodigoDocumento: string;
  dsNombreDocumento: string;
}

export function SeleccionarRegistroDialog({
  open,
  onOpenChange,
  onSeleccionar,
  cdCliente,
  cdEmpresaConsultora
}: SeleccionarRegistroDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  
  const [cdCertificacion, setCdCertificacion] = useState('');
  const [cdRequisito, setCdRequisito] = useState('');
  const [cdTemplateDocumento, setCdTemplateDocumento] = useState('');
  const [cdRegistroDocumento, setCdRegistroDocumento] = useState('');

  useEffect(() => {
    if (open && cdCliente) {
      loadCertificaciones();
    }
  }, [open, cdCliente]);

  useEffect(() => {
    if (cdCertificacion) {
      loadRequisitos();
    } else {
      setRequisitos([]);
      setCdRequisito('');
    }
  }, [cdCertificacion]);

  useEffect(() => {
    if (cdRequisito && cdCertificacion) {
      loadTemplates();
    } else {
      setTemplates([]);
      setCdTemplateDocumento('');
    }
  }, [cdRequisito]);

  useEffect(() => {
    if (cdTemplateDocumento && cdRequisito && cdCertificacion) {
      loadRegistros();
    } else {
      setRegistros([]);
      setCdRegistroDocumento('');
    }
  }, [cdTemplateDocumento]);

  const loadCertificaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/certificaciones?cdCliente=${cdCliente}&soloActivos=1`);
      const data = await res.json();
      if (data.success) {
        setCertificaciones(data.data);
      }
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las certificaciones'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequisitos = async () => {
    try {
      const res = await fetch(`/api/admin/requisitos-certificacion?cdCertificacion=${cdCertificacion}`);
      const data = await res.json();
      if (data.success) {
        setRequisitos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar requisitos:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch(`/api/admin/templates-requisito?cdRequisito=${cdRequisito}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error al cargar templates:', error);
    }
  };

  const loadRegistros = async () => {
    try {
      const res = await fetch(
        `/api/admin/registros-documentos?cdCertificacion=${cdCertificacion}&cdRequisito=${cdRequisito}&cdTemplateDocumento=${cdTemplateDocumento}`
      );
      const data = await res.json();
      if (data.success) {
        setRegistros(data.data);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    }
  };

  const handleSeleccionar = () => {
    if (!cdRegistroDocumento) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un registro'
      });
      return;
    }

    const registro = registros.find(r => r.cdRegistroDocumento === parseInt(cdRegistroDocumento));
    if (registro) {
      const nombreCompleto = `${registro.dsCodigoDocumento} - ${registro.dsNombreDocumento}`;
      onSeleccionar(parseInt(cdRegistroDocumento), nombreCompleto);
      onOpenChange(false);
      
      // Reset
      setCdCertificacion('');
      setCdRequisito('');
      setCdTemplateDocumento('');
      setCdRegistroDocumento('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Registro Vinculado</DialogTitle>
          <DialogDescription>
            Navegue por las certificaciones, requisitos y formularios para seleccionar un registro existente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Certificación */}
          <div>
            <Label htmlFor="certificacion">
              Certificación <span className="text-red-500">*</span>
            </Label>
            <Select value={cdCertificacion} onValueChange={setCdCertificacion} disabled={loading}>
              <SelectTrigger id="certificacion">
                <SelectValue placeholder="Seleccione certificación" />
              </SelectTrigger>
              <SelectContent>
                {certificaciones.map((cert) => (
                  <SelectItem key={cert.cdCertificacion} value={cert.cdCertificacion.toString()}>
                    {cert.dsNombre} ({cert.dsNombreNorma})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requisito */}
          {cdCertificacion && (
            <div>
              <Label htmlFor="requisito">
                Requisito <span className="text-red-500">*</span>
              </Label>
              <Select value={cdRequisito} onValueChange={setCdRequisito}>
                <SelectTrigger id="requisito">
                  <SelectValue placeholder="Seleccione requisito" />
                </SelectTrigger>
                <SelectContent>
                  {requisitos.map((req) => (
                    <SelectItem key={req.cdRequisito} value={req.cdRequisito.toString()}>
                      {req.cdCodigoRequisito} - {req.dsRequisito}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Template/Formulario */}
          {cdRequisito && (
            <div>
              <Label htmlFor="template">
                Formulario/Template <span className="text-red-500">*</span>
              </Label>
              <Select value={cdTemplateDocumento} onValueChange={setCdTemplateDocumento}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Seleccione formulario" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.cdTemplateDocumento} value={tpl.cdTemplateDocumento.toString()}>
                      {tpl.dsNombre} {tpl.cdCodigo && `(${tpl.cdCodigo})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Registro */}
          {cdTemplateDocumento && (
            <div>
              <Label htmlFor="registro">
                Registro <span className="text-red-500">*</span>
              </Label>
              <Select value={cdRegistroDocumento} onValueChange={setCdRegistroDocumento}>
                <SelectTrigger id="registro">
                  <SelectValue placeholder="Seleccione registro" />
                </SelectTrigger>
                <SelectContent>
                  {registros.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No hay registros disponibles</div>
                  ) : (
                    registros.map((reg) => (
                      <SelectItem key={reg.cdRegistroDocumento} value={reg.cdRegistroDocumento.toString()}>
                        {reg.dsCodigoDocumento} - {reg.dsNombreDocumento}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSeleccionar} 
            disabled={!cdRegistroDocumento || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Seleccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
