import type {
  CandidateCurriculumData,
  DocumentType,
  DraftInput,
  RecordDetail,
  RecordStatus,
} from './types';
import { fields } from './validation';
export const academicTitle =
  'Sistematización de Herramientas Métricas para la Selección de Personal';
export function sessionHome(user: {
  is_graduate?: boolean;
  can_review_talent?: boolean;
  can_manage_services?: boolean;
  company_manager?: boolean;
}) {
  return user.is_graduate
    ? '/portal/inscripcion'
    : user.can_review_talent
      ? '/personal/inscripciones'
      : user.can_manage_services
        ? '/personal/servicios'
        : user.company_manager
          ? '/empresa/servicios'
          : '/expedientes-anteriores';
}
export const statusLabels: Record<RecordStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En revisión',
  correction_requested: 'Requiere corrección',
  review_concluded: 'Revisión documental concluida',
  legacy_internal: 'Vinculación pendiente',
};
export const actionLabels: Record<string, string> = {
  created: 'Creación',
  updated: 'Edición',
  holder_linked: 'Vinculación del titular',
  document_uploaded: 'Documento adjuntado',
  instrument_assigned: 'Prueba asignada',
  submitted: 'Envío a revisión',
  review_claimed: 'Revisión asignada',
  review_concluded: 'Revisión documental concluida',
  academic_review_recorded: 'Revisión académica registrada',
  cv_review_recorded: 'Revisión del CV registrada',
  cv_absence_noted: 'Ausencia de CV registrada',
  observation_added: 'Observación registrada',
  correction_requested: 'Corrección solicitada',
  resubmitted: 'Reenvío a revisión',
};
export const documentTypes: {
  type: DocumentType;
  label: string;
  required: boolean;
}[] = [
  { type: 'historico', label: 'Histórico académico', required: true },
  { type: 'ci', label: 'Cédula de identidad', required: true },
  { type: 'fotografia', label: 'Fotografía', required: true },
  { type: 'titulo_academico', label: 'Título académico', required: true },
  { type: 'provision_nacional', label: 'Provisión nacional', required: false },
  { type: 'cv', label: 'Currículum vitae', required: false },
];
export function missingCurriculum(
  curriculum?: CandidateCurriculumData | null
): string[] {
  if (!curriculum) {
    return ['Currículum Vitae: Formulario digital sin guardar'];
  }
  const missing: string[] = [];
  if (!curriculum.target_position?.trim()) missing.push('CV: Puesto / Vacante al que postula');
  if (!curriculum.expected_salary?.trim()) missing.push('CV: Pretensión salarial');
  if (!curriculum.identity_card?.trim()) missing.push('CV: Cédula de identidad (CI)');
  if (!curriculum.application_date?.trim()) missing.push('CV: Fecha de solicitud');
  if (!curriculum.contact_phone?.trim()) missing.push('CV: Teléfono de contacto');
  if (!curriculum.contact_email?.trim()) missing.push('CV: Correo electrónico');
  if (!curriculum.address?.trim()) missing.push('CV: Dirección de domicilio');
  if (!curriculum.incorporation_availability?.trim()) missing.push('CV: Disponibilidad de incorporación');

  const hasEducation = (curriculum.education_levels ?? []).some(
    (edu) => edu.career?.trim() && edu.institution?.trim() && edu.status?.trim()
  );
  if (!hasEducation) {
    missing.push('CV: Formación académica (Carrera, Institución y Estado)');
  }

  if (!curriculum.technical_knowledge?.trim()) missing.push('CV: Conocimientos técnicos y software');
  if (!curriculum.languages?.trim()) missing.push('CV: Idiomas y nivel');

  const jobs = curriculum.work_experiences ?? [];
  if (jobs.length === 0) {
    missing.push('CV: Empleo 1 (Completar historial laboral)');
  } else {
    jobs.forEach((job, idx) => {
      const num = idx + 1;
      if (!job.company?.trim()) missing.push(`CV: Empleo ${num} - Empresa`);
      if (!job.position?.trim()) missing.push(`CV: Empleo ${num} - Cargo`);
      if (!job.period?.trim()) missing.push(`CV: Empleo ${num} - Periodo`);
      if (!job.supervisor?.trim()) missing.push(`CV: Empleo ${num} - Jefe directo`);
      if (!job.reference_phone?.trim()) missing.push(`CV: Empleo ${num} - Teléfono de referencia`);
      if (!job.leaving_reason?.trim()) missing.push(`CV: Empleo ${num} - Motivo de salida`);
      if (!job.achievements?.trim()) missing.push(`CV: Empleo ${num} - Funciones y logros`);
    });
  }

  if (!curriculum.work_modality?.trim()) missing.push('CV: Modalidad de trabajo preferida');
  if (!curriculum.schedule_availability?.trim()) missing.push('CV: Disponibilidad de horario');
  if (!curriculum.travel_availability?.trim()) missing.push('CV: Disponibilidad para viajar');
  if (!curriculum.driver_license?.trim()) missing.push('CV: Licencia de conducir');
  if (!curriculum.relatives_in_company?.trim()) missing.push('CV: Familiares en la empresa');
  if (!curriculum.declaration_accepted) missing.push('CV: Aceptación de declaración jurada');

  return missing;
}

export function missingForSubmission(
  input: DraftInput,
  documents: { type: DocumentType }[],
  curriculum?: CandidateCurriculumData | null
) {
  return [
    ...fields
      .filter(([key]) => key !== 'faculty' && !input[key]?.trim())
      .map(([, label]) => label),
    ...(['province', 'department', 'country'] as const)
      .filter((key) => typeof input.mobility?.[key] !== 'boolean')
      .map(
        (key) =>
          'Movilidad: ' +
          {
            province: 'Provincia',
            department: 'Departamento',
            country: 'País',
          }[key]
      ),
    ...documentTypes
      .filter(
        (item) =>
          item.required && !documents.some((doc) => doc.type === item.type)
      )
      .map((item) => item.label),
    ...(curriculum !== undefined ? missingCurriculum(curriculum) : []),
  ];
}
export function canEdit(
  record: RecordDetail,
  user: { id: number; is_graduate?: boolean } | null
) {
  return (
    user?.is_graduate === true &&
    record.holder_user_id === user.id &&
    (record.status === 'draft' || record.status === 'correction_requested')
  );
}
export function validateFile(type: DocumentType, file: File): string | null {
  if (file.size > 10 * 1024 * 1024)
    return 'El archivo supera el máximo de 10 MiB.';
  const extension = file.name.split('.').pop()?.toLowerCase();
  const valid =
    (file.type === 'image/jpeg' &&
      (extension === 'jpg' || extension === 'jpeg')) ||
    (file.type === 'image/png' && extension === 'png') ||
    (type !== 'fotografia' &&
      file.type === 'application/pdf' &&
      extension === 'pdf');
  return valid
    ? null
    : type === 'fotografia'
      ? 'La fotografía debe ser JPEG o PNG con extensión coherente.'
      : 'Seleccioná un PDF, JPEG o PNG con extensión coherente.';
}
