import type {
  ServiceLanguageLevel,
  ServiceModality,
  ServicePaymentScheme,
  ServiceRequestStatus,
  ServiceTravel,
  ServiceWorkday,
} from './services-types';

export const serviceStatusLabels: Record<ServiceRequestStatus, string> = {
  submitted: 'Enviada',
  in_review: 'En revisión',
  linked: 'Vinculada a una empresa',
};

export const serviceStatusColors: Record<ServiceRequestStatus, string> = {
  submitted: 'default',
  in_review: 'processing',
  linked: 'success',
};

export const modalityLabels: Record<ServiceModality, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

export const workdayLabels: Record<ServiceWorkday, string> = {
  completo: 'Jornada completa',
  medio: 'Media jornada',
  proyecto: 'Por proyecto',
};

export const paymentSchemeLabels: Record<ServicePaymentScheme, string> = {
  fijo: 'Fijo',
  fijo_comisiones: 'Fijo con comisiones',
};

export const languageLevelLabels: Record<ServiceLanguageLevel, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export const travelLabels: Record<ServiceTravel, string> = {
  no: 'No',
  ocasional: 'Ocasional',
  constante: 'Constante',
};

export const actorKindLabels: Record<string, string> = {
  company_user: 'Responsable empresarial',
  staff: 'Personal de la plataforma',
  public: 'Envío público',
};

export const serviceActionLabels: Record<string, string> = {
  submitted: 'Envío de la solicitud',
  updated: 'Edición de la solicitud',
  description_updated: 'Edición de la descripción del cargo',
  candidate_added: 'Alta de candidato',
  candidate_updated: 'Edición de candidato',
  company_linked: 'Vinculación a una empresa',
};

export const modalityOptions = (
  Object.keys(modalityLabels) as ServiceModality[]
).map((value) => ({ value, label: modalityLabels[value] }));

export const workdayOptions = (
  Object.keys(workdayLabels) as ServiceWorkday[]
).map((value) => ({ value, label: workdayLabels[value] }));

export const paymentSchemeOptions = (
  Object.keys(paymentSchemeLabels) as ServicePaymentScheme[]
).map((value) => ({ value, label: paymentSchemeLabels[value] }));

export const languageLevelOptions = (
  Object.keys(languageLevelLabels) as ServiceLanguageLevel[]
).map((value) => ({ value, label: languageLevelLabels[value] }));

export const travelOptions = (Object.keys(travelLabels) as ServiceTravel[]).map(
  (value) => ({ value, label: travelLabels[value] })
);

export const serviceStatusOptions = (
  Object.keys(serviceStatusLabels) as ServiceRequestStatus[]
).map((value) => ({ value, label: serviceStatusLabels[value] }));

export function formatSalary(
  currency: string | null,
  min: string | number | null,
  max: string | number | null
): string {
  if (currency === null || min === null || max === null) return 'No informado';
  return `${currency} ${Number(min)} – ${Number(max)}`;
}
