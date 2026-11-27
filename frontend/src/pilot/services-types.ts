export type ServiceRequestStatus = 'submitted' | 'in_review' | 'linked';
export type ServiceModality = 'presencial' | 'hibrido' | 'remoto';
export type ServiceWorkday = 'completo' | 'medio' | 'proyecto';
export type ServicePaymentScheme = 'fijo' | 'fijo_comisiones';
export type ServiceLanguageLevel = 'basico' | 'intermedio' | 'avanzado';
export type ServiceTravel = 'no' | 'ocasional' | 'constante';
export type ServiceArea = 'company' | 'staff';

/** S11-B §3 Idiomas: idioma + nivel, tal como lo declara el formulario. */
export type ServiceLanguage = {
  language: string;
  level: ServiceLanguageLevel;
};

/** S11-B §1–§4. Honorarios, garantía y firmas quedan fuera del alcance del piloto. */
export type ServiceRequestInput = {
  company_name: string;
  contact_name: string;
  contact_position: string;
  contact_area: string;
  contact_email: string;
  contact_phone: string;
  position_title: string;
  vacancies: number;
  modality: ServiceModality;
  workday: ServiceWorkday;
  location: string;
  salary_currency: string | null;
  salary_min: number | null;
  salary_max: number | null;
  payment_scheme: ServicePaymentScheme;
  benefits: string;
  required_education: string;
  required_knowledge: string;
  required_experience: string;
  languages: ServiceLanguage[];
  deadline: string;
};

/** S11-C. El nombre del puesto se precarga desde S11-B §2, por eso no se repite aquí. */
export type JobDescriptionInput = {
  area: string;
  reports_to: string;
  headcount: string;
  objective: string;
  activities: string[];
  required_education: string;
  required_knowledge: string;
  required_experience: string;
  work_schedule: string;
  travel: ServiceTravel;
  work_environment: string;
};

export type ServiceRequestCreate = ServiceRequestInput & {
  description: JobDescriptionInput;
  confirmed: true;
};

export type ServiceFolio = {
  folio: string;
  access_code: string;
};

/**
 * S2.3 y S2.2.2: la consulta sin cuenta recibe sólo el resumen mínimo y el estado.
 * No incluye candidatos, documentos, historial, contactos, salario ni descripción.
 */
export type ServiceConsult = {
  folio: string;
  status: ServiceRequestStatus;
  company_name: string;
  position_title: string;
  vacancies: number;
  modality: ServiceModality;
  workday: ServiceWorkday;
  location: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceCandidate = {
  id: string;
  full_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ServiceCandidateInput = {
  full_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
};

export type ServiceHistoryEntry = {
  id: string;
  action: string;
  version: number;
  actor_kind: 'company_user' | 'staff' | 'public';
  changes: Record<string, { before: unknown; after: unknown }>;
  /** El historial del responsable empresarial se sanitiza: sólo el nombre del actor. */
  actor: { id?: number | null; name: string } | null;
  created_at: string;
};

export type ServiceRequestSummary = {
  id: string;
  folio: string;
  company_name: string;
  company: { id: string; name: string } | null;
  position_title: string;
  vacancies: number;
  modality: ServiceModality;
  status: ServiceRequestStatus;
  deadline: string | null;
  candidates_count: number;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestList = {
  data: ServiceRequestSummary[];
  meta: { current_page: number; per_page: number; total: number };
};

export type ServiceRequestDetail = {
  solicitud: ServiceRequestSummary & {
    company: { id: string; name: string; status: string } | null;
    company_id: string | null;
    /** El personal ve `{id, name}`; el responsable sólo el nombre, y `null` si es de otra empresa. */
    created_by: { id?: number | null; name: string } | null;
    contact_name: string;
    contact_position: string;
    contact_area: string;
    contact_email: string;
    contact_phone: string;
    workday: ServiceWorkday;
    location: string;
    salary_currency: string | null;
    salary_min: string | null;
    salary_max: string | null;
    payment_scheme: ServicePaymentScheme;
    benefits: string;
    required_education: string;
    required_knowledge: string;
    required_experience: string;
    languages: ServiceLanguage[];
  };
  descripcion:
    | (JobDescriptionInput & {
        id: string;
        position_title: string | null;
        updated_at: string;
      })
    | null;
  candidatos: ServiceCandidate[];
  historial: ServiceHistoryEntry[];
};

export type ServiceListFilters = {
  search?: string;
  status?: ServiceRequestStatus;
};

/** S2.2.1: vinculación propia y activa, sólo para decidir la navegación. */
export type CompanyMembership = {
  id: string;
  name: string;
  role: string;
  linked_at: string | null;
};

export type ServiceAccess = {
  companies: CompanyMembership[];
  staff: boolean;
};
