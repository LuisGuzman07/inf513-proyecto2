export type EvaluationOption = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
/**
 * Response family of a version. Hábil answers one letter with a source key; Dominós answers
 * two halves; the 16 FP letters are captured without key or scoring.
 */
export type AnswerType =
  | 'single_choice'
  | 'single_choice_unscored'
  | 'two_halves';
/** Ordered pair as written in the source. `null` means that half was not answered. */
export type HalvesAnswer = { first: number | null; second: number | null };
export type ExerciseAnswer = EvaluationOption | HalvesAnswer;
export type HalfRange = { min: number; max: number };
export type InstrumentConformity = {
  reviewer_name: string;
  statement: string;
  recorded_at: string;
  institutional_approval: boolean;
};
export type InstrumentSummary = {
  id: string;
  name: string;
  version_label: string;
  package_date: string;
  answer_type: AnswerType;
  /** Letters offered by the version; the 16 FP offers A–C, Hábil A–H. */
  option_labels?: EvaluationOption[];
  scoring_enabled?: boolean;
  classified_area?: 'inteligencia' | 'habilidades_blandas' | 'personalidad' | 'habilidades_profesionales' | string;
  classified_area_label?: string;
  application_ready: boolean;
  application_blocked_reason: string | null;
  source_review_state: string;
  exercise_count: number;
  conformity: InstrumentConformity | null;
};
export type InstrumentDetail = InstrumentSummary & {
  instructions: string;
  example_text: string;
  example_image_url: string | null;
  option_labels: EvaluationOption[];
  exercises: {
    id: string;
    number: number;
    response_type: AnswerType;
    /** Text-only instruments carry the stem here; null when the exercise is an image. */
    text?: string | null;
    options: EvaluationOption[] | null;
    option_texts?: Record<string, string> | null;
    reconstructed_url: string | null;
    original_url: string | null;
    source_answer: ExerciseAnswer | null;
    answer_markdown: string;
    source_review_state: string;
    review_note: string | null;
  }[];
};
/**
 * Instrument data as the assigned-test views receive it. It carries no bank-only
 * flags: `application_ready` belongs to the staff bank summary, not to this payload.
 */
export type AssignmentInstrument = Pick<
  InstrumentSummary,
  | 'id'
  | 'name'
  | 'version_label'
  | 'answer_type'
  | 'scoring_enabled'
  | 'source_review_state'
  | 'exercise_count'
  | 'conformity'
  | 'classified_area'
  | 'classified_area_label'
>;
export type AssignmentSummary = {
  id: string;
  registration_id: string;
  version: number;
  status: 'assigned' | 'in_progress' | 'submitted';
  assigned_at: string;
  submitted_at: string | null;
  answer_type: AnswerType;
  scoring_enabled?: boolean;
  classified_area?: string;
  classified_area_label?: string;
  answered_count: number;
  unanswered_count: number;
  /** Exercises with exactly one half answered: neither absent nor complete. */
  partial_count: number;
  instrument: AssignmentInstrument;
};
export type SingleChoiceExercise = {
  id: string;
  number: number;
  image_url: string | null;
  text?: string | null;
  response_type: 'single_choice' | 'single_choice_unscored';
  options: EvaluationOption[];
  option_texts?: Record<string, string> | null;
};
export type TwoHalvesExercise = {
  id: string;
  number: number;
  image_url: string | null;
  text?: string | null;
  response_type: 'two_halves';
  halves: HalfRange;
};
export type EvaluationExercise = SingleChoiceExercise | TwoHalvesExercise;

export type McClellandDimension = {
  key: 'logro' | 'afiliacion' | 'poder';
  name: string;
  score: number;
  min: number;
  max: number;
  description: string;
};

export type McClellandResult = {
  model: 'mcclelland';
  dimensions: {
    logro: McClellandDimension;
    afiliacion: McClellandDimension;
    poder: McClellandDimension;
  };
  dominant: string;
  dominant_dimensions: string[];
  highest_score: number;
};

export type DominosDetailItem = {
  number: number;
  status: 'correct' | 'incorrect' | 'absent';
  given: string | null;
  correct: string;
};

export type DominosResult = {
  model: 'dominos';
  score: number;
  max_score: number;
  percentage: number;
  correct: number;
  incorrect: number;
  absent: number;
  scoring_rule: string;
  detail?: Record<string, DominosDetailItem>;
};

export type Fp16FactorResult = {
  factor: string;
  name: string;
  raw_score: number;
  max_score: number;
  sten: number;
  classification: 'Bajo' | 'Medio-Bajo' | 'Promedio' | 'Medio-Alto' | 'Alto';
  low_pole: string;
  high_pole: string;
};

export type Fp16Validity = {
  control_items: Record<number, string | null>;
  indecision_count: number;
  indecision_percentage: number;
  omissions_count: number;
  indecision_alert: string | null;
};

export type Fp16Result = {
  model: '16fp';
  form: 'Forma A' | 'Forma B';
  factors: Record<string, Fp16FactorResult>;
  validity: Fp16Validity;
  scoring_rule: string;
};

export type StandardScoringResult = {
  correct: number;
  incorrect: number;
  absent: number;
  score: number;
  max_score: number;
  scoring_rule: string;
};

export type SoftSkillsItemResult = {
  number: number;
  source_id: string;
  text: string;
  dimension: string;
  score: number | null;
};

export type SoftSkillsDimensionSummary = {
  key: string;
  name: string;
  items_count: number;
  answered_count: number;
  score_sum: number;
  max_score: number;
  average: number;
  percentage: number;
};

export type SoftSkillsResult = {
  model: 'habilidades_blandas';
  global_average: number;
  global_percentage: number;
  total_score: number;
  max_total_score: number;
  answered_count: number;
  total_items: number;
  dimensions: Record<string, SoftSkillsDimensionSummary>;
  items: SoftSkillsItemResult[];
  scoring_rule: string;
};

export type RawResult =
  | StandardScoringResult
  | McClellandResult
  | DominosResult
  | Fp16Result
  | SoftSkillsResult;

export type EvaluationAssignment = AssignmentSummary & {
  instructions: string;
  example_text: string;
  example_image_url: string | null;
  exercises: EvaluationExercise[];
  answers: Record<string, ExerciseAnswer | null>;
  registration_version?: number;
  raw_result?: RawResult | null;
};
export type StaffEvaluationAssignment = EvaluationAssignment;
