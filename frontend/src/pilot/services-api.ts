import { pilotClient } from './api';
import type {
  CompanyMembership,
  JobDescriptionInput,
  ServiceCandidateInput,
  ServiceConsult,
  ServiceFolio,
  ServiceListFilters,
  ServiceRequestCreate,
  ServiceRequestDetail,
  ServiceRequestInput,
  ServiceRequestList,
  ServiceAccess,
} from './services-types';

const list = '/api/personal/servicios';
const company = (id: string) => `${list}/${encodeURIComponent(id)}`;

/** S2.5: cada petición la autoriza Laravel; estas operaciones no deciden permisos. */
export const servicesApi = {
  async create(
    input: ServiceRequestCreate,
    signal: AbortSignal
  ): Promise<ServiceFolio> {
    await pilotClient.get('/sanctum/csrf-cookie', { signal });
    return (
      await pilotClient.post('/api/servicios/solicitudes', input, { signal })
    ).data.data;
  },
  async consult(
    folio: string,
    accessCode: string,
    signal: AbortSignal
  ): Promise<ServiceConsult> {
    await pilotClient.get('/sanctum/csrf-cookie', { signal });
    return (
      await pilotClient.post(
        '/api/servicios/consulta',
        { folio, access_code: accessCode },
        { signal }
      )
    ).data.data;
  },
  async memberships(signal: AbortSignal): Promise<CompanyMembership[]> {
    return (await pilotClient.get('/api/empresa/mis-empresas', { signal })).data
      .data;
  },
  /**
   * S2.2.1 y S2.5: la navegación lee el dato autorizado del servidor. El listado de
   * servicios responde 200 también a un responsable empresarial, así que no sirve para
   * deducir la capacidad de gestión: sólo `staff` la informa.
   */
  async access(signal: AbortSignal): Promise<ServiceAccess> {
    return (await pilotClient.get('/api/servicios/acceso', { signal })).data
      .data;
  },
  /**
   * S2.2.2: alta autenticada. La empresa de un responsable la resuelve el servidor desde su
   * vinculación activa; el personal puede indicarla.
   */
  async createCompanyRequest(
    input: Omit<ServiceRequestCreate, 'confirmed'> & { company_id?: string },
    signal: AbortSignal
  ): Promise<ServiceRequestDetail> {
    await pilotClient.get('/sanctum/csrf-cookie', { signal });
    return (await pilotClient.post(list, input, { signal })).data.data;
  },
  async list(
    page: number,
    filters: ServiceListFilters,
    signal: AbortSignal
  ): Promise<ServiceRequestList> {
    return (
      await pilotClient.get(list, {
        params: {
          page,
          per_page: 20,
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        signal,
      })
    ).data;
  },
  async detail(id: string, signal: AbortSignal): Promise<ServiceRequestDetail> {
    return (await pilotClient.get(company(id), { signal })).data.data;
  },
  async update(
    id: string,
    input: Partial<ServiceRequestInput> & {
      version: number;
      status?: 'submitted' | 'in_review';
    },
    signal: AbortSignal
  ): Promise<ServiceRequestDetail> {
    return (await pilotClient.patch(company(id), input, { signal })).data.data;
  },
  async updateDescription(
    id: string,
    input: Partial<JobDescriptionInput> & { version: number },
    signal: AbortSignal
  ): Promise<ServiceRequestDetail> {
    return (
      await pilotClient.put(`${company(id)}/descripcion`, input, { signal })
    ).data.data;
  },
  async addCandidate(
    id: string,
    input: ServiceCandidateInput,
    signal: AbortSignal
  ): Promise<ServiceRequestDetail> {
    return (
      await pilotClient.post(`${company(id)}/candidatos`, input, { signal })
    ).data.data;
  },
  async updateCandidate(
    id: string,
    candidateId: string,
    input: ServiceCandidateInput & { version: number },
    signal: AbortSignal
  ): Promise<ServiceRequestDetail> {
    return (
      await pilotClient.patch(
        `${company(id)}/candidatos/${encodeURIComponent(candidateId)}`,
        input,
        { signal }
      )
    ).data.data;
  },
  async linkCompany(
    id: string,
    companyId: string,
    version: number,
    signal: AbortSignal
  ): Promise<ServiceRequestDetail> {
    return (
      await pilotClient.post(
        `${company(id)}/empresa`,
        { company_id: companyId, version },
        { signal }
      )
    ).data.data;
  },
};
