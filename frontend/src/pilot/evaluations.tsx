import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Empty,
  Flex,
  Modal,
  Radio,
  Select,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { isCancel } from 'axios';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { errorText, httpStatus } from './api';
import { usePilotSession } from './context';
import { evaluationsApi } from './evaluations-api';
import type {
  AssignmentSummary,
  EvaluationAssignment,
  EvaluationOption,
  ExerciseAnswer,
  HalvesAnswer,
  InstrumentSummary,
  RawResult,
  StaffEvaluationAssignment,
  TwoHalvesExercise,
} from './evaluations-types';
import type { RecordDetail } from './types';
import {
  DominosResultsView,
  Fp16ResultsView,
  PercentageResultsView,
  SoftSkillsResultsView,
  isDominosName,
  is16FpName,
  isSoftSkillsName,
} from './evaluations-results';
import './evaluations.css';

/** Present a stored answer as halves without inventing a missing half. */
function halves(answer: ExerciseAnswer | null | undefined): HalvesAnswer {
  return typeof answer === 'object' && answer !== null
    ? answer
    : { first: null, second: null };
}
/** Answered means at least one half carries a value; zero counts, null does not. */
function isAnswered(answer: ExerciseAnswer | null | undefined): boolean {
  if (answer === null || answer === undefined) return false;
  return typeof answer === 'string'
    ? true
    : answer.first !== null || answer.second !== null;
}
function isPartial(answer: ExerciseAnswer | null | undefined): boolean {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    (answer.first === null) !== (answer.second === null)
  );
}
function sameAnswer(
  left: ExerciseAnswer | null,
  right: ExerciseAnswer | null
): boolean {
  if (left === null || right === null) return left === right;
  if (typeof left === 'string' || typeof right === 'string')
    return left === right;
  return left.first === right.first && left.second === right.second;
}
function sourceAnswerText(answer: ExerciseAnswer | null): string {
  if (answer === null) return 'Sin clave importada';
  return typeof answer === 'string'
    ? answer
    : answer.first + ' – ' + answer.second;
}
/** Option list with the source wording beside each label when the item is textual. */
function optionChoices(exercise: {
  options: EvaluationOption[];
  option_texts?: Record<string, string> | null;
}) {
  const texts = exercise.option_texts ?? null;
  return texts
    ? exercise.options.map((value) => {
        const text = texts[value] ?? '';
        const label =
          text.startsWith(value + '.') || text.startsWith(value + ')')
            ? text
            : value + ') ' + text;
        return { value, label };
      })
    : exercise.options;
}

/** Letter span actually offered by a version, so the bank never announces a range it lacks. */
function optionRange(labels?: EvaluationOption[]): string {
  if (!labels || labels.length === 0) return 'A–H';
  return labels.length === 1
    ? labels[0]
    : labels[0] + '–' + labels[labels.length - 1];
}

/**
 * Vertical answer tile: the upper box holds the first digit of the Word pair and the
 * lower box the second. This is a CAPTURE device, not a claim about which physical end
 * of a tilted domino the digits belong to; the exercise image keeps its own orientation.
 */
function AnswerTile({
  exercise,
  value,
  disabled,
  helpId,
  onChange,
}: {
  exercise: TwoHalvesExercise;
  value: HalvesAnswer;
  disabled: boolean;
  helpId: string;
  onChange: (half: 'first' | 'second', next: number | null) => void;
}) {
  const options = Array.from(
    { length: exercise.halves.max - exercise.halves.min + 1 },
    (_, offset) => ({
      value: exercise.halves.min + offset,
      label: String(exercise.halves.min + offset),
    })
  );
  const boxes = [
    {
      half: 'first' as const,
      label: 'Casilla superior',
      hint: 'primera cifra del par',
    },
    {
      half: 'second' as const,
      label: 'Casilla inferior',
      hint: 'segunda cifra del par',
    },
  ];
  return (
    <div
      className="pilot-evaluations-tile"
      role="group"
      aria-label={'Ficha de respuesta del ejercicio ' + exercise.number}
    >
      {boxes.map((box) => (
        <div key={box.half} className="pilot-evaluations-tile-half">
          <label
            className="pilot-evaluations-tile-label"
            htmlFor={'half-' + exercise.id + '-' + box.half}
          >
            {box.label} · {box.hint}
          </label>
          <Select<number>
            id={'half-' + exercise.id + '-' + box.half}
            aria-label={
              box.label.replace('Casilla', 'Cifra') +
              ' del ejercicio ' +
              exercise.number
            }
            aria-describedby={helpId}
            placeholder="Sin responder"
            virtual={false}
            allowClear
            disabled={disabled}
            value={value[box.half]}
            onChange={(next) => onChange(box.half, next ?? null)}
            options={options}
          />
        </div>
      ))}
    </div>
  );
}

