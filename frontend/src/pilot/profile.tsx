import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Collapse,
  Empty,
  Flex,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './profile.css';
import { errorText, pilotApi } from './api';
import { usePilotSession } from './context';
import { evaluationsApi } from './evaluations-api';
import { NextAction, PageIntro } from './presentation';
import { formatRecordDate } from './presentation-data';
import { QueryFailure } from './records';
import { documentTypes, missingForSubmission, statusLabels } from './workflow';
import type {
  AcademicReview,
  CvReview,
  DocumentConclusion,
  DocumentMetadata,
  DocumentType,
  RecordDetail,
} from './types';
import type { StaffEvaluationAssignment } from './evaluations-types';

/** Explicit "no" and "not informed" are different answers and stay distinguishable. */
function mobilityText(mobility: RecordDetail['mobility']): string {
  const answer = (value: boolean | null) =>
    value === null ? 'no informado' : value ? 'sí' : 'no';
  return [
    `Provincia: ${answer(mobility.province)}`,
    `Departamento: ${answer(mobility.department)}`,
    `País: ${answer(mobility.country)}`,
  ].join(' · ');
}

/** Absent data is reported as not recorded, never as zero or as an approval. */
function shown(value?: string | number | null): string {
  if (value === null || value === undefined) return 'No registrado';
  const text = String(value).trim();
  return text === '' ? 'No registrado' : text;
}
const documentLabel = (type: DocumentType) =>
  documentTypes.find((entry) => entry.type === type)?.label ?? type;
const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
/** Latest version per document type: the rest stay reachable as previous versions. */
function latestDocuments(record: RecordDetail) {
  const latest = new Map<DocumentType, DocumentMetadata>();
  for (const document of record.documents) {
    const current = latest.get(document.type);
    if (!current || current.version < document.version)
      latest.set(document.type, document);
  }
  return {
    current: [...latest.values()].sort((a, b) => a.type.localeCompare(b.type)),
    previous: record.documents.filter(
      (document) => latest.get(document.type)?.id !== document.id
    ),
  };
}
function currentConclusion(conclusions: DocumentConclusion[]) {
  return [...conclusions].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  )[0];
}
const currentReviews = <T extends { vigente: boolean }>(reviews: T[]) =>
  reviews.filter((review) => review.vigente);
const previousReviews = <T extends { vigente: boolean }>(reviews: T[]) =>
  reviews.filter((review) => !review.vigente);

