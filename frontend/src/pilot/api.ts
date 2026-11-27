import axios from 'axios';
import type {
  CatalogCareerOption,
  CatalogFaculty,
  Draft,
  HistoryEntry,
  PilotUser,
  RecordDetail,
  RecordList,
  RegisterInput,
  CandidateCurriculumData,
  DocumentType,
  DocumentMetadata,
  Observation,
  StaffListFilters,
  AnonymousCandidate,
  AnonymousCandidateDetail,
} from './types';

const normalizedBase =
  typeof __APP_BASE__ !== 'undefined' && __APP_BASE__ !== '/'
    ? __APP_BASE__.replace(/\/+$/, '')
    : '';

export const pilotClient = axios.create({
  baseURL: normalizedBase || undefined,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});
const records = '/api/talento/inscripciones';
export const pilotApi = {
  async register(
    input: RegisterInput,
    signal: AbortSignal
  ): Promise<PilotUser> {
    await pilotClient.get('/sanctum/csrf-cookie', { signal });
    const { name, email, password, password_confirmation } = input;
    return (
      await pilotClient.post(
        '/api/auth/register',
        { name, email, password, password_confirmation },
        { signal }
      )
    ).data.data.user;
  },
  async submit(
    id: string,
    version: number,
    signal: AbortSignal
  ): Promise<RecordDetail> {
    return (
      await pilotClient.post(
        `${records}/${encodeURIComponent(id)}/enviar`,
        { version },
        { signal }
      )
    ).data.data;
  },
  async upload(
    id: string,
    type: DocumentType,
    file: File,
    version: number,
    signal: AbortSignal
  ): Promise<{ document: DocumentMetadata; registration_version: number }> {
    const body = new FormData();
    body.append('type', type);
    body.append('file', file);
    body.append('version', String(version));
    const data = (
      await pilotClient.post(
        `${records}/${encodeURIComponent(id)}/documentos`,
        body,
        { signal }
      )
    ).data.data;
    return {
      document: data.document,
      registration_version: data.registration_version,
    };
  },
  async download(
    id: string,
    documentId: string,
    signal: AbortSignal
  ): Promise<Blob> {
    return (
      await pilotClient.get(
        `${records}/${encodeURIComponent(id)}/documentos/${encodeURIComponent(
          documentId
        )}/descargar`,
        { signal, responseType: 'blob' }
      )
    ).data;
  },
  async getCv(
    id: string,
    signal?: AbortSignal
  ): Promise<CandidateCurriculumData> {
    return (
      await pilotClient.get(`${records}/${encodeURIComponent(id)}/cv`, {
        signal,
      })
    ).data.data;
  },
  async saveCv(
    id: string,
    data: Partial<CandidateCurriculumData>,
    signal?: AbortSignal
  ): Promise<CandidateCurriculumData> {
    return (
      await pilotClient.put(`${records}/${encodeURIComponent(id)}/cv`, data, {
        signal,
      })
    ).data.data;
  },
  async observations(id: string, signal: AbortSignal): Promise<Observation[]> {
    return (
      await pilotClient.get(
        `${records}/${encodeURIComponent(id)}/observaciones`,
        { signal }
      )
    ).data.data;
  },
  async staffList(
    page: number,
    signal: AbortSignal,
    filters: StaffListFilters = {}
  ): Promise<RecordList> {
    return (
      await pilotClient.get('/api/personal/inscripciones', {
        params: { page, ...filters },
        signal,
      })
    ).data;
  },
  async staffDetail(id: string, signal: AbortSignal): Promise<RecordDetail> {
    return (
      await pilotClient.get(
        `/api/personal/inscripciones/${encodeURIComponent(id)}`,
        { signal }
      )
    ).data.data;
  },
  async review(
    id: string,
    action:
      | 'tomar'
      | 'observaciones'
      | 'solicitar-correccion'
      | 'concluir-revision'
      | 'revision-academica'
      | 'revision-cv',
    version: number,
    content: string | undefined,
    signal: AbortSignal,
    extra: Record<string, unknown> = {}
  ): Promise<RecordDetail> {
    return (
      await pilotClient.post(
        `/api/personal/inscripciones/${encodeURIComponent(id)}/${action}`,
        { version, ...(content === undefined ? {} : { content }), ...extra },
        { signal }
      )
    ).data.data;
  },
  async me(signal: AbortSignal): Promise<PilotUser> {
    return (await pilotClient.get('/api/auth/me', { signal })).data.data.user;
  },
  async login(
    email: string,
    password: string,
    signal: AbortSignal
  ): Promise<PilotUser> {
    await pilotClient.get('/sanctum/csrf-cookie', { signal });
    return (
      await pilotClient.post('/api/auth/login', { email, password }, { signal })
    ).data.data.user;
  },
  async logout(signal: AbortSignal): Promise<void> {
    await pilotClient.get('/sanctum/csrf-cookie', { signal });
    await pilotClient.post('/api/auth/logout', {}, { signal });
  },
  async list(page: number, signal: AbortSignal): Promise<RecordList> {
    return (await pilotClient.get(records, { params: { page }, signal })).data;
  },
  async catalogFaculties(signal: AbortSignal): Promise<CatalogFaculty[]> {
    return (await pilotClient.get('/api/catalogo/facultades', { signal })).data
      .data;
  },
  async catalogOptions(
    signal: AbortSignal,
    params: { faculty_id?: string } = {}
  ): Promise<CatalogCareerOption[]> {
    return (
      await pilotClient.get('/api/catalogo/carreras', {
        params,
        signal,
      })
    ).data.data;
  },
  async detail(id: string, signal: AbortSignal): Promise<RecordDetail> {
    return (
      await pilotClient.get(`${records}/${encodeURIComponent(id)}`, { signal })
    ).data.data;
  },
  async history(id: string, signal: AbortSignal): Promise<HistoryEntry[]> {
    return (
      await pilotClient.get(`${records}/${encodeURIComponent(id)}/historial`, {
        signal,
      })
    ).data.data;
  },
  async create(draft: Draft, signal: AbortSignal): Promise<RecordDetail> {
    return (await pilotClient.post(records, draft, { signal })).data.data;
  },
  async update(
    id: string,
    draft: Partial<Draft> & { version: number },
    signal: AbortSignal
  ): Promise<RecordDetail> {
    return (
      await pilotClient.patch(`${records}/${encodeURIComponent(id)}`, draft, {
        signal,
      })
    ).data.data;
  },
  async candidatePool(
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      career?: string;
      faculty?: string;
      modality?: string;
      status?: string;
    } = {},
    signal?: AbortSignal
  ): Promise<{ data: AnonymousCandidate[]; meta: { current_page: number; per_page: number; total: number; last_page: number } }> {
    return (
      await pilotClient.get('/api/banco-candidatos', {
        params,
        signal,
      })
    ).data;
  },
  async candidatePoolDetail(
    code: string,
    signal?: AbortSignal
  ): Promise<AnonymousCandidateDetail> {
    return (
      await pilotClient.get(`/api/banco-candidatos/${encodeURIComponent(code)}`, {
        signal,
      })
    ).data.data;
  },
};

export function httpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}
export function fieldErrors(error: unknown): Record<string, string[]> {
  return httpStatus(error) === 422
    ? (error as { response: { data: { errors?: Record<string, string[]> } } })
        .response.data.errors ?? {}
    : {};
}
export function errorText(error: unknown): string {
  switch (httpStatus(error)) {
    case 401:
      return 'Credenciales inválidas o sesión vencida. Ingresá nuevamente.';
    case 403:
      return 'Esta cuenta no tiene permiso para esta operación.';
    case 404:
      return 'Expediente no disponible.';
    case 409:
      return 'Otra edición cambió la versión. Recargá el expediente antes de volver a editar; no se sobrescribieron los cambios.';
    case 419:
      return 'La sesión de seguridad venció. Reintentá la operación; si persiste, ingresá nuevamente.';
    case 422:
      return 'Revisá los campos indicados.';
    case 429:
      return 'Demasiados intentos. Esperá un momento antes de volver a intentar.';
    default:
      return 'No se pudo completar la operación. Verificá la conexión y reintentá.';
  }
}