function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <Alert
      showIcon
      type="error"
      title={errorText(error)}
      action={retry ? <Button onClick={retry}>Reintentar</Button> : undefined}
    />
  );
}
function Surface({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="pilot-record-container">
      <Card>
        <div className="pilot-evaluations-stack">
          <Typography.Title level={1}>{title}</Typography.Title>
          {children}
        </div>
      </Card>
    </Container>
  );
}
function Provenance({
  instrument,
}: {
  instrument: Pick<
    InstrumentSummary,
    'version_label' | 'source_review_state' | 'conformity'
  >;
}) {
  return (
    <div>
      <Typography.Paragraph>
        Versión del paquete: {instrument.version_label}. No es una edición
        científica.
      </Typography.Paragraph>
      <Tag>
        Manifest:{' '}
        {instrument.source_review_state === 'pendiente_cotejo'
          ? 'Pendiente de cotejo'
          : instrument.source_review_state}
      </Tag>
      {instrument.conformity ? (
        <Alert
          type="info"
          showIcon
          title={
            'Conformidad de trabajo visual · ' +
            instrument.conformity.reviewer_name
          }
          description={
            <>
              <p>{instrument.conformity.statement}</p>
              <p>
                Registrada:{' '}
                {new Date(instrument.conformity.recorded_at).toLocaleString(
                  'es-BO'
                )}
                . No constituye aprobación institucional ni equivalencia
                psicométrica; no modifica el estado del manifest.
              </p>
            </>
          }
        />
      ) : (
        <Typography.Paragraph>
          Sin conformidad registrada. Esta versión no puede asignarse.
        </Typography.Paragraph>
      )}
    </div>
  );
}
export function PrivateEvaluationImage({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  const { session } = usePilotSession();
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<{ url: string; blob: string } | null>(
    null
  );
  const [failure, setFailure] = useState<unknown>(null);
  const [zoom, setZoom] = useState(false);
  const [actual, setActual] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setImage(null);
    setFailure(null);
    setZoom(false);
    void session
      .run((signal) => evaluationsApi.image(url, signal), controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ url, blob: objectUrl });
      })
      .catch((error: unknown) => {
        if (!isCancel(error) && !controller.signal.aborted) setFailure(error);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, session, attempt]);
  const src = image?.url === url ? image.blob : undefined;
  return (
    <figure className="pilot-evaluations-image">
      <figcaption>{label}</figcaption>
      {failure ? (
        <Failure error={failure} retry={() => setAttempt((n) => n + 1)} />
      ) : src ? (
        <>
          <img src={src} alt={label} />
          <Button
            onClick={() => {
              setActual(false);
              setZoom(true);
            }}
          >
            Ampliar {label.toLocaleLowerCase('es')}
          </Button>
        </>
      ) : (
        <div role="status">
          <Spin /> Cargando imagen privada…
        </div>
      )}
      <Modal
        open={zoom && Boolean(src)}
        title={label}
        footer={null}
        onCancel={() => setZoom(false)}
        destroyOnHidden
        width="90vw"
      >
        <Checkbox
          checked={actual}
          onChange={(event) => setActual(event.target.checked)}
        >
          Tamaño original (desplazable)
        </Checkbox>
        <div
          className={
            'pilot-evaluations-zoom' +
            (actual ? ' pilot-evaluations-zoom--actual' : '')
          }
        >
          <img src={src} alt={label + ' ampliada'} />
        </div>
      </Modal>
    </figure>
  );
}
export function InstrumentBankPage() {
  const { session } = usePilotSession();
  const query = useQuery({
    queryKey: session.key('instruments'),
    queryFn: ({ signal }) => session.run(evaluationsApi.instruments, signal),
  });
  return (
    <Surface title="Banco privado de instrumentos">
      <Typography.Paragraph>
        Material del piloto para personal habilitado. La conformidad visual y el
        cotejo de las fuentes se registran por separado.
      </Typography.Paragraph>
      {query.isPending ? (
        <Spin />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data.length ? (
        query.data.map((item) => (
          <div key={item.id} className="pilot-evaluations-item">
            <Typography.Title level={2}>{item.name}</Typography.Title>
            <p>
              {item.exercise_count} ejercicios · Paquete {item.package_date}
            </p>
            <Flex wrap gap={8}>
              <Tag>
                {item.answer_type === 'two_halves'
                  ? 'Respuesta de dos mitades (0–6)'
                  : 'Opción única ' +
                    optionRange(item.option_labels) +
                    (item.answer_type === 'single_choice_unscored'
                      ? ' · sin calificación'
                      : '')}
              </Tag>
              {item.application_ready ? null : (
                <Tag color="orange">No habilitada para aplicación</Tag>
              )}
            </Flex>
            <Provenance instrument={item} />
            <Link to={'/personal/instrumentos/' + item.id}>
              Revisar material de esta versión
            </Link>
          </div>
        ))
      ) : (
        <Empty description="No hay instrumentos importados." />
      )}
    </Surface>
  );
}
export function InstrumentDetailPage() {
  const { version = '' } = useParams();
  const { session } = usePilotSession();
  const [index, setIndex] = useState(0);
  const query = useQuery({
    queryKey: session.key('instrument', version),
    queryFn: ({ signal }) =>
      session.run(
        (request) => evaluationsApi.instrument(version, request),
        signal
      ),
  });
  const data = query.data;
  const exercise = data?.exercises[index];
  return (
    <Surface title={data?.name ?? 'Instrumento privado'}>
      <Link to="/personal/instrumentos">Volver al banco</Link>
      {query.isPending ? (
        <Spin />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : data ? (
        <>
          <Provenance instrument={data} />
          {data.application_ready ? null : (
            <Alert
              type="warning"
              showIcon
              title="Vista previa: versión no habilitada para aplicación"
              description={
                <>
                  <p>
                    {data.application_blocked_reason ??
                      'La versión no está habilitada para aplicación.'}
                  </p>
                  <p>
                    Podés revisar el material y el par de fuente con el personal
                    autorizado, pero esta versión no puede asignarse a titulares
                    mientras la definición siga pendiente.
                  </p>
                </>
              }
            />
          )}
          {data.application_ready && data.answer_type !== 'single_choice' ? (
            <Alert
              type="info"
              showIcon
              title="Habilitada para captura y envío, sin calificación automática"
              description={
                data.answer_type === 'two_halves'
                  ? 'El titular puede responder y enviar esta versión; el envío congela sus respuestas y no produce puntaje, aciertos ni errores. La orientación física de la clave no queda establecida por esta habilitación.'
                  : 'El titular elige una de las alternativas ofrecidas o deja la pregunta sin responder; el envío congela sus respuestas y no produce puntaje, aciertos ni errores. Esta versión no tiene clave importada.'
              }
            />
          ) : null}
          <p>
            Procedencia: paquete privado recibido, fecha {data.package_date}.
            {data.exercises.some(
              (exercise) => exercise.reconstructed_url || exercise.original_url
            )
              ? ' Reconstrucciones y originales conservados por versión.'
              : ' Reactivos textuales conservados con su procedencia documental.'}
          </p>
          <Typography.Paragraph className="pilot-evaluations-copy">
            {data.instructions}
          </Typography.Paragraph>
          <Collapse
            items={[
              {
                key: 'example',
                label: 'Ejemplo no puntuable',
                children: (
                  <>
                    <Typography.Paragraph className="pilot-evaluations-copy">
                      {data.example_text}
                    </Typography.Paragraph>
                    {data.example_image_url ? (
                      <PrivateEvaluationImage
                        url={data.example_image_url}
                        label="Ejemplo"
                      />
                    ) : null}
                  </>
                ),
              },
            ]}
          />
          {exercise ? (
            <>
              <Flex wrap gap={12} align="center">
                <Button
                  disabled={index === 0}
                  onClick={() => setIndex(index - 1)}
                >
                  Anterior
                </Button>
                <span>
                  Ejercicio {exercise.number} de {data.exercises.length}
                </span>
                <Button
                  disabled={index === data.exercises.length - 1}
                  onClick={() => setIndex(index + 1)}
                >
                  Siguiente
                </Button>
              </Flex>
              {exercise.original_url && exercise.reconstructed_url ? (
                <div className="pilot-evaluations-compare">
                  <PrivateEvaluationImage
                    key={exercise.original_url}
                    url={exercise.original_url}
                    label={'Original del ejercicio ' + exercise.number}
                  />
                  <PrivateEvaluationImage
                    key={exercise.reconstructed_url}
                    url={exercise.reconstructed_url}
                    label={'Reconstrucción del ejercicio ' + exercise.number}
                  />
                </div>
              ) : null}
              {exercise.text ? (
                <Typography.Paragraph className="pilot-evaluations-copy">
                  {exercise.text}
                </Typography.Paragraph>
              ) : null}
              {exercise.response_type !== 'two_halves' && exercise.options ? (
                <ul className="pilot-evaluations-option-list">
                  {optionChoices({
                    options: exercise.options,
                    option_texts: exercise.option_texts,
                  }).map((option) => (
                    <li
                      key={typeof option === 'string' ? option : option.value}
                    >
                      {typeof option === 'string' ? option : option.label}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Typography.Title level={2}>
                Respuesta fuente: {sourceAnswerText(exercise.source_answer)}
              </Typography.Title>
              {exercise.response_type === 'two_halves' ? (
                <Alert
                  type="info"
                  showIcon
                  title="Par ordenado tal como está escrito en la fuente"
                  description="Se conservan la primera y la segunda cifra en el orden del documento. La correspondencia con las mitades físicas de la ficha sigue pendiente de definición: esta vista no la resuelve, no la invierte y no se usa para calificar."
                />
              ) : null}
              <p>Estado fuente: {exercise.source_review_state}</p>
              {exercise.review_note ? <p>{exercise.review_note}</p> : null}
              <Collapse
                items={[
                  {
                    key: exercise.id,
                    label: 'Texto fuente de la respuesta (privado)',
                    children: (
                      <Typography.Paragraph className="pilot-evaluations-copy">
                        {exercise.answer_markdown}
                      </Typography.Paragraph>
                    ),
                  },
                ]}
              />
            </>
          ) : (
            <Empty description="Sin ejercicios." />
          )}
        </>
      ) : null}
    </Surface>
  );
}
const statusLabels = {
  assigned: 'Asignada',
  in_progress: 'En curso',
  submitted: 'Enviada',
};
function AssignmentList({ items }: { items: AssignmentSummary[] }) {
  return items.length ? (
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="pilot-evaluations-item pilot-evaluations-assignment"
        >
          <div>
            <Typography.Title level={3} style={{ marginBottom: 6 }}>
              {item.instrument.name}
            </Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {item.instrument.classified_area_label || item.classified_area_label ? (
                <Tag
                  color={
                    (item.instrument.classified_area || item.classified_area) === 'inteligencia'
                      ? 'blue'
                      : (item.instrument.classified_area || item.classified_area) === 'habilidades_blandas'
                      ? 'green'
                      : (item.instrument.classified_area || item.classified_area) === 'personalidad'
                      ? 'purple'
                      : 'gold'
                  }
                  style={{ fontWeight: 600 }}
                >
                  Área: {item.instrument.classified_area_label || item.classified_area_label}
                </Tag>
              ) : null}
              <Tag>{statusLabels[item.status]}</Tag>
              {item.status !== 'submitted' ? (
                <Tag
                  icon={<ClockCircleOutlined />}
                  color="cyan"
                  style={{ fontWeight: 600 }}
                >
                  Tiempo estimado: {Math.round(calculateTestTimeSeconds(item.instrument.exercise_count) / 60)} min ({item.instrument.exercise_count} preguntas)
                </Tag>
              ) : null}
            </div>
            <p>Versión aplicada: {item.instrument.version_label}</p>
            <p>Versión confirmada: {item.version}</p>
            <p>
              {item.answered_count} respuestas guardadas ·{' '}
              {item.unanswered_count} ausentes
            </p>
            {item.partial_count > 0 ? (
              <p>
                {item.partial_count} con una sola mitad registrada (parciales).
              </p>
            ) : null}
          </div>
          <Link
            className="pilot-evaluations-assignment-link"
            to={'/portal/pruebas/' + item.id}
          >
            {item.status === 'submitted'
              ? 'Ver confirmación de envío'
              : 'Abrir prueba'}
          </Link>
        </div>
      ))}
    </>
  ) : (
    <Empty description="Todavía no tenés pruebas asignadas." />
  );
}

/**
 * Calcula el tiempo total de un cuestionario en segundos basándose en
 * aproximadamente 40s a 1 min por pregunta (sin limitar la pregunta individual),
 * con auto-envío al agotarse el tiempo establecido.
 */
export function calculateTestTimeSeconds(exerciseCount: number): number {
  if (exerciseCount <= 0) return 10 * 60;
  if (exerciseCount <= 10) return 10 * 60; // 10 min (60s por pregunta)
  if (exerciseCount <= 15) return 12 * 60; // 12 min (48s por pregunta)
  if (exerciseCount <= 20) return 15 * 60; // 15 min (45s por pregunta)
  if (exerciseCount <= 25) return 18 * 60; // 18 min (~43s por pregunta)
  if (exerciseCount <= 28) return 21 * 60; // 21 min (45s por pregunta)
  if (exerciseCount <= 30) return 20 * 60; // 20 min exactos (40s por pregunta - regla solicitada)
  if (exerciseCount <= 48) return 32 * 60; // 32 min (40s por pregunta)
  if (exerciseCount <= 60) return 40 * 60; // 40 min (40s por pregunta)
  // Pruebas extensas (> 60 preguntas, ej. 16FP de 105 reactivos)
  return Math.ceil((exerciseCount * 30) / 60) * 60; // 53 min (~30s por pregunta)
}

export function formatTimeRemaining(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function isMcClellandName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes('mcclelland') || lower.includes('logro y liderazgo');
}

export function McClellandResultsView({
  assignment,
  result,
}: {
  assignment: EvaluationAssignment;
  result?: RawResult | null;
}) {
  const mcc =
    result && 'model' in result && result.model === 'mcclelland'
      ? result
      : null;

  // Compute dimensions from answers if not in result
  const dims = mcc?.dimensions ?? {
    logro: {
      key: 'logro' as const,
      name: 'Motivación de Logro',
      score: [1, 4, 7, 10, 13].reduce((sum, n) => {
        const ex = assignment.exercises.find((e) => e.number === n);
        const ans = ex ? assignment.answers[ex.id] : null;
        return sum + (ans && !isNaN(Number(ans)) ? Number(ans) : 0);
      }, 0),
      min: 5,
      max: 25,
      description:
        'Búsqueda de excelencia personal, superación de retos difíciles y orientación a metas exigentes con retroalimentación continua.',
    },
    afiliacion: {
      key: 'afiliacion' as const,
      name: 'Motivación de Afiliación',
      score: [3, 6, 9, 12, 15].reduce((sum, n) => {
        const ex = assignment.exercises.find((e) => e.number === n);
        const ans = ex ? assignment.answers[ex.id] : null;
        return sum + (ans && !isNaN(Number(ans)) ? Number(ans) : 0);
      }, 0),
      min: 5,
      max: 25,
      description:
        'Preferencia por relaciones interpersonales cercanas, cooperación armónica, empatía y sentido de pertenencia a equipos.',
    },
    poder: {
      key: 'poder' as const,
      name: 'Motivación de Poder',
      score: [2, 5, 8, 11, 14].reduce((sum, n) => {
        const ex = assignment.exercises.find((e) => e.number === n);
        const ans = ex ? assignment.answers[ex.id] : null;
        return sum + (ans && !isNaN(Number(ans)) ? Number(ans) : 0);
      }, 0),
      min: 5,
      max: 25,
      description:
        'Liderazgo, competencia, deseo de influir sobre personas y orientar la toma de decisiones organizacionales.',
    },
  };

  const highestScore =
    mcc?.highest_score ??
    Math.max(dims.logro.score, dims.afiliacion.score, dims.poder.score);

  const dominantTitle =
    mcc?.dominant ??
    ([
      dims.logro.score === highestScore ? 'Logro' : null,
      dims.afiliacion.score === highestScore ? 'Afiliación' : null,
      dims.poder.score === highestScore ? 'Poder' : null,
    ]
      .filter(Boolean)
      .join(' y ') || 'Equilibrado');

  // The 3 bars corresponding directly to the handwritten evaluation scheme:
  // Col 1: LOGRO (15), Col 2: AFILIACIÓN (17), Col 3: PODER (12)
  const barItems = [
    {
      key: 'logro',
      label: 'LOGRO',
      data: dims.logro,
      isDominant: dims.logro.score === highestScore && highestScore > 0,
    },
    {
      key: 'afiliacion',
      label: 'AFILIACIÓN',
      data: dims.afiliacion,
      isDominant: dims.afiliacion.score === highestScore && highestScore > 0,
    },
    {
      key: 'poder',
      label: 'PODER',
      data: dims.poder,
      isDominant: dims.poder.score === highestScore && highestScore > 0,
    },
  ];

  return (
    <div className="mcclelland-results-wrapper">
      <Alert
        type="success"
        showIcon
        message="Test de Logro y Liderazgo Completado (1/1 intento)"
        description="El perfil motivacional ha sido evaluado y registrado en el expediente del candidato. Este test solo puede realizarse una vez por postulante."
      />

      <div className="mcclelland-chart-card">
        <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 4 }}>
          Gráfica Comparativa de Motivación (McClelland)
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          Puntajes calculados de 5 a 25 según respuestas sinceras en escala Likert. La barra más grande indica el motivador dominante.
        </Typography.Paragraph>

        <div className="mcclelland-chart-area">
          {barItems.map((bar) => {
            const heightPercent = Math.max(14, Math.round((bar.data.score / bar.data.max) * 100));
            return (
              <div key={bar.key} className="mcclelland-bar-col">
                <div className="mcclelland-bar-header">
                  {bar.isDominant ? (
                    <span className="mcclelland-bar-badge">⭐ Dominante</span>
                  ) : null}
                  <span className="mcclelland-bar-value">
                    {bar.data.score} / {bar.data.max}
                  </span>
                </div>
                <div className="mcclelland-bar-track">
                  <div
                    className={
                      'mcclelland-bar-fill ' +
                      (bar.isDominant
                        ? 'mcclelland-bar-fill--dominant'
                        : 'mcclelland-bar-fill--normal')
                    }
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={
                    'mcclelland-bar-label ' +
                    (bar.isDominant ? 'mcclelland-bar-label--dominant' : '')
                  }
                >
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mcclelland-dominant-box">
          <Typography.Title level={5} style={{ color: '#047857', marginTop: 0 }}>
            ⭐ Motivador Predominante: {dominantTitle} ({highestScore} pts)
          </Typography.Title>
          <Typography.Paragraph style={{ margin: 0 }}>
            {dominantTitle.includes('Logro') && (
              <span>
                <strong>Orientación al Logro:</strong> Destaca por fijarse metas desafiantes, perseverar ante dificultades, asumir responsabilidad personal sobre resultados y buscar excelencia continua en su desempeño.<br />
              </span>
            )}
            {dominantTitle.includes('Afiliación') && (
              <span>
                <strong>Orientación a la Afiliación:</strong> Destaca por su capacidad para generar relaciones laborales armónicas, trabajo colaborativo en equipo, empatía interpersonal y preferencia por entornos cooperativos.<br />
              </span>
            )}
            {dominantTitle.includes('Poder') && (
              <span>
                <strong>Orientación al Poder y Liderazgo:</strong> Destaca por su iniciativa de liderazgo, capacidad para influir e inspirar a otros, orientar la toma de decisiones estratégicas y asumir la dirección de proyectos.
              </span>
            )}
          </Typography.Paragraph>
        </div>

        <div className="mcclelland-dimensions-grid">
          {barItems.map((bar) => (
            <div
              key={bar.key}
              className={
                'mcclelland-dimension-card ' +
                (bar.isDominant ? 'mcclelland-dimension-card--dominant' : '')
              }
            >
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {bar.data.name}
              </Typography.Title>
              <Tag color={bar.isDominant ? 'green' : 'default'} style={{ marginBottom: 8 }}>
                Puntaje: {bar.data.score} / {bar.data.max} pts
              </Tag>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                {bar.data.description}
              </Typography.Paragraph>
            </div>
          ))}
        </div>
      </div>

      <Collapse
        items={[
          {
            key: 'responses-detail',
            label: 'Ver detalle de las 15 respuestas registradas',
            children: (
              <dl className="pilot-evaluations-captured">
                {assignment.exercises.map((exercise) => {
                  const ans = assignment.answers[exercise.id];
                  const optText =
                    ans &&
                    typeof ans === 'string' &&
                    exercise.response_type !== 'two_halves'
                      ? exercise.option_texts?.[ans]
                      : null;
                  let dimension = 'Logro';
                  if ([2, 5, 8, 11, 14].includes(exercise.number))
                    dimension = 'Poder';
                  if ([3, 6, 9, 12, 15].includes(exercise.number))
                    dimension = 'Afiliación';
                  const displayAnswer = typeof ans === 'string' ? ans : 'Sin responder';
                  return (
                    <div key={exercise.id}>
                      <dt>
                        Ítem {exercise.number} · Dimensión {dimension}:{' '}
                        <em>{exercise.text}</em>
                      </dt>
                      <dd>
                        Respuesta:{' '}
                        <strong>
                          {displayAnswer}
                          {optText ? ` — ${optText}` : ''}
                        </strong>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ),
          },
        ]}
      />
    </div>
  );
}

function McClellandDirectAccessCard({
  existing,
  refetch,
}: {
  existing?: AssignmentSummary;
  refetch: () => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSubmitted = existing?.status === 'submitted';
  const isInProgress = existing && !isSubmitted;

  const handleStart = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await evaluationsApi.autoAssignLogro();
      refetch();
      navigate('/portal/pruebas/' + res.data.id);
    } catch (err) {
      setErrorMsg(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mcclelland-direct-card">
      <Flex justify="space-between" align="center" wrap gap={12}>
        <div>
          <Flex align="center" gap={8}>
            <Typography.Title level={4} style={{ margin: 0, color: '#166534' }}>
              🎯 Test de Logro y Liderazgo (Motivación de McClelland)
            </Typography.Title>
            <Tag color={isSubmitted ? 'green' : isInProgress ? 'processing' : 'blue'}>
              {isSubmitted
                ? 'Completado (1/1 intento)'
                : isInProgress
                ? 'En progreso'
                : 'Acceso directo (1 intento)'}
            </Tag>
          </Flex>
          <Typography.Paragraph style={{ margin: '8px 0 0', maxWidth: 700, color: '#374151' }}>
            {isSubmitted
              ? 'Ya has completado este test vocacional. Podés consultar tu gráfica de barras comparativa (Logro, Afiliación, Poder) y tus motivadores dominantes en cualquier momento.'
              : isInProgress
              ? `Tenés este test iniciado (${existing.answered_count} respuestas guardadas). Podés continuar respondiendo y confirmar tu envío final.`
              : 'Test psicométrico de autopercepción vocacional y liderazgo. Habilitado para ser realizado 1 sola vez de forma directa por cada candidato, sin necesidad de asignación previa.'}
          </Typography.Paragraph>
          {errorMsg ? (
            <Alert type="error" message={errorMsg} showIcon style={{ marginTop: 8 }} />
          ) : null}
        </div>
        <div>
          {isSubmitted ? (
            <Button
              type="primary"
              style={{ background: '#15803d', borderColor: '#15803d' }}
              onClick={() => navigate('/portal/pruebas/' + existing.id)}
            >
              Ver mis resultados y gráfica
            </Button>
          ) : isInProgress ? (
            <Button
              type="primary"
              onClick={() => navigate('/portal/pruebas/' + existing.id)}
            >
              Continuar test ({existing.answered_count}/15)
            </Button>
          ) : (
            <Button
              type="primary"
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              loading={loading}
              onClick={() => void handleStart()}
            >
              Iniciar Test de Logro y Liderazgo
            </Button>
          )}
        </div>
      </Flex>
    </Card>
  );
}

export function EvaluationsPage() {
  const { session } = usePilotSession();
  const query = useQuery({
    queryKey: session.key('evaluations'),
    queryFn: ({ signal }) => session.run(evaluationsApi.mine, signal),
  });

  const mcclellandAssignment = query.data?.find((item) =>
    isMcClellandName(item.instrument.name)
  );

  return (
    <Surface title="Mis pruebas">
      <Typography.Paragraph>
        Consultá las instrucciones y las respuestas guardadas de cada prueba
        asignada. Abrir una prueba no modifica su estado.
      </Typography.Paragraph>

      <McClellandDirectAccessCard
        existing={mcclellandAssignment}
        refetch={() => void query.refetch()}
      />

      <Typography.Title level={4} style={{ marginTop: 24, marginBottom: 12 }}>
        Bandeja de pruebas asignadas
      </Typography.Title>
      {query.isPending ? (
        <Spin />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <AssignmentList items={query.data} />
      )}
    </Surface>
  );
}
export function EvaluationPage() {
  const { assignment = '' } = useParams();
  const { session } = usePilotSession();
  const query = useQuery({
    queryKey: session.key('evaluation', assignment),
    queryFn: ({ signal }) =>
      session.run(
        (request) => evaluationsApi.assignment(assignment, request),
        signal
      ),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
  return (
    <Surface title={query.data?.instrument.name ?? 'Prueba asignada'}>
      {query.isPending || (!query.isFetchedAfterMount && query.isFetching) ? (
        <Spin />
      ) : !query.data ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          {query.isError ? (
            <Failure error={query.error} retry={() => void query.refetch()} />
          ) : null}
          <EvaluationRunner key={assignment} initial={query.data} />
        </>
      )}
    </Surface>
  );
}

function EvaluationRunner({ initial }: { initial: EvaluationAssignment }) {
  const { session } = usePilotSession();
  const [data, setData] = useState(initial);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<ExerciseAnswer | null>(
    initial.answers[initial.exercises[0]?.id] ?? null
  );
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [acceptAbsent, setAcceptAbsent] = useState(false);
  const [reloadOpen, setReloadOpen] = useState(false);
  const exerciseHeading = useRef<HTMLHeadingElement | null>(null);
  const focusRequested = useRef(false);
  const exercise = data.exercises[index];
  const dirty =
    data.status !== 'submitted' &&
    Boolean(exercise) &&
    !sameAnswer(choice, data.answers[exercise.id] ?? null);
  const unsaved = useRef(false);
  unsaved.current = dirty;
  const blocker = useBlocker(() => unsaved.current || locked.current);

  // Temporizador total del cuestionario y auto-envío
  const totalDurationSec = useMemo(
    () => calculateTestTimeSeconds(data.exercises.length),
    [data.exercises.length]
  );
  const storageKey = `eval_deadline_${data.id}`;

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (data.status === 'submitted') return 0;
    const stored = localStorage.getItem(storageKey);
    const deadline = stored ? Number(stored) : null;
    if (deadline && !isNaN(deadline)) {
      return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    }
    const initialDeadline = Date.now() + totalDurationSec * 1000;
    localStorage.setItem(storageKey, String(initialDeadline));
    return totalDurationSec;
  });

  const autoSubmitting = useRef(false);

  useEffect(() => {
    if (data.status === 'submitted') {
      localStorage.removeItem(storageKey);
      return;
    }

    const interval = setInterval(() => {
      const stored = localStorage.getItem(storageKey);
      let deadline = stored ? Number(stored) : null;
      if (!deadline || isNaN(deadline)) {
        deadline = Date.now() + totalDurationSec * 1000;
        localStorage.setItem(storageKey, String(deadline));
      }
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!autoSubmitting.current && data.status !== 'submitted') {
          autoSubmitting.current = true;
          void triggerAutoSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data.id, data.status, totalDurationSec]);

  async function triggerAutoSubmit() {
    if (data.status === 'submitted') return;
    setBusy(true);
    setError(null);
    try {
      if (dirty && exercise) {
        try {
          await session.run((signal) =>
            evaluationsApi.save(
              data.id,
              data.version,
              { [exercise.id]: choice },
              signal
            )
          );
        } catch {
          // Continuar con el envío
        }
      }
      const submitted = await session.run((signal) =>
        evaluationsApi.submit(data.id, data.version, true, signal)
      );
      setData(submitted);
      setSubmitOpen(false);
      localStorage.removeItem(storageKey);
      unsaved.current = false;
      session.client.setQueryData(session.key('evaluation', data.id), submitted);
      void session.client.invalidateQueries({
        queryKey: session.key('evaluations'),
      });
    } catch (failure) {
      if (!isCancel(failure)) setError(failure);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (
      busy ||
      dirty ||
      submitOpen ||
      reloadOpen ||
      initial.version <= data.version
    ) {
      return;
    }
    setData(initial);
    setChoice(initial.answers[initial.exercises[index]?.id] ?? null);
    setConfirmed(false);
  }, [initial, index, busy, dirty, submitOpen, reloadOpen, data]);
  useEffect(() => {
    if (focusRequested.current && !busy && !submitOpen) {
      exerciseHeading.current?.focus();
      focusRequested.current = false;
    }
  }, [index, busy, submitOpen]);
  useEffect(() => {
    if (data.status === 'submitted' && blocker.state === 'blocked')
      blocker.proceed();
  }, [data.status, blocker]);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    const warn = (event: BeforeUnloadEvent) => {
      if (unsaved.current || locked.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      controller.abort();
      window.removeEventListener('beforeunload', warn);
    };
  }, []);
  function begin() {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    return true;
  }
  function finish() {
    locked.current = false;
    if (!lifetime.current?.signal.aborted) setBusy(false);
  }
  /** One half changes at a time; the other keeps whatever the server or the user set. */
  function setHalf(half: 'first' | 'second', value: number | null) {
    setChoice({ ...halves(choice), [half]: value });
    setConfirmed(false);
  }
  async function persist(): Promise<EvaluationAssignment> {
    if (!dirty) return data;
    const saved = await session.run(
      (signal) =>
        evaluationsApi.save(
          data.id,
          data.version,
          { [exercise.id]: choice },
          signal
        ),
      lifetime.current?.signal
    );
    setData(saved);
    setChoice(saved.answers[exercise.id] ?? null);
    setConfirmed(true);
    unsaved.current = false;
    session.client.setQueryData(session.key('evaluation', data.id), saved);
    void session.client.invalidateQueries({
      queryKey: session.key('evaluations'),
    });
    return saved;
  }
  async function saveAndGo(next?: number, leave = false, submit = false) {
    if (!begin()) return;
    try {
      const saved = await persist();
      if (next !== undefined) {
        focusRequested.current = true;
        setIndex(next);
        setChoice(saved.answers[saved.exercises[next].id] ?? null);
        setConfirmed(false);
      }
      if (submit) {
        setAcceptAbsent(false);
        setSubmitOpen(true);
      }
      if (leave && blocker.state === 'blocked') blocker.proceed();
    } catch (failure) {
      if (!isCancel(failure)) setError(failure);
    } finally {
      finish();
    }
  }
  async function send() {
    if (!begin()) return;
    try {
      const submitted = await session.run(
        (signal) =>
          evaluationsApi.submit(data.id, data.version, acceptAbsent, signal),
        lifetime.current?.signal
      );
      setData(submitted);
      setSubmitOpen(false);
      localStorage.removeItem(storageKey);
      unsaved.current = false;
      session.client.setQueryData(
        session.key('evaluation', data.id),
        submitted
      );
      void session.client.invalidateQueries({
        queryKey: session.key('evaluations'),
      });
    } catch (failure) {
      if (!isCancel(failure)) setError(failure);
    } finally {
      finish();
    }
  }
  async function reload() {
    if (!begin()) return;
    try {
      const current = await session.run(
        (signal) => evaluationsApi.assignment(data.id, signal),
        lifetime.current?.signal
      );
      if (current.version < data.version) {
        throw new Error(
          'La versión recibida es anterior a la confirmada. Reintentá recuperar.'
        );
      }
      setData(current);
      setChoice(current.answers[current.exercises[index].id] ?? null);
      setConfirmed(false);
      setReloadOpen(false);
      unsaved.current = false;
      session.client.setQueryData(session.key('evaluation', data.id), current);
      void session.client.invalidateQueries({
        queryKey: session.key('evaluations'),
      });
    } catch (failure) {
      if (!isCancel(failure)) setError(failure);
    } finally {
      finish();
    }
  }
  if (data.status === 'submitted') {
    if (isMcClellandName(data.instrument.name)) {
      return (
        <>
          <Link to="/portal/pruebas">Volver a mis pruebas</Link>
          <McClellandResultsView assignment={data} result={data.raw_result} />
        </>
      );
    }
    if (
      isDominosName(data.instrument.name) &&
      data.raw_result &&
      'model' in data.raw_result &&
      data.raw_result.model === 'dominos'
    ) {
      return (
        <>
          <Link to="/portal/pruebas">Volver a mis pruebas</Link>
          <DominosResultsView assignment={data} result={data.raw_result} />
        </>
      );
    }
    if (
      is16FpName(data.instrument.name) &&
      data.raw_result &&
      'model' in data.raw_result &&
      data.raw_result.model === '16fp'
    ) {
      return (
        <>
          <Link to="/portal/pruebas">Volver a mis pruebas</Link>
          <Fp16ResultsView assignment={data} result={data.raw_result} />
        </>
      );
    }
    if (
      isSoftSkillsName(data.instrument.name) &&
      data.raw_result &&
      'model' in data.raw_result &&
      data.raw_result.model === 'habilidades_blandas'
    ) {
      return (
        <>
          <Link to="/portal/pruebas">Volver a mis pruebas</Link>
          <SoftSkillsResultsView assignment={data} result={data.raw_result} />
        </>
      );
    }
    if (
      data.raw_result &&
      'correct' in data.raw_result &&
      'max_score' in data.raw_result &&
      !('detail' in data.raw_result)
    ) {
      return (
        <>
          <Link to="/portal/pruebas">Volver a mis pruebas</Link>
          <PercentageResultsView assignment={data} result={data.raw_result} />
        </>
      );
    }
    return (
      <>
        <Alert
          type="success"
          showIcon
          title="Envío confirmado"
          description="Las respuestas quedaron congeladas y ya no se pueden modificar."
        />
        <Tag>{statusLabels[data.status]}</Tag>
        <p>Versión confirmada: {data.version}</p>
        <p>
          Enviada:{' '}
          {data.submitted_at
            ? new Date(data.submitted_at).toLocaleString('es-BO')
            : 'Confirmada por el servidor'}
        </p>
        <p>
          {data.answered_count} respuestas · {data.unanswered_count} ausentes
        </p>
        {data.partial_count > 0 ? (
          <p>
            {data.partial_count} quedaron con una sola mitad registrada. Se
            conservaron tal como se enviaron.
          </p>
        ) : null}
        <p>Versión aplicada: {data.instrument.version_label}</p>
        {data.scoring_enabled === false ? (
          <p>
            El envío se registró sin calificación automática: esta versión no
            produce puntaje ni aciertos.
          </p>
        ) : null}
        <Link to="/portal/pruebas">Volver a mis pruebas</Link>
      </>
    );
  }
  return (
    <>
      <Link to="/portal/pruebas">Volver a mis pruebas</Link>
      <div className="pilot-evaluations-context">
        <div>
          <p>Versión aplicada: {data.instrument.version_label}</p>
          <p>Versión confirmada: {data.version}</p>
        </div>
        <Tag>{statusLabels[data.status]}</Tag>
      </div>

      {/* Temporizador Regresivo del Cuestionario con Auto-Envío */}
      <div
        className={`pilot-evaluations-timer-card ${
          timeLeft <= 60
            ? 'pilot-evaluations-timer-card--urgent'
            : timeLeft <= 300
            ? 'pilot-evaluations-timer-card--warning'
            : ''
        }`}
      >
        <div className="pilot-evaluations-timer-main">
          <ClockCircleOutlined className="pilot-evaluations-timer-icon" />
          <div className="pilot-evaluations-timer-info">
            <span className="pilot-evaluations-timer-label">Tiempo Restante</span>
            <span className="pilot-evaluations-timer-digits">
              {formatTimeRemaining(timeLeft)}
            </span>
          </div>
        </div>
        <div className="pilot-evaluations-timer-meta">
          <Tag
            color={
              timeLeft <= 60 ? 'red' : timeLeft <= 300 ? 'orange' : 'blue'
            }
            style={{ fontWeight: 600, fontSize: 13, padding: '2px 10px' }}
          >
            Duración asignada: {Math.round(totalDurationSec / 60)} min ({data.exercises.length} preguntas)
          </Tag>
          <span className="pilot-evaluations-timer-desc">
            {timeLeft <= 60
              ? '⚠️ ¡Atención! El tiempo está por finalizar. Al llegar a 00:00 se guardará y enviará automáticamente.'
              : 'El cuestionario cuenta con tiempo límite global. Al agotarse se enviará automáticamente con las respuestas guardadas.'}
          </span>
        </div>
      </div>

      {timeLeft === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Tiempo límite alcanzado"
          description="El tiempo asignado a esta prueba ha concluido. Guardando y enviando automáticamente..."
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Collapse
        defaultActiveKey={['instructions']}
        items={[
          {
            key: 'instructions',
            label: 'Instrucciones y ejemplo no puntuable',
            children: (
              <>
                <p className="pilot-evaluations-copy">
                  {data.answer_type === 'two_halves'
                    ? 'Leé las instrucciones y el ejemplo antes de responder. En cada ejercicio registrá un valor de 0 a 6 en cada mitad de la ficha: cero es una respuesta válida y «Sin responder» deja la mitad vacía. Ninguna mitad viene completada. Podés guardar y revisar tus respuestas antes del envío definitivo. Al cambiar de ejercicio se guardan primero tus cambios; si falla el guardado, tus cifras permanecen en el ejercicio actual.'
                    : data.answer_type === 'single_choice_unscored'
                      ? 'Leé las instrucciones antes de responder. Cada pregunta admite una de las tres alternativas o quedar sin responder; ninguna opción viene preseleccionada. Esta versión no tiene calificación automática: el sistema conserva lo que respondas y no calcula aciertos ni errores. Al cambiar de pregunta se guardan primero tus cambios; si falla el guardado, tu elección permanece en la pregunta actual.'
                      : 'Leé las instrucciones y el ejemplo antes de responder. Elegí una alternativa por ejercicio; ninguna viene seleccionada. Podés guardar y revisar tus respuestas antes del envío definitivo. Al cambiar de ejercicio se guardan primero tus cambios; si falla el guardado, tu elección permanece en el ejercicio actual.'}
                </p>
                <Typography.Paragraph className="pilot-evaluations-copy">
                  {data.instructions}
                </Typography.Paragraph>
                <Typography.Paragraph className="pilot-evaluations-copy">
                  {data.example_text}
                </Typography.Paragraph>
                {data.example_image_url ? (
                  <PrivateEvaluationImage
                    url={data.example_image_url}
                    label="Ejemplo no puntuable"
                  />
                ) : null}
                {data.scoring_enabled === false ? (
                  <Alert
                    type="info"
                    showIcon
                    title={
                      isMcClellandName(data.instrument.name)
                        ? 'Evaluación psicométrica vocacional (Motivación de McClelland)'
                        : 'Captura y envío sin calificación automática'
                    }
                    description={
                      isMcClellandName(data.instrument.name)
                        ? 'Este test evalúa tus tres motivadores principales: Logro, Afiliación y Poder. Al confirmar el envío podrás ver tu gráfica comparativa y tu motivador dominante.'
                        : data.answer_type === 'two_halves'
                        ? 'Esta versión registra tus dos cifras por ficha y congela el envío. No produce puntaje, aciertos ni errores: la regla de corrección todavía no está definida.'
                        : 'Esta versión registra tu elección por pregunta y congela el envío. No produce puntaje, aciertos ni errores: la corrección y los baremos todavía no están definidos.'
                    }
                  />
                ) : null}
              </>
            ),
          },
        ]}
      />
      <p>
        {data.answered_count} de {data.instrument.exercise_count} respuestas
        guardadas · {data.unanswered_count} ausentes
      </p>
      {data.partial_count > 0 ? (
        <p className="pilot-evaluations-partial" role="status">
          {data.partial_count} con una sola mitad registrada: no cuentan como
          ausentes ni como completas.
        </p>
      ) : null}
      {error && !submitOpen ? (
        <>
          <Failure error={error} />
          {httpStatus(error) === 409 ? (
            <Alert
              type="warning"
              title="La versión cambió en el servidor. Tu elección local se conserva."
              description="Recuperar la versión actual reemplazará tu elección sin guardar."
              action={
                <Button disabled={busy} onClick={() => setReloadOpen(true)}>
                  Recuperar versión del servidor
                </Button>
              }
            />
          ) : (
            <p>
              Tu elección sigue aquí. Reintentá guardar o enviar cuando se
              restablezca la conexión.
            </p>
          )}
        </>
      ) : null}
      <div className="pilot-evaluations-player">
        <nav className="pilot-evaluations-map" aria-label="Mapa de ejercicios">
          <h2>Ejercicios</h2>
          <p>
            {data.answered_count} guardadas · {data.unanswered_count} pendientes
          </p>
          <div className="pilot-evaluations-map-grid">
            {data.exercises.map((item, itemIndex) => {
              const answer = data.answers[item.id] ?? null;
              const partial = isPartial(answer);
              const saved = isAnswered(answer);
              const local = itemIndex === index && dirty;
              const state = partial
                ? 'Parcial: falta una mitad'
                : saved
                  ? 'Respuesta guardada'
                  : 'Pendiente';
              return (
                <Button
                  key={item.id}
                  className={[
                    saved ? 'pilot-evaluations-map-saved' : '',
                    partial ? 'pilot-evaluations-map-partial' : '',
                    local ? 'pilot-evaluations-map-dirty' : '',
                  ].join(' ')}
                  type={itemIndex === index ? 'primary' : 'default'}
                  aria-current={itemIndex === index ? 'step' : undefined}
                  aria-label={
                    'Ejercicio ' +
                    item.number +
                    ' · ' +
                    state +
                    (local ? ' · Cambios sin guardar' : '')
                  }
                  title={
                    partial
                      ? 'Una sola mitad registrada en el servidor'
                      : saved
                        ? 'Respuesta guardada en el servidor'
                        : 'Respuesta pendiente'
                  }
                  disabled={busy || submitOpen}
                  onClick={() => {
                    if (itemIndex !== index) void saveAndGo(itemIndex);
                  }}
                >
                  {item.number}
                </Button>
              );
            })}
          </div>
          <ul className="pilot-evaluations-map-legend">
            <li>
              <span className="pilot-evaluations-key-current" />
              Actual: {exercise?.number}
            </li>
            <li>
              <span className="pilot-evaluations-key-saved" />
              Respuesta guardada
            </li>
            {data.answer_type === 'two_halves' ? (
              <li>
                <span className="pilot-evaluations-key-partial" />
                Parcial: una sola mitad
              </li>
            ) : null}
            <li>
              <span className="pilot-evaluations-key-pending" />
              Pendiente
            </li>
          </ul>
          <p>
            Guardada significa registrada en el servidor; no indica una
            calificación.
          </p>
          {dirty ? (
            <p className="pilot-evaluations-local">
              El ejercicio actual tiene cambios sin guardar.
            </p>
          ) : null}
        </nav>
        <div className="pilot-evaluations-question" aria-busy={busy}>
          {exercise ? (
            <>
              <h2
                ref={exerciseHeading}
                tabIndex={-1}
                className="pilot-evaluations-question-title"
              >
                Ejercicio {exercise.number} de {data.exercises.length}
              </h2>
              {exercise.text ? (
                <p className="pilot-evaluations-stem">{exercise.text}</p>
              ) : null}
              {exercise.image_url ? (
                <PrivateEvaluationImage
                  key={exercise.image_url}
                  url={exercise.image_url}
                  label={
                    'Ejercicio ' +
                    exercise.number +
                    (exercise.response_type === 'two_halves'
                      ? ' completo'
                      : ' completo con alternativas')
                  }
                />
              ) : null}
              {exercise.response_type === 'two_halves' ? (
                <fieldset
                  className="pilot-evaluations-fieldset"
                  disabled={busy || submitOpen}
                >
                  <legend>Ficha de respuesta</legend>
                  <p id={'halves-help-' + exercise.id}>
                    Observá los ejemplos A y B resueltos de la fuente: la ficha
                    faltante se completa con dos valores. En esta ficha de
                    captura, arriba se registra la primera cifra del par y abajo
                    la segunda. Cada casilla admite de 0 a 6; cero es válido y
                    «Sin responder» deja la casilla vacía.
                  </p>
                  <AnswerTile
                    exercise={exercise}
                    value={halves(choice)}
                    disabled={busy || submitOpen}
                    helpId={'halves-help-' + exercise.id}
                    onChange={setHalf}
                  />
                  <p>
                    La ficha de captura se muestra en vertical; la imagen del
                    ejercicio conserva su orientación original. La primera cifra
                    es la que aparece primero en el par de la fuente. Qué
                    extremo físico de una ficha inclinada representa cada
                    casilla no está establecido por las fuentes y no se deduce
                    acá.
                  </p>
                </fieldset>
              ) : (
                <fieldset
                  className="pilot-evaluations-fieldset"
                  disabled={busy || submitOpen}
                >
                  <legend>Elegí una alternativa</legend>
                  <Radio.Group
                    className="pilot-evaluations-options"
                    name={'answer-' + exercise.id}
                    value={typeof choice === 'string' ? choice : null}
                    disabled={busy || submitOpen}
                    onChange={(event) => {
                      setChoice(event.target.value as EvaluationOption);
                      setConfirmed(false);
                    }}
                    options={optionChoices(exercise)}
                  />
                </fieldset>
              )}
              <Flex
                className="pilot-evaluations-actions"
                gap={12}
                wrap
                align="center"
              >
                <Button
                  disabled={busy || submitOpen || !isAnswered(choice)}
                  onClick={() => {
                    setChoice(
                      exercise.response_type === 'two_halves'
                        ? { first: null, second: null }
                        : null
                    );
                    setConfirmed(false);
                  }}
                >
                  Quitar respuesta
                </Button>
                <Button
                  disabled={busy || submitOpen || !dirty}
                  onClick={() => void saveAndGo()}
                >
                  Guardar respuesta
                </Button>
                <span role="status" aria-live="polite">
                  {busy
                    ? 'Guardando…'
                    : dirty
                      ? 'Sin guardar'
                      : error
                        ? 'No se pudo confirmar la operación. Reintentá.'
                        : confirmed
                          ? 'Guardado confirmado'
                          : 'Sin cambios pendientes (datos del servidor)'}
                </span>
              </Flex>
              <Flex className="pilot-evaluations-actions" gap={12} wrap>
                <Button
                  disabled={busy || submitOpen || index === 0}
                  onClick={() => void saveAndGo(index - 1)}
                >
                  Anterior
                </Button>
                <Button
                  disabled={
                    busy || submitOpen || index === data.exercises.length - 1
                  }
                  onClick={() => void saveAndGo(index + 1)}
                >
                  Siguiente
                </Button>
              </Flex>
            </>
          ) : null}
          <Button
            type="primary"
            disabled={busy || submitOpen}
            onClick={() => void saveAndGo(undefined, false, true)}
          >
            Revisar y enviar prueba
          </Button>
        </div>
      </div>
      <Modal
        open={submitOpen}
        focusable={{ focusTriggerAfterClose: false }}
        afterClose={() => {
          if (data.status !== 'submitted') exerciseHeading.current?.focus();
        }}
        title="Enviar prueba definitivamente"
        okText="Confirmar envío"
        cancelText="Seguir respondiendo"
        confirmLoading={busy}
        okButtonProps={{
          disabled: busy || (data.unanswered_count > 0 && !acceptAbsent),
        }}
        cancelButtonProps={{ disabled: busy }}
        closable={!busy}
        mask={{ closable: !busy }}
        onCancel={() => {
          if (!busy) setSubmitOpen(false);
        }}
        onOk={() => void send()}
      >
        <p>
          {data.answered_count} respuestas guardadas y {data.unanswered_count}{' '}
          ausentes.
        </p>
        {data.partial_count > 0 ? (
          <p>
            {data.partial_count} de esas respuestas registran una sola mitad:
            quedan guardadas como parciales y no se envían como completas.
          </p>
        ) : null}
        <p>
          Versión aplicada: {data.instrument.version_label}. Después del envío
          no podrás cambiar las respuestas.
        </p>
        {data.unanswered_count > 0 ? (
          <nav
            aria-label="Revisar ejercicios pendientes"
            className="pilot-evaluations-summary"
          >
            <p>Podés volver a estos ejercicios antes de confirmar:</p>
            <div className="pilot-evaluations-summary-grid">
              {data.exercises.map((item, itemIndex) =>
                isAnswered(data.answers[item.id]) ? null : (
                  <Button
                    key={item.id}
                    aria-label={'Revisar ejercicio ' + item.number}
                    disabled={busy}
                    onClick={() => {
                      setSubmitOpen(false);
                      void saveAndGo(itemIndex);
                    }}
                  >
                    {item.number}
                  </Button>
                )
              )}
            </div>
          </nav>
        ) : null}
        {data.unanswered_count > 0 ? (
          <Checkbox
            checked={acceptAbsent}
            disabled={busy}
            onChange={(event) => setAcceptAbsent(event.target.checked)}
          >
            Confirmo que quiero enviar con {data.unanswered_count} respuestas
            ausentes.
          </Checkbox>
        ) : null}
        {submitOpen && error ? (
          <Alert
            type="error"
            showIcon
            title="Envío no confirmado"
            description={
              <>
                <p>{errorText(error)}</p>
                <p>
                  {httpStatus(error) === 409
                    ? 'Elegí «Seguir respondiendo» para recuperar explícitamente la versión del servidor antes de volver a enviar.'
                    : 'No se recibió confirmación del servidor. Podés reintentar el envío o elegir «Seguir respondiendo» para revisar tus respuestas.'}
                </p>
              </>
            }
          />
        ) : null}
      </Modal>
      <Modal
        open={blocker.state === 'blocked'}
        title="Guardar antes de salir"
        okText="Guardar y continuar"
        cancelText="Seguir respondiendo"
        confirmLoading={busy}
        okButtonProps={{ disabled: busy }}
        cancelButtonProps={{ disabled: busy }}
        closable={!busy}
        mask={{ closable: false }}
        onCancel={() => {
          if (blocker.state === 'blocked' && !busy) blocker.reset();
        }}
        onOk={() => void saveAndGo(undefined, true)}
      >
        <p>
          La navegación continuará sólo cuando el servidor confirme el guardado.
        </p>
        {error ? <Failure error={error} /> : null}
      </Modal>
      <Modal
        open={reloadOpen}
        title="Recuperar respuestas del servidor"
        okText="Reemplazar elección local"
        cancelText="Conservar mi elección"
        confirmLoading={busy}
        okButtonProps={{ disabled: busy }}
        cancelButtonProps={{ disabled: busy }}
        closable={!busy}
        onCancel={() => {
          if (!busy) setReloadOpen(false);
        }}
        onOk={() => void reload()}
      >
        <p>
          Se reemplazará la elección local sin guardar por la última versión del
          servidor.
        </p>
        {error ? <Failure error={error} /> : null}
      </Modal>
    </>
  );
}

export function RecordEvaluations({
  record,
  staff,
  refresh,
}: {
  record: RecordDetail;
  staff: boolean;
  refresh: () => Promise<void>;
}) {
  const { user } = usePilotSession();
  if (record.status === 'legacy_internal' || !record.holder_user_id)
    return (
      <Empty description="Este expediente no admite pruebas del piloto." />
    );
  if (staff) {
    if (
      !user?.can_review_talent ||
      record.reviewer?.id !== user.id ||
      record.holder_user_id === user.id
    )
      return (
        <Alert
          type="info"
          title="Las pruebas están disponibles sólo para el revisor asignado, sin revisión del expediente propio."
        />
      );
    return <StaffRecordEvaluations record={record} refresh={refresh} />;
  }
  return user?.is_graduate && record.holder_user_id === user.id ? (
    <OwnRecordEvaluations registration={record.id} />
  ) : (
    <Empty description="Sin acceso a las pruebas de este expediente." />
  );
}
function OwnRecordEvaluations({ registration }: { registration: string }) {
  const { session } = usePilotSession();
  const query = useQuery({
    queryKey: session.key('evaluations'),
    queryFn: ({ signal }) => session.run(evaluationsApi.mine, signal),
  });
  return query.isPending ? (
    <Spin />
  ) : query.isError ? (
    <Failure error={query.error} retry={() => void query.refetch()} />
  ) : (
    <AssignmentList
      items={query.data.filter((item) => item.registration_id === registration)}
    />
  );
}
function StaffRecordEvaluations({
  record,
  refresh,
}: {
  record: RecordDetail;
  refresh: () => Promise<void>;
}) {
  const { session } = usePilotSession();
  const [selected, setSelected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const assignments = useQuery({
    queryKey: session.key('staff-evaluations', record.id),
    queryFn: ({ signal }) =>
      session.run(
        (request) => evaluationsApi.staffList(record.id, request),
        signal
      ),
  });
  const instruments = useQuery({
    queryKey: session.key('instruments'),
    queryFn: ({ signal }) => session.run(evaluationsApi.instruments, signal),
  });
  async function assign() {
    if (locked.current || !selected) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await session.run((signal) =>
        evaluationsApi.assign(record.id, record.version, selected, signal)
      );
      await Promise.all([assignments.refetch(), refresh()]);
    } catch (failure) {
      if (!isCancel(failure)) {
        setError(failure);
        if (httpStatus(failure) === 409) await refresh();
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="pilot-evaluations-stack">
      <Typography.Title level={2}>Pruebas del expediente</Typography.Title>
      <p>
        Control técnico provisional del piloto. Asignar no cambia el estado del
        expediente.
      </p>
      <p>
        Las versiones marcadas como no habilitadas se revisan en el banco
        privado y no se asignan a titulares.
      </p>
      {instruments.isPending ? (
        <Spin />
      ) : instruments.isError ? (
        <Failure
          error={instruments.error}
          retry={() => void instruments.refetch()}
        />
      ) : (
        <>
          <label htmlFor="evaluation-version">Versión del instrumento</label>
          <Select
            id="evaluation-version"
            placeholder="Elegí una versión con conformidad"
            value={selected}
            onChange={setSelected}
            disabled={busy}
            options={instruments.data.map((item) => ({
              value: item.id,
              label:
                item.name +
                ' · ' +
                item.version_label +
                (item.conformity ? '' : ' · Sin conformidad') +
                (item.application_ready
                  ? ''
                  : ' · No habilitada para aplicación'),
              disabled: !item.conformity || !item.application_ready,
            }))}
          />
          <Button
            disabled={busy || !selected}
            loading={busy}
            onClick={() => void assign()}
          >
            Asignar prueba
          </Button>
          {!instruments.data.length ? (
            <Empty description="No hay versiones importadas." />
          ) : null}
        </>
      )}
      {error ? <Failure error={error} /> : null}
      <Button
        disabled={busy || assignments.isFetching}
        onClick={() => void assignments.refetch()}
      >
        Actualizar pruebas y resultados
      </Button>
      {assignments.isPending ? (
        <Spin />
      ) : assignments.isError ? (
        <Failure
          error={assignments.error}
          retry={() => void assignments.refetch()}
        />
      ) : assignments.data.length ? (
        assignments.data.map((item) => (
          <StaffResult key={item.id} item={item} />
        ))
      ) : (
        <Empty description="Sin pruebas asignadas." />
      )}
    </div>
  );
}
function StaffResult({ item }: { item: StaffEvaluationAssignment }) {
  const result = item.raw_result;
  return (
    <div className="pilot-evaluations-item">
      <Typography.Title level={3}>{item.instrument.name}</Typography.Title>
      <p>Versión aplicada: {item.instrument.version_label}</p>
      <Tag>{statusLabels[item.status]}</Tag>
      <p>
        {item.answered_count} respuestas guardadas · {item.unanswered_count}{' '}
        ausentes
      </p>
      {item.submitted_at ? (
        <p>Enviada: {new Date(item.submitted_at).toLocaleString('es-BO')}</p>
      ) : null}
      {item.status === 'submitted' && isMcClellandName(item.instrument.name) ? (
        <McClellandResultsView assignment={item} result={item.raw_result} />
      ) : null}
      {item.status === 'submitted' &&
      isDominosName(item.instrument.name) &&
      item.raw_result &&
      'model' in item.raw_result &&
      item.raw_result.model === 'dominos' ? (
        <DominosResultsView assignment={item} result={item.raw_result} staffView />
      ) : null}
      {item.status === 'submitted' &&
      is16FpName(item.instrument.name) &&
      item.raw_result &&
      'model' in item.raw_result &&
      item.raw_result.model === '16fp' ? (
        <Fp16ResultsView assignment={item} result={item.raw_result} staffView />
      ) : null}
      {item.status === 'submitted' &&
      isSoftSkillsName(item.instrument.name) &&
      item.raw_result &&
      'model' in item.raw_result &&
      item.raw_result.model === 'habilidades_blandas' ? (
        <SoftSkillsResultsView assignment={item} result={item.raw_result} staffView />
      ) : null}
      {item.status === 'submitted' &&
      !isMcClellandName(item.instrument.name) &&
      !isDominosName(item.instrument.name) &&
      !is16FpName(item.instrument.name) &&
      !isSoftSkillsName(item.instrument.name) &&
      item.raw_result &&
      'correct' in item.raw_result &&
      'max_score' in item.raw_result ? (
        <PercentageResultsView assignment={item} result={item.raw_result} staffView />
      ) : null}
      {item.status === 'submitted' &&
      !isMcClellandName(item.instrument.name) &&
      !(
        is16FpName(item.instrument.name) &&
        item.raw_result &&
        'model' in item.raw_result &&
        item.raw_result.model === '16fp'
      ) &&
      !(
        isSoftSkillsName(item.instrument.name) &&
        item.raw_result &&
        'model' in item.raw_result &&
        item.raw_result.model === 'habilidades_blandas'
      ) &&
      item.answer_type === 'single_choice_unscored' ? (
        <Collapse
          items={[
            {
              key: 'captured-letters',
              label: 'Respuestas capturadas; sin calificación',
              children: (
                <dl className="pilot-evaluations-captured">
                  {item.exercises.map((exercise) => {
                    const answer = item.answers[exercise.id];
                    const letter = typeof answer === 'string' ? answer : null;
                    const optionText =
                      letter && exercise.response_type !== 'two_halves'
                        ? exercise.option_texts?.[letter]
                        : null;
                    return (
                      <div key={exercise.id}>
                        <dt>
                          Pregunta {exercise.number} · {exercise.id}
                        </dt>
                        <dd>
                          {letter === null
                            ? 'Sin responder'
                            : letter + (optionText ? ') ' + optionText : '')}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ),
            },
          ]}
        />
      ) : null}
      {item.status === 'submitted' &&
      item.answer_type === 'two_halves' &&
      !(
        isDominosName(item.instrument.name) &&
        item.raw_result &&
        'model' in item.raw_result &&
        item.raw_result.model === 'dominos'
      ) ? (
        <Collapse
          items={[
            {
              key: 'captured-answers',
              label: 'Consultar respuestas capturadas (sin calificación)',
              children: (
                <dl className="pilot-evaluations-captured">
                  {item.exercises.map((exercise) => {
                    const answer = halves(item.answers[exercise.id]);
                    return (
                      <div key={exercise.id}>
                        <dt>
                          Ejercicio {exercise.number} · {exercise.id}
                        </dt>
                        <dd>
                          Superior: {answer.first ?? 'Sin responder'} ·
                          Inferior: {answer.second ?? 'Sin responder'}
                          {isPartial(answer) ? ' · Parcial' : ''}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ),
            },
          ]}
        />
      ) : null}
      {item.status === 'submitted' && result && !('model' in result) ? (
        <>
          <Typography.Title level={4}>Resultado bruto</Typography.Title>
          <p>
            Aciertos: {result.correct} · Errores: {result.incorrect} · Ausentes:{' '}
            {result.absent}
          </p>
          <p>
            Puntaje: {result.score} / {result.max_score}. Un punto por acierto;
            sin penalización por error o ausencia.
          </p>
          <p>Regla aplicada: {result.scoring_rule}</p>
          <p>
            No es CI/IQ, baremo, aprobación/reprobación ni interpretación
            psicológica.
          </p>
        </>
      ) : item.status === 'submitted' && !(result && 'model' in result) ? (
        <p>
          Esta versión no tiene una regla de puntuación aprobada: el envío
          congeló las respuestas y no se registra resultado bruto. No se calcula
          CI/IQ, baremo ni clasificación.
        </p>
      ) : item.status !== 'submitted' ? (
        <p>El resultado bruto estará disponible después del envío.</p>
      ) : null}
    </div>
  );
}
