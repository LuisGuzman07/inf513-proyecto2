import dayjs, { type Dayjs } from 'dayjs';
import type { FormInstance } from 'antd';
import type {
  JobDescriptionInput,
  ServiceLanguage,
  ServiceLanguageLevel,
  ServiceModality,
  ServicePaymentScheme,
  ServiceRequestDetail,
  ServiceRequestInput,
  ServiceTravel,
  ServiceWorkday,
} from './services-types';

export type LanguageRow = {
  language?: string;
  level?: ServiceLanguageLevel;
};

export type RequestFormValues = {
  company_name?: string;
  contact_name?: string;
  contact_position?: string;
  contact_area?: string;
  contact_email?: string;
  contact_phone?: string;
  position_title?: string;
  vacancies?: number | null;
  modality?: ServiceModality;
  workday?: ServiceWorkday;
  location?: string;
  salary_currency?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  payment_scheme?: ServicePaymentScheme;
  benefits?: string;
  required_education?: string;
  required_knowledge?: string;
  required_experience?: string;
  languages?: LanguageRow[];
  deadline?: Dayjs | null;
  status?: 'submitted' | 'in_review';
};

export type DescriptionFormValues = {
  area?: string;
  reports_to?: string;
  headcount?: string;
  objective?: string;
  activities?: string[];
  required_education?: string;
  required_knowledge?: string;
  required_experience?: string;
  work_schedule?: string;
  travel?: ServiceTravel;
  work_environment?: string;
};

const text = (value?: string | null) => (value ?? '').trim();
const nullableText = (value?: string | null) => text(value) || null;
const nullableNumber = (value?: number | string | null) =>
  value === null || value === undefined || value === '' ? null : Number(value);

/** Un idioma a medio completar es un error; una fila vacía simplemente no se envía. */
export function languagesPayload(rows: LanguageRow[] = []): ServiceLanguage[] {
  return rows
    .filter((row) => text(row.language) !== '' || row.level !== undefined)
    .map((row) => ({
      language: text(row.language),
      level: row.level ?? 'intermedio',
    }));
}

export function requestPayload(values: RequestFormValues): ServiceRequestInput {
  return {
    company_name: text(values.company_name),
    contact_name: text(values.contact_name),
    contact_position: text(values.contact_position),
    contact_area: text(values.contact_area),
    contact_email: text(values.contact_email),
    contact_phone: text(values.contact_phone),
    position_title: text(values.position_title),
    vacancies: Number(values.vacancies ?? 0),
    modality: values.modality ?? 'presencial',
    workday: values.workday ?? 'completo',
    location: text(values.location),
    salary_currency:
      nullableText(values.salary_currency)?.toUpperCase() ?? null,
    salary_min: nullableNumber(values.salary_min),
    salary_max: nullableNumber(values.salary_max),
    payment_scheme: values.payment_scheme ?? 'fijo',
    benefits: text(values.benefits),
    required_education: text(values.required_education),
    required_knowledge: text(values.required_knowledge),
    required_experience: text(values.required_experience),
    languages: languagesPayload(values.languages),
    deadline: (values.deadline ?? dayjs()).format('YYYY-MM-DD'),
  };
}

export function descriptionPayload(
  values: DescriptionFormValues
): JobDescriptionInput {
  return {
    area: text(values.area),
    reports_to: text(values.reports_to),
    headcount: text(values.headcount),
    objective: text(values.objective),
    activities: (values.activities ?? [])
      .map((activity) => text(activity))
      .filter((activity) => activity !== ''),
    required_education: text(values.required_education),
    required_knowledge: text(values.required_knowledge),
    required_experience: text(values.required_experience),
    work_schedule: text(values.work_schedule),
    travel: values.travel ?? 'no',
    work_environment: text(values.work_environment),
  };
}

export function requestFormValues(
  detail: ServiceRequestDetail
): RequestFormValues {
  const solicitud = detail.solicitud;
  return {
    company_name: solicitud.company_name,
    contact_name: solicitud.contact_name,
    contact_position: solicitud.contact_position,
    contact_area: solicitud.contact_area,
    contact_email: solicitud.contact_email,
    contact_phone: solicitud.contact_phone,
    position_title: solicitud.position_title,
    vacancies: solicitud.vacancies,
    modality: solicitud.modality,
    workday: solicitud.workday,
    location: solicitud.location,
    salary_currency: solicitud.salary_currency ?? undefined,
    salary_min: nullableNumber(solicitud.salary_min),
    salary_max: nullableNumber(solicitud.salary_max),
    payment_scheme: solicitud.payment_scheme,
    benefits: solicitud.benefits,
    required_education: solicitud.required_education,
    required_knowledge: solicitud.required_knowledge,
    required_experience: solicitud.required_experience,
    languages: solicitud.languages,
    deadline: solicitud.deadline ? dayjs(solicitud.deadline) : null,
    status: solicitud.status === 'linked' ? undefined : solicitud.status,
  };
}

export function descriptionFormValues(
  detail: ServiceRequestDetail
): DescriptionFormValues {
  return { ...(detail.descripcion ?? {}) };
}

const informed = (value: unknown) =>
  value !== null && value !== undefined && String(value).trim() !== '';

type ServiceValidatorRule = {
  validator: (rule: unknown, value: unknown) => Promise<void>;
};

/** Una clave del backend como `description.activities.0` vuelve a ser una ruta de formulario. */
export function fieldPath(key: string): (string | number)[] {
  return key
    .split('.')
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

/** S2.1: los errores del backend se muestran en el campo que los origina. */
export function applyFieldErrors(
  form: FormInstance,
  errors: Record<string, string[]>
) {
  form.setFields(
    Object.entries(errors).map(([key, messages]) => ({
      name: fieldPath(key),
      errors: messages,
    })) as Parameters<FormInstance['setFields']>[0]
  );
}

/**
 * El rango salarial se informa completo o no se informa; el backend lo juzga sobre el
 * estado guardado y este formulario repite el mismo criterio antes de enviar.
 */
export function salaryRule({
  getFieldValue,
}: FormInstance): ServiceValidatorRule {
  return {
    validator: async () => {
      const currency = getFieldValue('salary_currency');
      const min = getFieldValue('salary_min');
      const max = getFieldValue('salary_max');
      const count = [currency, min, max].filter(informed).length;
      if (count === 0) return;
      if (count < 3)
        throw new Error(
          'El rango salarial requiere moneda, monto mínimo y monto máximo, o ninguno de los tres.'
        );
      if (Number(min) > Number(max))
        throw new Error('El monto máximo debe ser mayor o igual al mínimo.');
    },
  };
}

/** Un idioma sin nivel (o al revés) no se envía a medio completar. */
export function languageRule(
  { getFieldValue }: FormInstance,
  index: number
): ServiceValidatorRule {
  return {
    validator: async () => {
      const rows: LanguageRow[] = getFieldValue('languages') ?? [];
      const row = rows[index] ?? {};
      const language = informed(row.language);
      const level = row.level !== undefined && row.level !== null;
      if (language !== level)
        throw new Error('Completá el idioma y su nivel, o quitá la fila.');
    },
  };
}

export function activitiesRule(): ServiceValidatorRule {
  return {
    validator: async (_rule, value) => {
      if (((value as string[] | undefined) ?? []).length === 0)
        throw new Error('Registrá al menos una actividad.');
    },
  };
}
