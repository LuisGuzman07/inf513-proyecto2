import type { RawResult } from './evaluations-types';

export type PilotUser = {
  id: number;
  name: string;
  email: string;
  pilot_enabled: boolean;
  is_graduate: boolean;
  can_review_talent: boolean;
  person_id: string | null;
};
export type Mobility = {
  province: boolean | null;
  department: boolean | null;
  country: boolean | null;
};
export type Draft = {
  full_name: string | null;
  birth_date: string | null;
  university_registration: string | null;
  sex: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  faculty: string | null;
  career: string | null;
  faculty_catalog_id: string | null;
  career_catalog_id: string | null;
  career_manual: boolean;
  interest_area: string | null;
  declared_ppa: string | null;
  mobility: Mobility;
};
export type DraftInput = Partial<Omit<Draft, 'mobility'>> & {
  mobility?: Partial<Mobility>;
};
export type RecordDetail = {
  id: string;
  candidate_code?: string;
  version: number;
  person: Pick<
    Draft,
    | 'full_name'
    | 'birth_date'
    | 'university_registration'
    | 'sex'
    | 'contact_email'
    | 'contact_phone'
  > & { id: string };
  academic: Pick<
    Draft,
    'faculty' | 'career' | 'interest_area' | 'declared_ppa'
  >;
  catalog: {
    faculty_catalog_id: string | null;
    faculty_name: string | null;
    career_catalog_id: string | null;
    career_name: string | null;
    career_manual: boolean;
    needs_review: boolean;
    label: string | null;
    version: string | null;
  };
  mobility: Mobility;
  documents: DocumentMetadata[];
  status: RecordStatus;
  holder_user_id: number | null;
  reviewer: { id: number; name: string } | null;
  document_conclusions: DocumentConclusion[];
  concluded: boolean;
  academic_reviews: { reviews: AcademicReview[]; pendiente: boolean };
  cv_reviews: { reviews: CvReview[]; pendiente: boolean };
  curriculum?: CandidateCurriculumData | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type RecordList = {
  data: {
    id: string;
    candidate_code?: string;
    full_name: string;
    career?: string | null;
    submitted_at?: string | null;
    version: number;
    updated_at: string;
    status?: RecordStatus;
    reviewer?: { id: number; name: string } | null;
  }[];
  meta: { current_page: number; per_page: number; total: number };
};
export type HistoryEntry = {
  id: string;
  action: string;
  version: number;
  changes: Record<string, { before: unknown; after: unknown }>;
  actor: { id: number; name: string };
  created_at: string;
};
export type RecordStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'correction_requested'
  | 'review_concluded'
  | 'legacy_internal';
export type ReviewStatus = Extract<
  RecordStatus,
  'submitted' | 'in_review' | 'correction_requested' | 'review_concluded'
>;
export type StaffListFilters = {
  search?: string;
  status?: ReviewStatus;
};
export type DocumentType =
  | 'historico'
  | 'ci'
  | 'fotografia'
  | 'titulo_academico'
  | 'provision_nacional'
  | 'cv';
export type DocumentMetadata = {
  id: string;
  type: DocumentType;
  version: number;
  original_name: string;
  mime: string;
  size: number;
  created_at: string;
};
export type Observation = {
  id: string;
  kind: string;
  content: string;
  reviewer: { id: number; name: string };
  created_at: string;
};
export type DocumentConclusion = {
  id: string;
  reviewer: { id: number; name: string };
  summary: string;
  created_at: string;
  versions: Record<string, { id: string; version: number }>;
};
export type AcademicReview = {
  id: string;
  reviewer: { id: number; name: string };
  reviewed_ppa: string | null;
  declared_ppa_snapshot: string | null;
  declared_ppa_changed: boolean;
  historico_document_id: string;
  historico_document_version: number;
  sequence: number;
  observations: string;
  vigente: boolean;
  created_at: string;
};
export type CvReview = {
  id: string;
  reviewer: { id: number; name: string };
  absent: boolean;
  cv_document_id: string | null;
  cv_document_version: number | null;
  sequence: number;
  observations: string;
  vigente: boolean;
  created_at: string;
};
export type CatalogFaculty = {
  id: string;
  name: string;
  group: string;
};
export type CatalogCareerOption = {
  id: string;
  faculty_id: string;
  faculty_name: string | null;
  name: string;
  source_names: string[];
  needs_review: boolean;
};
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export interface WorkExperience {
  company: string;
  position: string;
  period: string;
  supervisor: string;
  reference_phone: string;
  leaving_reason: string;
  achievements: string;
}

export interface EducationLevel {
  level: string;
  career: string;
  institution: string;
  status: string;
  year: string;
}

export interface CourseTraining {
  course: string;
  institution: string;
  period: string;
  year: string;
}

export interface CandidateCurriculumData {
  id?: string;
  registration_id?: string;
  target_position?: string | null;
  application_date?: string | null;
  identity_card?: string | null;
  birth_date_and_age?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  expected_salary?: string | null;
  incorporation_availability?: string | null;
  education_levels?: EducationLevel[];
  technical_knowledge?: string | null;
  languages?: string | null;
  courses?: CourseTraining[];
  work_experiences?: WorkExperience[];
  work_modality?: string | null;
  schedule_availability?: string | null;
  travel_availability?: string | null;
  driver_license?: string | null;
  relatives_in_company?: string | null;
  declaration_accepted?: boolean;
}

export type CandidateEvaluationItem = {
  id: string;
  instrument_id?: string;
  instrument_name: string;
  version_label?: string;
  answer_type?: string;
  classified_area?: string;
  classified_area_label?: string;
  status: string;
  submitted_at: string | null;
  raw_result?: RawResult | null;
  instrument_title?: string;
  instrument_code?: string;
  results?: any;
};

export type AnonymousCandidate = {
  candidate_code: string;
  full_name?: string | null;
  target_position: string;
  career: string;
  faculty: string;
  declared_ppa: string | null;
  expected_salary: string;
  incorporation_availability: string;
  work_modality: string;
  schedule_availability: string;
  travel_availability: string;
  driver_license: string;
  technical_knowledge: string | null;
  languages: string | null;
  has_curriculum: boolean;
  work_experiences_count: number;
  evaluations_completed_count: number;
  status: RecordStatus;
  submitted_at: string | null;
  updated_at: string;
};

export type AnonymousCandidateDetail = AnonymousCandidate & {
  is_staff_view?: boolean;
  email?: string | null;
  phone?: string | null;
  national_id?: string | null;
  university_registration?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  reviewed_ppa?: string | null;
  relatives_in_company?: string;
  education_levels: EducationLevel[];
  courses: CourseTraining[];
  work_experiences: (Omit<WorkExperience, 'supervisor' | 'reference_phone'> & {
    supervisor?: string;
    phone?: string;
  })[];
  mobility: Mobility;
  evaluations: CandidateEvaluationItem[];
};