function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="pilot-profile-facts">
      {items.map((item) => (
        <div key={item.label} className="pilot-profile-fact">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DocumentDownload({
  recordId,
  document,
}: {
  recordId: string;
  document: DocumentMetadata;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    try {
      const blob = await pilotApi.download(
        recordId,
        document.id,
        controller.signal
      );
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.original_name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Flex vertical gap={4}>
      <Button
        size="small"
        loading={busy}
        onClick={() => void save()}
        aria-label={`Descargar ${documentLabel(document.type)} versión ${
          document.version
        }`}
      >
        Descargar
      </Button>
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
    </Flex>
  );
}

function DocumentsSection({ record }: { record: RecordDetail }) {
  const { current, previous } = latestDocuments(record);
  if (record.documents.length === 0)
    return (
      <Empty
        description="Sin documentos registrados"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  return (
    <Flex vertical gap={16}>
      <Typography.Paragraph>
        Vigentes: {current.length} de {documentTypes.length} tipos declarados.
        Las versiones anteriores se conservan y siguen siendo descargables.
      </Typography.Paragraph>
      <ul className="pilot-profile-documents">
        {current.map((document) => (
          <li key={document.id}>
            <div>
              <Typography.Text strong>
                {documentLabel(document.type)}
              </Typography.Text>
              <p className="pilot-profile-meta">
                {document.original_name} · versión {document.version} ·{' '}
                {sizeLabel(document.size)} · adjuntado el{' '}
                {formatRecordDate(document.created_at)}
              </p>
            </div>
            <DocumentDownload recordId={record.id} document={document} />
          </li>
        ))}
      </ul>
      {previous.length ? (
        <Collapse
          items={[
            {
              key: 'previous-documents',
              label: `Versiones anteriores conservadas (${previous.length})`,
              children: (
                <ul className="pilot-profile-documents">
                  {previous.map((document) => (
                    <li key={document.id}>
                      <div>
                        <Typography.Text>
                          {documentLabel(document.type)} · versión{' '}
                          {document.version}
                        </Typography.Text>
                        <p className="pilot-profile-meta">
                          {document.original_name} · adjuntado el{' '}
                          {formatRecordDate(document.created_at)} · corresponde
                          a una versión anterior
                        </p>
                      </div>
                      <DocumentDownload
                        recordId={record.id}
                        document={document}
                      />
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      ) : null}
    </Flex>
  );
}

function ConclusionBlock({
  conclusions,
}: {
  conclusions: DocumentConclusion[];
}) {
  const current = currentConclusion(conclusions);
  const previous = conclusions.filter((entry) => entry.id !== current?.id);
  if (!current)
    return (
      <Alert
        type="info"
        showIcon
        title="Sin conclusión documental registrada"
        description="El expediente todavía no tiene una conclusión de la revisión documental."
      />
    );
  return (
    <Flex vertical gap={8}>
      <Flex gap={8} align="center" wrap>
        <Tag color="processing">Vigente</Tag>
        <Typography.Text type="secondary">
          {current.reviewer.name} · {formatRecordDate(current.created_at)}
        </Typography.Text>
      </Flex>
      <Typography.Paragraph>{current.summary}</Typography.Paragraph>
      <Typography.Text type="secondary">
        Versiones de documento consideradas:{' '}
        {Object.entries(current.versions)
          .map(
            ([type, version]) =>
              `${documentLabel(type as DocumentType)} v${version.version}`
          )
          .join(' · ') || 'No registradas'}
      </Typography.Text>
      {previous.length ? (
        <Collapse
          items={[
            {
              key: 'previous-conclusions',
              label: `Conclusiones anteriores (${previous.length})`,
              children: (
                <ul className="pilot-profile-list">
                  {previous.map((entry) => (
                    <li key={entry.id}>
                      <Typography.Text strong>
                        {formatRecordDate(entry.created_at)} ·{' '}
                        {entry.reviewer.name}
                      </Typography.Text>
                      <p className="pilot-profile-meta">
                        {entry.summary} · corresponde a una versión anterior
                      </p>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      ) : null}
    </Flex>
  );
}

function AcademicBlock({
  reviews,
  pendiente,
}: {
  reviews: AcademicReview[];
  pendiente: boolean;
}) {
  const current = currentReviews(reviews);
  const previous = previousReviews(reviews);
  return (
    <Flex vertical gap={8}>
      {pendiente ? (
        <Alert
          type="warning"
          showIcon
          title="Requiere nueva revisión académica"
          description="El expediente cambió después de la última revisión vigente; no hay una revisión académica al día."
        />
      ) : null}
      {current.length ? (
        current.map((review) => (
          <div key={review.id} className="pilot-profile-review">
            <Flex gap={8} align="center" wrap>
              <Tag color="processing">Vigente</Tag>
              <Typography.Text type="secondary">
                {review.reviewer.name} · {formatRecordDate(review.created_at)} ·
                secuencia {review.sequence}
              </Typography.Text>
            </Flex>
            <Facts
              items={[
                { label: 'PPA revisado', value: shown(review.reviewed_ppa) },
                {
                  label: 'PPA declarado al revisar',
                  value: shown(review.declared_ppa_snapshot),
                },
                {
                  label: 'Histórico considerado',
                  value: review.historico_document_id
                    ? `${documentLabel('historico')} versión ${
                        review.historico_document_version
                      }`
                    : 'No registrado',
                },
              ]}
            />
            {review.declared_ppa_changed ? (
              <Tag color="warning">
                El PPA declarado cambió desde esta revisión
              </Tag>
            ) : null}
            <Typography.Paragraph>
              {shown(review.observations)}
            </Typography.Paragraph>
          </div>
        ))
      ) : (
        <Empty
          description="Sin revisión académica vigente"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      {previous.length ? (
        <Collapse
          items={[
            {
              key: 'previous-academic',
              label: `Revisiones académicas anteriores (${previous.length})`,
              children: (
                <ul className="pilot-profile-list">
                  {previous.map((review) => (
                    <li key={review.id}>
                      <Typography.Text strong>
                        {formatRecordDate(review.created_at)} ·{' '}
                        {review.reviewer.name}
                      </Typography.Text>
                      <p className="pilot-profile-meta">
                        PPA revisado {shown(review.reviewed_ppa)} · histórico
                        versión {review.historico_document_version} ·{' '}
                        {shown(review.observations)} · corresponde a una versión
                        anterior
                      </p>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      ) : null}
    </Flex>
  );
}

function CvBlock({
  reviews,
  pendiente,
}: {
  reviews: CvReview[];
  pendiente: boolean;
}) {
  const current = currentReviews(reviews);
  const previous = previousReviews(reviews);
  return (
    <Flex vertical gap={8}>
      {pendiente ? (
        <Alert
          type="info"
          showIcon
          title="Revisión del CV pendiente"
          description="No hay una revisión del CV vigente para la versión actual del expediente."
        />
      ) : null}
      {current.length ? (
        current.map((review) => (
          <div key={review.id} className="pilot-profile-review">
            <Flex gap={8} align="center" wrap>
              <Tag color="processing">Vigente</Tag>
              {review.absent ? <Tag color="warning">CV ausente</Tag> : null}
              <Typography.Text type="secondary">
                {review.reviewer.name} · {formatRecordDate(review.created_at)} ·
                secuencia {review.sequence}
              </Typography.Text>
            </Flex>
            <Typography.Paragraph>
              {review.absent
                ? 'La revisión registró la ausencia de CV; no se interpreta como CV vacío ni como aprobación.'
                : `CV considerado: versión ${shown(
                    review.cv_document_version
                  )}.`}
            </Typography.Paragraph>
            <Typography.Paragraph>
              {shown(review.observations)}
            </Typography.Paragraph>
          </div>
        ))
      ) : (
        <Empty
          description="Sin revisión del CV vigente"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      {previous.length ? (
        <Collapse
          items={[
            {
              key: 'previous-cv',
              label: `Revisiones del CV anteriores (${previous.length})`,
              children: (
                <ul className="pilot-profile-list">
                  {previous.map((review) => (
                    <li key={review.id}>
                      <Typography.Text strong>
                        {formatRecordDate(review.created_at)} ·{' '}
                        {review.reviewer.name}
                      </Typography.Text>
                      <p className="pilot-profile-meta">
                        {review.absent
                          ? 'CV ausente'
                          : `CV versión ${shown(
                              review.cv_document_version
                            )}`}{' '}
                        · {shown(review.observations)} · corresponde a una
                        versión anterior
                      </p>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      ) : null}
    </Flex>
  );
}

const assignmentStatusLabel: Record<
  StaffEvaluationAssignment['status'],
  string
> = {
  assigned: 'Asignada, sin responder',
  in_progress: 'En curso, sin enviar',
  submitted: 'Enviada',
};

function EvaluationsSection({
  assignments,
}: {
  assignments: StaffEvaluationAssignment[];
}) {
  if (assignments.length === 0)
    return (
      <Empty
        description="Sin pruebas asignadas"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  return (
    <Flex vertical gap={12}>
      <Typography.Paragraph>
        Resultado bruto sólo para el instrumento que lo calcula y para el
        personal autorizado que revisa este expediente. Dominós y el 16 FP
        conservan respuestas capturadas, sin calificación.
      </Typography.Paragraph>
      <ul className="pilot-profile-list">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="pilot-profile-evaluation">
            <Flex gap={8} align="center" wrap>
              <Typography.Text strong>
                {assignment.instrument.name}
              </Typography.Text>
              <Tag>{assignment.instrument.version_label}</Tag>
              <Tag
                color={
                  assignment.status === 'submitted' ? 'success' : 'default'
                }
              >
                {assignmentStatusLabel[assignment.status]}
              </Tag>
            </Flex>
            <p className="pilot-profile-meta">
              Asignada el {formatRecordDate(assignment.assigned_at)}
              {assignment.submitted_at
                ? ` · enviada el ${formatRecordDate(assignment.submitted_at)}`
                : ' · sin envío registrado'}
            </p>
            {assignment.status === 'submitted' ? (
              <p className="pilot-profile-meta">
                {assignment.answered_count} respuestas guardadas ·{' '}
                {assignment.unanswered_count} ausentes
                {assignment.partial_count
                  ? ` · ${assignment.partial_count} parciales`
                  : ''}
              </p>
            ) : null}
            {assignment.raw_result &&
            'model' in assignment.raw_result &&
            assignment.raw_result.model === 'mcclelland' ? (
              <Facts
                items={[
                  {
                    label: 'Motivador dominante',
                    value: `${assignment.raw_result.dominant} (${assignment.raw_result.highest_score} pts)`,
                  },
                  {
                    label: 'Logro / Afiliación / Poder',
                    value: `${assignment.raw_result.dimensions.logro.score} / ${assignment.raw_result.dimensions.afiliacion.score} / ${assignment.raw_result.dimensions.poder.score} pts`,
                  },
                ]}
              />
            ) : assignment.raw_result &&
              'model' in assignment.raw_result &&
              assignment.raw_result.model === 'dominos' ? (
              <Facts
                items={[
                  {
                    label: 'Porcentaje de aciertos',
                    value: `${assignment.raw_result.percentage}% (${assignment.raw_result.score} de ${assignment.raw_result.max_score} aciertos)`,
                  },
                  {
                    label: 'Aciertos / errores / ausentes',
                    value: `${assignment.raw_result.correct} / ${assignment.raw_result.incorrect} / ${assignment.raw_result.absent}`,
                  },
                ]}
              />
            ) : assignment.raw_result &&
              'model' in assignment.raw_result &&
              assignment.raw_result.model === '16fp' ? (
              <Facts
                items={[
                  {
                    label: 'Cuestionario 16 FP',
                    value: `${assignment.raw_result.form} · 16 factores calculados`,
                  },
                  {
                    label: 'Índice de indecisión (opción B)',
                    value: `${assignment.raw_result.validity.indecision_count} / 184 (${assignment.raw_result.validity.indecision_percentage}%)`,
                  },
                ]}
              />
            ) : assignment.raw_result &&
              'model' in assignment.raw_result &&
              assignment.raw_result.model === 'habilidades_blandas' ? (
              <Facts
                items={[
                  {
                    label: 'Habilidades Blandas',
                    value: `Promedio ${assignment.raw_result.global_average} / 5.0 (${assignment.raw_result.global_percentage}%)`,
                  },
                  {
                    label: 'Reactivos respondidos',
                    value: `${assignment.raw_result.answered_count} de ${assignment.raw_result.total_items}`,
                  },
                ]}
              />
            ) : assignment.answer_type === 'single_choice' ? (
              assignment.raw_result && !('model' in assignment.raw_result) ? (
                <Facts
                  items={[
                    {
                      label: 'Resultado bruto',
                      value: `${assignment.raw_result.score} de ${assignment.raw_result.max_score}`,
                    },
                    {
                      label: 'Aciertos / errores / ausentes',
                      value: `${assignment.raw_result.correct} / ${assignment.raw_result.incorrect} / ${assignment.raw_result.absent}`,
                    },
                    {
                      label: 'Regla aplicada',
                      value: assignment.raw_result.scoring_rule,
                    },
                  ]}
                />
              ) : (
                <Typography.Text type="secondary">
                  Resultado bruto no registrado.
                </Typography.Text>
              )
            ) : assignment.status === 'submitted' ? (
              <Typography.Text type="secondary">
                Respuestas capturadas; sin calificación.
              </Typography.Text>
            ) : null}
          </li>
        ))}
      </ul>
    </Flex>
  );
}

function ObservationsSection({
  observations,
}: {
  observations: {
    id: string;
    kind: string;
    content: string;
    reviewer: { name: string };
    created_at: string;
  }[];
}) {
  if (observations.length === 0)
    return (
      <Empty
        description="Sin observaciones registradas"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  return (
    <ul className="pilot-profile-list">
      {observations.map((observation) => (
        <li key={observation.id}>
          <Flex gap={8} align="center" wrap>
            <Tag>
              {observation.kind === 'correction' ? 'Corrección' : 'Nota'}
            </Tag>
            <Typography.Text type="secondary">
              {observation.reviewer.name} ·{' '}
              {formatRecordDate(observation.created_at)}
            </Typography.Text>
          </Flex>
          <Typography.Paragraph>{observation.content}</Typography.Paragraph>
        </li>
      ))}
    </ul>
  );
}

function HistorySection({
  entries,
}: {
  entries: {
    id: string;
    action: string;
    version: number;
    actor: { name: string };
    created_at: string;
  }[];
}) {
  if (entries.length === 0)
    return (
      <Empty
        description="Sin historial registrado"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  return (
    <ul className="pilot-profile-history">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Typography.Text strong>{entry.action}</Typography.Text>
          <p className="pilot-profile-meta">
            {formatRecordDate(entry.created_at)} · {entry.actor.name} · versión{' '}
            {entry.version}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ConsolidatedProfilePage() {
  const { id = '' } = useParams();
  const { session } = usePilotSession();
  const detail = useQuery({
    queryKey: session.key('staff-detail', id),
    queryFn: ({ signal }) =>
      session.run((request) => pilotApi.staffDetail(id, request), signal),
    refetchOnWindowFocus: false,
  });
  const history = useQuery({
    queryKey: session.key('history', id),
    queryFn: ({ signal }) =>
      session.run((request) => pilotApi.history(id, request), signal),
  });
  const observations = useQuery({
    queryKey: session.key('observations', id),
    queryFn: ({ signal }) =>
      session.run((request) => pilotApi.observations(id, request), signal),
  });
  const evaluations = useQuery({
    queryKey: session.key('staff-evaluations', id),
    queryFn: ({ signal }) =>
      session.run((request) => evaluationsApi.staffList(id, request), signal),
  });
  if (detail.isPending) return <Spin />;
  if (detail.isError)
    return (
      <QueryFailure error={detail.error} retry={() => void detail.refetch()} />
    );
  const record = detail.data;
  const missing = missingForSubmission(
    { ...record.person, ...record.academic, mobility: record.mobility },
    record.documents
  );
  const pendingEvaluations = (evaluations.data ?? []).filter(
    (assignment) => assignment.status !== 'submitted'
  ).length;
  const career = record.catalog.career_name ?? record.academic.career;
  const faculty = record.catalog.faculty_name ?? record.academic.faculty;
  const summary = [
    career ? String(career) : 'Carrera no registrada',
    faculty ? String(faculty) : 'Facultad no registrada',
  ].join(' · ');
  return (
    <div className="pilot-profile">
      <PageIntro
        title={`Perfil interno · ${shown(record.person.full_name)}`}
        description={`${summary} · expediente ${record.id.slice(
          0,
          8
        )} · versión ${record.version} · actualizado el ${formatRecordDate(
          record.updated_at
        )}`}
        status={record.status}
        extra={
          <Link to={`/personal/inscripciones/${record.id}`}>
            Abrir expediente de revisión
          </Link>
        }
      />
      <div className="pilot-profile-layout">
        <section className="pilot-profile-main">
          <Tabs
            items={[
              {
                key: 'resumen',
                label: 'Resumen',
                children: (
                  <Flex vertical gap={16}>
                    <Facts
                      items={[
                        {
                          label: 'Registro universitario',
                          value: shown(record.person.university_registration),
                        },
                        {
                          label: 'PPA declarado',
                          value: shown(record.academic.declared_ppa),
                        },
                        {
                          label: 'Titulación declarada',
                          value: shown(career),
                        },
                        {
                          label: 'Facultad declarada',
                          value: shown(faculty),
                        },
                        {
                          label: 'Área de interés',
                          value: shown(record.academic.interest_area),
                        },
                        {
                          label: 'Correo de contacto',
                          value: shown(record.person.contact_email),
                        },
                        {
                          label: 'Teléfono de contacto',
                          value: shown(record.person.contact_phone),
                        },
                        {
                          label: 'Fecha de nacimiento',
                          value: formatRecordDate(record.person.birth_date),
                        },
                        {
                          label: 'Disponibilidad declarada',
                          value: mobilityText(record.mobility),
                        },
                        {
                          label: 'Estado del expediente',
                          value: statusLabels[record.status],
                        },
                        {
                          label: 'Enviada el',
                          value: record.submitted_at
                            ? formatRecordDate(record.submitted_at)
                            : 'Sin envío registrado',
                        },
                        {
                          label: 'Revisor asignado',
                          value: record.reviewer
                            ? record.reviewer.name
                            : 'Sin revisor asignado',
                        },
                      ]}
                    />
                    <Facts
                      items={[
                        {
                          label: 'Catálogo UAGRM',
                          value: record.catalog.label
                            ? `${record.catalog.label}${
                                record.catalog.version
                                  ? ` (versión ${record.catalog.version})`
                                  : ''
                              }`
                            : 'Sin referencia de catálogo',
                        },
                        {
                          label: 'Procedencia de la carrera',
                          value: record.catalog.career_manual
                            ? 'Excepción manual sujeta a revisión del catálogo'
                            : 'Catálogo UAGRM',
                        },
                      ]}
                    />
                    <Alert
                      type="info"
                      showIcon
                      title="Perfil interno, no público"
                      description="Esta vista reúne el expediente para el personal autorizado. La publicación del perfil requiere autorización expresa y separada; hoy no está implementada y esta pantalla no la habilita."
                    />
                  </Flex>
                ),
              },
              {
                key: 'documentos',
                label: 'Documentos',
                children: <DocumentsSection record={record} />,
              },
              {
                key: 'revisiones',
                label: 'Revisiones',
                children: (
                  <Flex vertical gap={24}>
                    <div>
                      <Typography.Title level={2}>
                        Conclusión documental
                      </Typography.Title>
                      <ConclusionBlock
                        conclusions={record.document_conclusions}
                      />
                    </div>
                    <div>
                      <Typography.Title level={2}>
                        Revisión académica
                      </Typography.Title>
                      <AcademicBlock
                        reviews={record.academic_reviews.reviews}
                        pendiente={record.academic_reviews.pendiente}
                      />
                    </div>
                    <div>
                      <Typography.Title level={2}>
                        Revisión del CV
                      </Typography.Title>
                      <CvBlock
                        reviews={record.cv_reviews.reviews}
                        pendiente={record.cv_reviews.pendiente}
                      />
                    </div>
                  </Flex>
                ),
              },
              {
                key: 'evaluaciones',
                label: 'Evaluaciones',
                children: evaluations.isPending ? (
                  <Spin />
                ) : evaluations.isError ? (
                  <QueryFailure
                    error={evaluations.error}
                    retry={() => void evaluations.refetch()}
                  />
                ) : (
                  <EvaluationsSection assignments={evaluations.data} />
                ),
              },
              {
                key: 'observaciones',
                label: 'Observaciones',
                children: observations.isPending ? (
                  <Spin />
                ) : observations.isError ? (
                  <QueryFailure
                    error={observations.error}
                    retry={() => void observations.refetch()}
                  />
                ) : (
                  <ObservationsSection observations={observations.data} />
                ),
              },
              {
                key: 'historial',
                label: 'Historial',
                children: history.isPending ? (
                  <Spin />
                ) : history.isError ? (
                  <QueryFailure
                    error={history.error}
                    retry={() => void history.refetch()}
                  />
                ) : (
                  <HistorySection entries={history.data} />
                ),
              },
            ]}
          />
        </section>
        <aside className="pilot-profile-side">
          <NextAction
            status={record.status}
            staff
            observationsCount={observations.data?.length ?? 0}
          />
          {missing.length ? (
            <Alert
              type="warning"
              showIcon
              title={`${missing.length} requisito${
                missing.length === 1 ? '' : 's'
              } pendiente${missing.length === 1 ? '' : 's'} para el envío`}
              description={missing.join(' · ')}
            />
          ) : null}
          {evaluations.isPending ? (
            <Alert
              type="info"
              showIcon
              title="Pruebas sin enviar: consultando…"
              description="La consulta de las pruebas del expediente todavía está en curso; no se informa un total antes de conocer el resultado."
            />
          ) : evaluations.isError ? (
            <Alert
              type="warning"
              showIcon
              title="Pruebas sin enviar: no disponible"
              description="No se pudo consultar las pruebas del expediente. El dato no se informa como cero ni como enviado."
            />
          ) : (
            <Alert
              type={pendingEvaluations ? 'warning' : 'info'}
              showIcon
              title={`Pruebas sin enviar: ${pendingEvaluations}`}
              description={
                pendingEvaluations
                  ? 'El titular todavía no envió todas las pruebas asignadas.'
                  : 'Todas las pruebas asignadas fueron enviadas o no hay pruebas asignadas.'
              }
            />
          )}
          <Flex vertical gap={8}>
            <Link to={`/personal/inscripciones/${record.id}#documentos`}>
              Documentos y versiones del expediente
            </Link>
            <Link to={`/personal/inscripciones/${record.id}#revision`}>
              Registrar revisión en el expediente
            </Link>
            <Link to={`/personal/inscripciones/${record.id}#historial`}>
              Historial completo del expediente
            </Link>
          </Flex>
        </aside>
      </div>
    </div>
  );
}
