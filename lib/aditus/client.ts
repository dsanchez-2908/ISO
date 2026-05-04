/**
 * Cliente de Aditus DMS
 * Funciones para interactuar con el gestor documental
 */

interface AditusConfig {
  urlToken: string;
  urlAgregarDocumento: string;
  urlVisor: string;
  usuarioToken: string;
  claveToken: string;
  codigoLibreria: string;
  codigoClase: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

interface UploadDocumentRequest {
  json: {
    properties: Array<{
      name: string;
      value: string;
    }>;
    security: any[];
    objectDefinitionId: string;
  };
  content: string;
  fileName: string;
  contentType: string;
}

/**
 * Obtiene el token de autenticación de Aditus
 */
export async function getAditusToken(config: AditusConfig): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: 'aditus-platform-client',
    username: config.usuarioToken,
    password: config.claveToken,
  });

  const response = await fetch(config.urlToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener token de Aditus: ${response.statusText}`);
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

/**
 * Sube un documento a Aditus DMS
 */
export async function uploadDocumentToAditus(
  config: AditusConfig,
  token: string,
  fileContent: string,
  fileName: string,
  contentType: string
): Promise<string> {
  const body: UploadDocumentRequest = {
    json: {
      properties: [
        {
          name: 'modulo',
          value: 'ISO',
        },
      ],
      security: [],
      objectDefinitionId: config.codigoClase,
    },
    content: fileContent,
    fileName: fileName,
    contentType: contentType,
  };

  const response = await fetch(config.urlAgregarDocumento, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': '*/*',
      'x-library': config.codigoLibreria,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al subir documento a Aditus: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // El API devuelve el ID del documento
  // Puede ser data.id, data.documentId, o similar según la respuesta del API
  return data.id || data.documentId || data;
}

/**
 * Genera la URL del visor de documentos de Aditus
 */
export function getAditusViewerUrl(
  config: AditusConfig,
  documentId: string,
  token: string
): string {
  const params = new URLSearchParams({
    image: documentId,
    library: config.codigoLibreria,
    token: token,
  });

  return `${config.urlVisor}?${params.toString()}`;
}
