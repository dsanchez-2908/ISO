'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: any;
  cdEmpresaConsultora: number;
  onSuccess: () => void;
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  cdEmpresaConsultora,
  onSuccess,
}: ClienteFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Catálogos
  const [condicionesVenta, setCondicionesVenta] = useState<any[]>([]);
  const [tiposIva, setTiposIva] = useState<any[]>([]);
  const [tiposServicios, setTiposServicios] = useState<any[]>([]);
  const [modalidadesTrabajo, setModalidadesTrabajo] = useState<any[]>([]);
  const [paises, setPaises] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    cdCodigoInternoCliente: '',
    dsRazonSocial: '',
    dsCUIT: '',
    dsDomicilio: '',
    dsLocalidad: '',
    dsCodigoPostal: '',
    cdPais: '',
    cdProvincia: '',
    dsTelefono: '',
    dsMail: '',
    dsContacto1: '',
    dsMail1: '',
    dsCelular1: '',
    dsContacto2: '',
    dsMail2: '',
    dsCelular2: '',
    dsWeb: '',
    dsObservaciones: '',
    cdCondicionVenta: '',
    cdIVA: '',
    dsConstanciaInscripcion: '',
    dsLogo: '',
    feInicioActividades: '',
    dsASCESI: '',
    dsReferidoPor: '',
    dsNecesidadEspecifica: '',
    cdTipoServicio: '',
    cdModalidadTrabajo: '',
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [constanciaFileName, setConstanciaFileName] = useState<string>('');
  const [pendingConstancia, setPendingConstancia] = useState<{
    fileContent: string;
    fileName: string;
    contentType: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      const initializeForm = async () => {
        // Primero cargar catálogos
        await loadCatalogos();
        
        // Luego cargar datos del cliente si existe
        if (cliente) {
          // Si hay país, cargar provincias primero
          const paisId = cliente.cdPais?.toString() || '';
          if (paisId) {
            await loadProvincias(parseInt(paisId));
          }

          // Finalmente setear formData con todos los valores
          setFormData({
            cdCodigoInternoCliente: cliente.cdCodigoInternoCliente || '',
            dsRazonSocial: cliente.dsRazonSocial || '',
            dsCUIT: cliente.dsCUIT || '',
            dsDomicilio: cliente.dsDomicilio || '',
            dsLocalidad: cliente.dsLocalidad || '',
            dsCodigoPostal: cliente.dsCodigoPostal || '',
            cdPais: paisId,
            cdProvincia: cliente.cdProvincia?.toString() || '',
            dsTelefono: cliente.dsTelefono || '',
            dsMail: cliente.dsMail || '',
            dsContacto1: cliente.dsContacto1 || '',
            dsMail1: cliente.dsMail1 || '',
            dsCelular1: cliente.dsCelular1 || '',
            dsContacto2: cliente.dsContacto2 || '',
            dsMail2: cliente.dsMail2 || '',
            dsCelular2: cliente.dsCelular2 || '',
            dsWeb: cliente.dsWeb || '',
            dsObservaciones: cliente.dsObservaciones || '',
            cdCondicionVenta: cliente.cdCondicionVenta?.toString() || '',
            cdIVA: cliente.cdIVA?.toString() || '',
            dsConstanciaInscripcion: cliente.dsConstanciaInscripcion || '',
            dsLogo: cliente.dsLogo || '',
            feInicioActividades: cliente.feInicioActividades ? cliente.feInicioActividades.split('T')[0] : '',
            dsASCESI: cliente.dsASCESI || '',
            dsReferidoPor: cliente.dsReferidoPor || '',
            dsNecesidadEspecifica: cliente.dsNecesidadEspecifica || '',
            cdTipoServicio: cliente.cdTipoServicio?.toString() || '',
            cdModalidadTrabajo: cliente.cdModalidadTrabajo?.toString() || '',
          });
          
          if (cliente.dsLogo) {
            setLogoPreview(`data:image/png;base64,${cliente.dsLogo}`);
          }
          if (cliente.dsConstanciaInscripcion) {
            setConstanciaFileName('Constancia cargada');
          }
          setPendingConstancia(null);
        } else {
          // Resetear formulario para nuevo cliente
          setFormData({
            cdCodigoInternoCliente: '',
            dsRazonSocial: '',
            dsCUIT: '',
            dsDomicilio: '',
            dsLocalidad: '',
            dsCodigoPostal: '',
            cdPais: '',
            cdProvincia: '',
            dsTelefono: '',
            dsMail: '',
            dsContacto1: '',
            dsMail1: '',
            dsCelular1: '',
            dsContacto2: '',
            dsMail2: '',
            dsCelular2: '',
            dsWeb: '',
            dsObservaciones: '',
            cdCondicionVenta: '',
            cdIVA: '',
            dsConstanciaInscripcion: '',
            dsLogo: '',
            feInicioActividades: '',
            dsASCESI: '',
            dsReferidoPor: '',
            dsNecesidadEspecifica: '',
            cdTipoServicio: '',
            cdModalidadTrabajo: '',
          });
          setLogoPreview('');
          setConstanciaFileName('');
          setProvincias([]);
          setPendingConstancia(null);
        }
      };

      initializeForm();
    }
  }, [open, cliente]);

  const loadCatalogos = async () => {
    try {
      setLoadingCatalogos(true);
      
      const [condVentaRes, ivaRes, serviciosRes, modalidadesRes, paisesRes] = await Promise.all([
        fetch('/api/catalogos/condiciones-venta'),
        fetch('/api/catalogos/tipos-iva'),
        fetch('/api/catalogos/tipos-servicios'),
        fetch('/api/catalogos/modalidades-trabajo'),
        fetch('/api/catalogos/paises'),
      ]);

      const [condVenta, iva, servicios, modalidades, paises] = await Promise.all([
        condVentaRes.json(),
        ivaRes.json(),
        serviciosRes.json(),
        modalidadesRes.json(),
        paisesRes.json(),
      ]);

      if (condVenta.success) setCondicionesVenta(condVenta.data);
      if (iva.success) setTiposIva(iva.data);
      if (servicios.success) setTiposServicios(servicios.data);
      if (modalidades.success) setModalidadesTrabajo(modalidades.data);
      if (paises.success) setPaises(paises.data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const loadProvincias = async (cdPais: number) => {
    try {
      const response = await fetch(`/api/catalogos/provincias?cdPais=${cdPais}`);
      const data = await response.json();
      if (data.success) {
        setProvincias(data.data);
      }
    } catch (error) {
      console.error('Error al cargar provincias:', error);
    }
  };

  const handlePaisChange = (value: string) => {
    setFormData({ ...formData, cdPais: value, cdProvincia: '' });
    setProvincias([]);
    if (value) {
      loadProvincias(parseInt(value));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor seleccione un archivo de imagen válido",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        setFormData({ ...formData, dsLogo: base64Data });
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConstanciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Leer el archivo como base64 y guardarlo en estado
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remover el prefijo "data:..."

        // Guardar archivo pendiente para subir al guardar
        setPendingConstancia({
          fileContent: base64Data,
          fileName: file.name,
          contentType: file.type || 'application/pdf',
        });
        setConstanciaFileName(file.name);
      };

      reader.onerror = () => {
        toast({
          title: "Error al leer archivo",
          description: "No se pudo leer el archivo seleccionado",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Si hay un archivo pendiente, subirlo primero a Aditus
      let documentId = formData.dsConstanciaInscripcion;
      if (pendingConstancia) {
        setUploadingFile(true);
        try {
          const uploadResponse = await fetch('/api/aditus/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cdEmpresaConsultora: cdEmpresaConsultora,
              fileContent: pendingConstancia.fileContent,
              fileName: pendingConstancia.fileName,
              contentType: pendingConstancia.contentType,
            }),
          });

          const uploadData = await uploadResponse.json();

          if (uploadData.success) {
            documentId = uploadData.data.documentId;
          } else {
            throw new Error(uploadData.error || 'Error al subir archivo');
          }
        } catch (uploadError: any) {
          toast({
            title: "Error al subir archivo",
            description: `Error al subir archivo a Aditus: ${uploadError.message}`,
            variant: "destructive",
          });
          setUploadingFile(false);
          setLoading(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      const url = cliente
        ? `/api/admin/clientes/${cliente.cdCliente}`
        : '/api/admin/clientes';

      const method = cliente ? 'PUT' : 'POST';

      const dataToSend = {
        ...formData,
        dsConstanciaInscripcion: documentId,
        cdEmpresaConsultora,
        cdPais: formData.cdPais ? parseInt(formData.cdPais) : null,
        cdProvincia: formData.cdProvincia ? parseInt(formData.cdProvincia) : null,
        cdCondicionVenta: formData.cdCondicionVenta ? parseInt(formData.cdCondicionVenta) : null,
        cdIVA: formData.cdIVA ? parseInt(formData.cdIVA) : null,
        cdTipoServicio: formData.cdTipoServicio ? parseInt(formData.cdTipoServicio) : null,
        cdModalidadTrabajo: formData.cdModalidadTrabajo ? parseInt(formData.cdModalidadTrabajo) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        setPendingConstancia(null);
        onSuccess();
        onOpenChange(false);
        toast({
          title: cliente ? "Cliente actualizado" : "Cliente creado",
          description: cliente ? "El cliente se actualizó correctamente" : "El cliente se creó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al guardar cliente',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {cliente
              ? 'Actualice la información del cliente'
              : 'Complete los datos del nuevo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Información Principal */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Información Principal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="dsRazonSocial">
                    Razón Social <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dsRazonSocial"
                    value={formData.dsRazonSocial}
                    onChange={(e) =>
                      setFormData({ ...formData, dsRazonSocial: e.target.value })
                    }
                    maxLength={250}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cdCodigoInternoCliente">Código Interno</Label>
                  <Input
                    id="cdCodigoInternoCliente"
                    value={formData.cdCodigoInternoCliente}
                    onChange={(e) =>
                      setFormData({ ...formData, cdCodigoInternoCliente: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="dsCUIT">CUIT</Label>
                  <Input
                    id="dsCUIT"
                    value={formData.dsCUIT}
                    onChange={(e) =>
                      setFormData({ ...formData, dsCUIT: e.target.value })
                    }
                    maxLength={20}
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>

                <div>
                  <Label htmlFor="cdIVA">Condición IVA</Label>
                  <Select
                    value={formData.cdIVA}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cdIVA: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposIva.map((iva) => (
                        <SelectItem key={iva.cdIVA} value={iva.cdIVA.toString()}>
                          {iva.dsIVA}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cdCondicionVenta">Condición de Venta</Label>
                  <Select
                    value={formData.cdCondicionVenta}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cdCondicionVenta: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {condicionesVenta.map((cond) => (
                        <SelectItem key={cond.cdCondicionVenta} value={cond.cdCondicionVenta.toString()}>
                          {cond.dsCondicionVenta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="feInicioActividades">Inicio de Actividades</Label>
                  <Input
                    id="feInicioActividades"
                    type="date"
                    value={formData.feInicioActividades}
                    onChange={(e) =>
                      setFormData({ ...formData, feInicioActividades: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Archivos */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Documentos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dsLogo">Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dsLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('dsLogo')?.click()}
                      className="w-full"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Seleccionar Logo
                    </Button>
                  </div>
                  {logoPreview && (
                    <div className="mt-2">
                      <img src={logoPreview} alt="Logo preview" className="h-20 object-contain border rounded p-2" />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="dsConstanciaInscripcion">Constancia de Inscripción</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dsConstanciaInscripcion"
                      type="file"
                      onChange={handleConstanciaChange}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('dsConstanciaInscripcion')?.click()}
                      disabled={uploadingFile}
                      className="w-full"
                    >
                      {uploadingFile ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {uploadingFile ? 'Subiendo...' : 'Seleccionar Archivo'}
                    </Button>
                  </div>
                  {constanciaFileName && (
                    <div className="mt-2 text-sm text-gray-600">
                      📄 {constanciaFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Dirección</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="dsDomicilio">Domicilio</Label>
                  <Input
                    id="dsDomicilio"
                    value={formData.dsDomicilio}
                    onChange={(e) =>
                      setFormData({ ...formData, dsDomicilio: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="dsLocalidad">Localidad</Label>
                  <Input
                    id="dsLocalidad"
                    value={formData.dsLocalidad}
                    onChange={(e) =>
                      setFormData({ ...formData, dsLocalidad: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="dsCodigoPostal">Código Postal</Label>
                  <Input
                    id="dsCodigoPostal"
                    value={formData.dsCodigoPostal}
                    onChange={(e) =>
                      setFormData({ ...formData, dsCodigoPostal: e.target.value })
                    }
                    maxLength={15}
                  />
                </div>

                <div>
                  <Label htmlFor="cdPais">País</Label>
                  <Select
                    value={formData.cdPais}
                    onValueChange={handlePaisChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paises.map((pais) => (
                        <SelectItem key={pais.cdPais} value={pais.cdPais.toString()}>
                          {pais.dsPais}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cdProvincia">Provincia</Label>
                  <Select
                    value={formData.cdProvincia}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cdProvincia: value })
                    }
                    disabled={!formData.cdPais}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.cdPais ? "Seleccione..." : "Primero seleccione país"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provincias.map((prov) => (
                        <SelectItem key={prov.cdProvincia} value={prov.cdProvincia.toString()}>
                          {prov.dsProvincia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contacto General */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Contacto General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dsTelefono">Teléfono</Label>
                  <Input
                    id="dsTelefono"
                    value={formData.dsTelefono}
                    onChange={(e) =>
                      setFormData({ ...formData, dsTelefono: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="dsMail">Email</Label>
                  <Input
                    id="dsMail"
                    type="email"
                    value={formData.dsMail}
                    onChange={(e) =>
                      setFormData({ ...formData, dsMail: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="dsWeb">Sitio Web</Label>
                  <Input
                    id="dsWeb"
                    type="url"
                    value={formData.dsWeb}
                    onChange={(e) =>
                      setFormData({ ...formData, dsWeb: e.target.value })
                    }
                    maxLength={250}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>

            {/* Contacto Principal */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Contacto Principal</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dsContacto1">Nombre</Label>
                  <Input
                    id="dsContacto1"
                    value={formData.dsContacto1}
                    onChange={(e) =>
                      setFormData({ ...formData, dsContacto1: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="dsMail1">Email</Label>
                  <Input
                    id="dsMail1"
                    type="email"
                    value={formData.dsMail1}
                    onChange={(e) =>
                      setFormData({ ...formData, dsMail1: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="dsCelular1">Celular</Label>
                  <Input
                    id="dsCelular1"
                    value={formData.dsCelular1}
                    onChange={(e) =>
                      setFormData({ ...formData, dsCelular1: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* Contacto Secundario */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Contacto Secundario</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dsContacto2">Nombre</Label>
                  <Input
                    id="dsContacto2"
                    value={formData.dsContacto2}
                    onChange={(e) =>
                      setFormData({ ...formData, dsContacto2: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="dsMail2">Email</Label>
                  <Input
                    id="dsMail2"
                    type="email"
                    value={formData.dsMail2}
                    onChange={(e) =>
                      setFormData({ ...formData, dsMail2: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="dsCelular2">Celular</Label>
                  <Input
                    id="dsCelular2"
                    value={formData.dsCelular2}
                    onChange={(e) =>
                      setFormData({ ...formData, dsCelular2: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* Información Comercial */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Información Comercial</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cdTipoServicio">Tipo de Servicio</Label>
                  <Select
                    value={formData.cdTipoServicio}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cdTipoServicio: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServicios.map((servicio) => (
                        <SelectItem key={servicio.cdTipoServicio} value={servicio.cdTipoServicio.toString()}>
                          {servicio.dsTipoServicio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cdModalidadTrabajo">Modalidad de Trabajo</Label>
                  <Select
                    value={formData.cdModalidadTrabajo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cdModalidadTrabajo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {modalidadesTrabajo.map((modalidad) => (
                        <SelectItem key={modalidad.cdModalidadTrabajo} value={modalidad.cdModalidadTrabajo.toString()}>
                          {modalidad.dsModalidadTrabajo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dsReferidoPor">Referido Por</Label>
                  <Input
                    id="dsReferidoPor"
                    value={formData.dsReferidoPor}
                    onChange={(e) =>
                      setFormData({ ...formData, dsReferidoPor: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="dsASCESI">ASCESI</Label>
                  <Input
                    id="dsASCESI"
                    value={formData.dsASCESI}
                    onChange={(e) =>
                      setFormData({ ...formData, dsASCESI: e.target.value })
                    }
                    maxLength={150}
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3 text-blue-700">Adicional</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dsNecesidadEspecifica">Necesidad Específica</Label>
                  <Textarea
                    id="dsNecesidadEspecifica"
                    value={formData.dsNecesidadEspecifica}
                    onChange={(e) =>
                      setFormData({ ...formData, dsNecesidadEspecifica: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="dsObservaciones">Observaciones</Label>
                  <Textarea
                    id="dsObservaciones"
                    value={formData.dsObservaciones}
                    onChange={(e) =>
                      setFormData({ ...formData, dsObservaciones: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingCatalogos}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cliente ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
