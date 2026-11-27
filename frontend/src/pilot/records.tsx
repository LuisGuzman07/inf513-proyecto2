import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Descriptions,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { isCancel } from 'axios';
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Link,
  Navigate,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Card } from '../components/shared/card/card';
import { AdvancedTable } from '../components/shared/advanced-table/advanced-table';
import { Container } from '../components/shared/container/container';
import { PageIntro, NextAction, StatusTag } from './presentation';
import { formSections, formatRecordDate } from './presentation-data';
import './records.css';
import { errorText, fieldErrors, httpStatus, pilotApi } from './api';
import { usePilotSession } from './context';
import { Documents } from './documents';
import { RecordEditor } from './editor';
import { RecordEvaluations } from './evaluations';
import { fields } from './validation';
import {
  actionLabels,
  canEdit,
  documentTypes,
  missingForSubmission,
  statusLabels,
} from './workflow';
import type {
  DocumentMetadata,
  RecordDetail,
  ReviewStatus,
  StaffListFilters,
} from './types';

export const recordsPath = '/portal/inscripciones';
export function QueryFailure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <Alert
      showIcon
      type="error"
      title={errorText(error)}
      action={<Button onClick={retry}>Reintentar</Button>}
    />
  );
}
function useList(page: number, staff = false, filters: StaffListFilters = {}) {
  const { session } = usePilotSession();
  return useQuery({
    queryKey: staff
      ? session.key(
          'staff-list',
          page,
          filters.search ?? '',
          filters.status ?? ''
        )
      : session.key('list', page),
    queryFn: ({ signal }) =>
      session.run(
        (request) =>
          staff
            ? pilotApi.staffList(page, request, filters)
            : pilotApi.list(page, request),
        signal
      ),
  });
}
export function PortalHome() {
  const query = useList(1);
  const { hash } = useLocation();
  if (query.isPending)
    return (
      <Flex gap={12} align="center" role="status">
        <Spin />
        <span>Cargando tu inscripción…</span>
      </Flex>
    );
  if (query.isError)
    return (
      <QueryFailure error={query.error} retry={() => void query.refetch()} />
    );
  const record = query.data.data.find(
    (item) => item.status !== 'legacy_internal'
  );
  if (record)
    return <Navigate to={recordsPath + '/' + record.id + hash} replace />;
  const legacyRecord = query.data.data.find(
    (item) => item.status === 'legacy_internal'
  );
  if (legacyRecord)
    return (
      <Navigate
        to={'/expedientes-anteriores/' + legacyRecord.id + hash}
        replace
      />
    );
  return <RecordEditor />;
}
export function RecordListPage({
  staff = false,
  legacy = false,
}: {
  staff?: boolean;
  legacy?: boolean;
}) {
  const screens = Grid.useBreakpoint();
  const mobile = screens.md === false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StaffListFilters>({});
  const query = useList(page, staff, filters);
  const filtered = Boolean(filters.search || filters.status);
  function searchRecords() {
    setPage(1);
    setFilters((current) => ({
      ...current,
      search: search.trim() || undefined,
    }));
  }
  const path = staff
    ? '/personal/inscripciones'
    : legacy
      ? '/expedientes-anteriores'
      : recordsPath;
  return (
    <Container className="pilot-record-container">
      <Card>
        <div className="pilot-record-stack">
          <PageIntro
            title={
              staff
                ? 'Bandeja de inscripciones'
                : legacy
                  ? 'Expedientes anteriores'
                  : 'Mi inscripción'
            }
            description={
              staff
                ? 'Consultá los expedientes enviados y continuá su revisión.'
                : 'Consultá el estado y los datos de tus expedientes.'
            }
          />
          {staff ? (
            <form
              className="pilot-record-filters"
              onSubmit={(event) => {
                event.preventDefault();
                searchRecords();
              }}
            >
              <div className="pilot-record-search">
                <label htmlFor="pilot-record-search">
                  Buscar por nombre o carrera
                </label>
                <Input
                  id="pilot-record-search"
                  value={search}
                  maxLength={200}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="pilot-record-status-filter">
                <label htmlFor="pilot-record-status">Estado</label>
                <Select<ReviewStatus | ''>
                  id="pilot-record-status"
                  virtual={false}
                  value={filters.status ?? ''}
                  options={[
                    { value: '', label: 'Todos los estados' },
                    ...(
                      [
                        'submitted',
                        'in_review',
                        'correction_requested',
                        'review_concluded',
                      ] as const
                    ).map((status) => ({
                      value: status,
                      label: statusLabels[status],
                    })),
                  ]}
                  onChange={(status) => {
                    setPage(1);
                    setFilters((current) => ({
                      ...current,
                      status: status || undefined,
                    }));
                  }}
                />
              </div>
              <Button type="primary" htmlType="submit">
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setPage(1);
                  setSearch('');
                  setFilters({});
                }}
              >
                Limpiar filtros
              </Button>
            </form>
          ) : null}
          {legacy ? (
            <Alert
              type="info"
              title="Vinculación del titular pendiente"
              description="Podés consultar tus expedientes anteriores. Para continuar el trámite, solicitá al personal responsable que compruebe y vincule tu titularidad."
            />
          ) : null}
          {query.isPending ? (
            <div role="status" className="pilot-record-loading">
              <Spin /> Cargando inscripciones…
            </div>
          ) : query.isError ? (
            <QueryFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            <>
              {mobile ? (
                <div className="pilot-record-cards">
                  <Flex justify="space-between" align="center" wrap gap={8}>
                    <Typography.Title level={2}>Inscripciones</Typography.Title>
                    <Button
                      loading={query.isFetching}
                      onClick={() => void query.refetch()}
                    >
                      Actualizar
                    </Button>
                  </Flex>
                  {query.data.data.length ? (
                    query.data.data.map((item) => (
                      <Card
                        key={item.id}
                        size="small"
                        className="pilot-record-list-card"
                      >
                        <Typography.Title level={3}>
                          {item.full_name || 'Nombre no disponible'}
                        </Typography.Title>
                        <StatusTag status={item.status} />
                        <Descriptions
                          size="small"
                          column={1}
                          items={[
                            {
                              key: 'career',
                              label: 'Carrera declarada',
                              children: item.career || 'No declarada',
                            },
                            {
                              key: 'date',
                              label: 'Fecha de envío',
                              children: formatRecordDate(item.submitted_at),
                            },
                          ]}
                        />
                        <Link
                          aria-label={
                            'Abrir expediente de ' +
                            (item.full_name || 'titulado')
                          }
                          to={path + '/' + item.id}
                        >
                          Abrir expediente
                        </Link>
                      </Card>
                    ))
                  ) : (
                    <Empty
                      description={
                        staff
                          ? filtered
                            ? 'No hay coincidencias. Probá otra búsqueda o limpiá los filtros.'
                            : 'No hay inscripciones pendientes de revisión.'
                          : 'Todavía no hay inscripciones disponibles.'
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="pilot-record-table">
                  <AdvancedTable
                    title="Inscripciones"
                    exportable={false}
                    refreshable
                    refreshText="Actualizar"
                    onRefresh={() => void query.refetch()}
                    scroll={{ x: 720 }}
                    rowKey="id"
                    dataSource={query.data.data}
                    paginated={false}
                    loading={query.isFetching}
                    locale={{
                      emptyText: (
                        <Empty
                          description={
                            staff
                              ? filtered
                                ? 'No hay coincidencias. Probá otra búsqueda o limpiá los filtros.'
                                : 'No hay inscripciones pendientes de revisión.'
                              : 'Todavía no hay inscripciones disponibles.'
                          }
                        />
                      ),
                    }}
                    columns={[
                      {
                        title: 'Código',
                        dataIndex: 'candidate_code',
                        width: 140,
                        render: (code?: string | null) =>
                          code ? (
                            <Tag color="blue" style={{ fontWeight: 600 }}>
                              {code}
                            </Tag>
                          ) : (
                            <Typography.Text type="secondary">—</Typography.Text>
                          ),
                      },
                      {
                        title: 'Titulado',
                        dataIndex: 'full_name',
                        width: 220,
                        render: (name: string | null) =>
                          name || 'Nombre no disponible',
                      },
                      {
                        title: 'Carrera declarada',
                        dataIndex: 'career',
                        width: 200,
                        render: (career?: string | null) =>
                          career || 'No declarada',
                      },
                      {
                        title: 'Estado',
                        dataIndex: 'status',
                        width: 160,
                        render: (status: RecordDetail['status']) => (
                          <StatusTag status={status} />
                        ),
                      },
                      {
                        title: 'Fecha de envío',
                        dataIndex: 'submitted_at',
                        width: 180,
                        render: formatRecordDate,
                      },
                      {
                        title: 'Acción',
                        key: 'open',
                        width: 150,
                        render: (_, item) => (
                          <Link
                            aria-label={
                              'Abrir expediente de ' +
                              (item.full_name || 'titulado')
                            }
                            to={path + '/' + item.id}
                          >
                            Abrir expediente
                          </Link>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
              <Pagination
                current={query.data.meta.current_page}
                pageSize={query.data.meta.per_page}
                total={query.data.meta.total}
                onChange={setPage}
                showSizeChanger={false}
              />
            </>
          )}
        </div>
      </Card>
    </Container>
  );
}
function shown(value: unknown): string {
  if (value === null || value === undefined || value === '')
    return 'No declarado';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'string' && value in statusLabels)
    return statusLabels[value as keyof typeof statusLabels];
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
const mobilityLabels = {
  province: 'Movilidad a provincia',
  department: 'Movilidad a departamento',
  country: 'Movilidad a país',
};
function EditableDocumentPanel(props: ComponentProps<typeof Documents>) {
  const selected = useRef(false);
  const blocker = useBlocker(() => selected.current);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (selected.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  return (
    <>
      <Documents
        {...props}
        onSelectionChange={(value) => {
          selected.current = value;
          props.onSelectionChange?.(value);
        }}
      />
      <Modal
        open={blocker.state === 'blocked'}
        title="Descartar archivos seleccionados"
        okText="Descartar"
        cancelText="Seguir trabajando"
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset();
        }}
        onOk={() => {
          selected.current = false;
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      >
        <Typography.Paragraph>
          Los archivos seleccionados que todavía no adjuntaste se perderán. Los
          documentos cargados se conservan.
        </Typography.Paragraph>
      </Modal>
    </>
  );
}
function submissionAnchor(label: string, record: RecordDetail): string | null {
  if (label.startsWith('CV: ') || label.startsWith('Currículum')) return 'curriculum';
  const field = fields.find(([, title]) => title === label)?.[0];
  if (field) {
    if (field === 'faculty') return 'faculty_catalog_id';
    if (field === 'career')
      return record.catalog.career_manual ? 'career' : 'career_catalog_id';
    return field;
  }
  const mobility = (
    [
      ['province', 'Provincia'],
      ['department', 'Departamento'],
      ['country', 'País'],
    ] as const
  ).find(([, title]) => 'Movilidad: ' + title === label)?.[0];
  if (mobility) return 'missing-mobility-' + mobility;
  const document = documentTypes.find((item) => item.label === label);
  return document ? 'document-' + document.type : null;
}

export function RecordPage({
  edit = false,
  staff = false,
  legacy = false,
}: {
  edit?: boolean;
  staff?: boolean;
  legacy?: boolean;
}) {
  const { id = '' } = useParams();
  const { session, user } = usePilotSession();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [rootBusy, setRootBusy] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState(
    hash.startsWith('#revision')
      ? 'revision'
      : hash === '#documentos'
        ? 'documentos'
        : hash === '#historial'
          ? 'historial'
          : staff && hash === '#observaciones'
            ? 'observaciones'
            : 'datos'
  );
  const [observationsOpen, setObservationsOpen] = useState<
    string[] | undefined
  >(hash === '#observaciones' ? ['observaciones'] : undefined);
  const detail = useQuery({
    queryKey: session.key(staff ? 'staff-detail' : 'detail', id),
    queryFn: ({ signal }) =>
      session.run(
        (request) =>
          staff
            ? pilotApi.staffDetail(id, request)
            : pilotApi.detail(id, request),
        signal
      ),
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
    enabled: !legacy,
  });
  useEffect(() => {
    if (hash.startsWith('#revision')) setActiveTab('revision');
    if (hash === '#documentos') setActiveTab('documentos');
    if (hash === '#historial') setActiveTab('historial');
    if (hash === '#observaciones') {
      if (staff) setActiveTab('observaciones');
      else setObservationsOpen(['observaciones']);
    }
  }, [hash, staff]);
  useEffect(() => {
    if (!detail.data || !hash) return;
    const target = document.getElementById(hash.slice(1));
    // jsdom does not implement scrollIntoView; real browsers do.
    if (typeof target?.scrollIntoView === 'function') target.scrollIntoView();
  }, [detail.data, hash, activeTab]);
  if (detail.isPending) return <Spin />;
  if (detail.isError)
    return (
      <QueryFailure error={detail.error} retry={() => void detail.refetch()} />
    );
  const record = detail.data;
  const editable = !staff && !legacy && canEdit(record, user);
  const observationCount = observations.data?.length ?? 0;
  const observationPanelKey =
    observationsOpen ??
    (observationCount > 0 || record.status === 'correction_requested'
      ? ['observaciones']
      : []);
  async function refresh() {
    await Promise.all([
      detail.refetch(),
      history.refetch(),
      observations.refetch(),
    ]);
    void session.client.invalidateQueries({
      queryKey: session.key(staff ? 'staff-list' : 'list'),
    });
  }
  const declared = { ...record.person, ...record.academic };
  const observationContent = (
    <div id="observaciones" className="pilot-record-observations">
      <Typography.Paragraph type="secondary">
        Las observaciones son generales para la inscripción; revisá los datos y
        documentos indicados por el personal.
      </Typography.Paragraph>
      {observations.isPending ? (
        <Spin />
      ) : observations.isError ? (
        <QueryFailure
          error={observations.error}
          retry={() => void observations.refetch()}
        />
      ) : observations.data.length ? (
        observations.data.map((item) => (
          <div key={item.id}>
            <Tag>
              {item.kind === 'correction_request' ||
              item.kind === 'correction_requested'
                ? 'Solicitud de corrección'
                : 'Observación'}
            </Tag>
            <Typography.Paragraph>{item.content}</Typography.Paragraph>
            <Typography.Text>
              {item.reviewer.name} ·{' '}
              {new Date(item.created_at).toLocaleString('es-BO')}
            </Typography.Text>
          </div>
        ))
      ) : (
        <Empty description="Sin observaciones" />
      )}
    </div>
  );
  const historyContent = (
    <div className="pilot-record-history-panel">
      {' '}
      {history.isPending ? (
        <Spin />
      ) : history.isError ? (
        <QueryFailure
          error={history.error}
          retry={() => void history.refetch()}
        />
      ) : history.data.length ? (
        <ol className="pilot-record-history">
          {history.data.map((entry) => (
            <li key={entry.id}>
              <Flex gap={8} wrap>
                <Tag>
                  {actionLabels[entry.action] ?? 'Cambio del expediente'}
                </Tag>
                <Typography.Text>
                  Versión {entry.version} · {entry.actor.name} ·{' '}
                  {new Date(entry.created_at).toLocaleString('es-BO')}
                </Typography.Text>
              </Flex>
              <ReviewFacts
                items={Object.entries(entry.changes).map(([field, change]) => ({
                  key: field,
                  label:
                    fields.find(([key]) => key === field)?.[1] ??
                    (field.startsWith('mobility.')
                      ? mobilityLabels[
                          field.slice(9) as keyof typeof mobilityLabels
                        ]
                      : {
                          status: 'Estado',
                          reviewer_user_id: 'Asignación de revisión',
                          holder_user_id: 'Titular',
                          document: 'Documento',
                          document_type: 'Tipo de documento',
                          documents: 'Versiones revisadas',
                          academic_review_id: 'Revisión académica',
                          reviewed_ppa: 'PPA revisado',
                          cv_review_id: 'Revisión del CV',
                          submitted_at: 'Envío',
                          faculty_catalog_id: 'Facultad (catálogo)',
                          career_catalog_id: 'Carrera (catálogo)',
                          career_manual: 'Declaración manual',
                          catalog_label: 'Etiqueta del catálogo',
                          catalog_version: 'Versión del catálogo',
                        }[field] ?? 'Cambio'),
                  children:
                    field === 'documents'
                      ? Object.entries(
                          change as unknown as Record<
                            string,
                            { id: string; version: number }
                          >
                        ).map(([type, doc]) => (
                          <Typography.Paragraph key={type}>
                            {type +
                              ' · versión ' +
                              doc.version +
                              ' · documento ' +
                              doc.id}
                          </Typography.Paragraph>
                        ))
                      : shown(change.before) + ' → ' + shown(change.after),
                }))}
              />
            </li>
          ))}
        </ol>
      ) : (
        <Empty description="Sin eventos disponibles" />
      )}
    </div>
  );
  const academicSummary =
    record.academic_reviews.reviews.find((review) => review.vigente) ??
    record.academic_reviews.reviews[record.academic_reviews.reviews.length - 1];
  const dataContent = (
    <div className="pilot-record-stack">
      {record.catalog.career_manual ? (
        <Alert
          type="warning"
          showIcon
          title="Declaración manual de carrera"
          description="El titulado declaró su carrera manualmente porque no la encontró en el catálogo. Requiere revisión del catálogo; no bloquea el trámite."
        />
      ) : record.catalog.label ? (
        <Alert
          type="info"
          showIcon
          title="Selección del catálogo"
          description={record.catalog.label}
        />
      ) : null}
      {record.concluded ? (
        <Alert
          type="info"
          showIcon
          title="Revisión documental concluida"
          description="El personal cerró la revisión de los documentos. Esto no es una admisión ni una publicación."
        />
      ) : null}
      {academicSummary ? (
        <Alert
          type="info"
          showIcon
          title={
            academicSummary.vigente
              ? 'Revisión académica vigente'
              : 'Revisión académica anterior'
          }
          description={
            academicSummary.reviewed_ppa ?? 'PPA revisado pendiente.'
          }
        />
      ) : null}
      {record.cv_reviews.reviews.length > 0 ? (
        <Alert
          type="info"
          showIcon
          title={
            record.cv_reviews.pendiente
              ? 'Revisión del CV anterior'
              : 'Revisión del CV vigente'
          }
          description={
            record.cv_reviews.reviews[record.cv_reviews.reviews.length - 1]
              .absent
              ? 'Ausencia de CV registrada; no bloquea el trámite.'
              : 'CV revisado.'
          }
        />
      ) : null}
      {formSections.map((section) => (
        <div key={section.id}>
          <Typography.Title level={2}>{section.title}</Typography.Title>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            items={[
              ...section.fields.map((key) => ({
                key,
                label: fields.find(([field]) => field === key)?.[1],
                children: shown(declared[key]),
              })),
              ...(section.id === 'intereses-movilidad'
                ? Object.entries(mobilityLabels).map(([key, label]) => ({
                    key,
                    label,
                    children: shown(
                      record.mobility[key as keyof typeof record.mobility]
                    ),
                  }))
                : []),
            ]}
          />
        </div>
      ))}
    </div>
  );
  const documentProps: ComponentProps<typeof Documents> = {
    record,
    editable,
    busy: rootBusy,
    onBusy: setRootBusy,
    onSelectionChange: setPendingDocuments,
    onUploaded: (saved) => {
      session.client.setQueryData(session.key('detail', id), saved);
      void history.refetch();
    },
    reload: () => void refresh(),
  };
  const documentsContent = editable ? (
    <EditableDocumentPanel {...documentProps} />
  ) : (
    <Documents {...documentProps} />
  );
  return (
    <Container className="pilot-record-container">
      <div className="pilot-record-stack">
        {!(edit && editable) ? (
          <Card>
            <div className="pilot-record-stack">
              <PageIntro
                title={
                  staff
                    ? record.person.full_name || 'Expediente de inscripción'
                    : legacy
                      ? 'Expediente anterior'
                      : 'Mi inscripción'
                }
                description={
                  staff
                    ? 'Datos declarados y documentos enviados para revisión.'
                    : 'Consultá tus datos, documentos y observaciones.'
                }
                status={record.status}
                extra={
                  <>
                    <Link
                      to={
                        staff
                          ? '/personal/inscripciones'
                          : legacy
                            ? '/expedientes-anteriores'
                            : '/portal/inscripcion'
                      }
                    >
                      Volver
                    </Link>
                    {staff ? (
                      <Link to={'/personal/inscripciones/' + id + '/perfil'}>
                        Perfil consolidado
                      </Link>
                    ) : null}
                    {editable ? (
                      <Link to={recordsPath + '/' + id + '/editar'}>
                        <Button type="primary">Editar inscripción</Button>
                      </Link>
                    ) : null}
                  </>
                }
              />
              {staff &&
              (user?.can_review_talent !== true ||
                record.holder_user_id === user.id ||
                (record.reviewer && record.reviewer.id !== user.id)) ? (
                <Alert
                  showIcon
                  type="info"
                  title="Próxima acción"
                  description="Consultá el expediente. Las acciones de revisión están disponibles únicamente para el personal habilitado y asignado."
                />
              ) : (
                <NextAction
                  status={record.status}
                  staff={staff}
                  observationsCount={observationCount}
                />
              )}
              <div className="pilot-record-context">
                {record.candidate_code && (
                  <Tag
                    color="blue"
                    style={{ fontWeight: 600, fontSize: 13, padding: '2px 8px' }}
                  >
                    Código de Postulante: {record.candidate_code}
                  </Tag>
                )}
                <Typography.Text>Versión {record.version}</Typography.Text>
                <Typography.Text>
                  Revisor: {record.reviewer?.name ?? 'Sin asignación'}
                </Typography.Text>
                <Typography.Text>
                  Fecha de envío: {formatRecordDate(record.submitted_at)}
                </Typography.Text>
              </div>
              {legacy || record.status === 'legacy_internal' ? (
                <Alert
                  type="info"
                  title="Vinculación del titular pendiente"
                  description="Este expediente se puede consultar, pero todavía no puede modificarse."
                />
              ) : null}
              {edit && !editable ? (
                <Alert
                  type="info"
                  title="Esta inscripción no permite modificaciones en su estado actual."
                />
              ) : null}
            </div>
          </Card>
        ) : null}
        {!staff && !legacy ? (
          <Collapse
            activeKey={observationPanelKey}
            onChange={setObservationsOpen}
            items={[
              {
                key: 'observaciones',
                label:
                  record.status === 'correction_requested'
                    ? `Observaciones generales y motivo de corrección${
                        observationCount ? ` (${observationCount})` : ''
                      }`
                    : `Observaciones generales${
                        observationCount ? ` (${observationCount})` : ''
                      }`,
                children: observationContent,
              },
            ]}
          />
        ) : null}
        {edit && editable ? (
          <>
            <RecordEditor
              key={id + ':' + record.version}
              record={record}
              observationsCount={observationCount}
              reload={() => void detail.refetch()}
              renderActions={({
                record: savedRecord,
                dirty,
                busy,
                onGoToMissing,
              }) =>
                savedRecord ? (
                  <SubmitPanel
                    record={savedRecord}
                    refresh={refresh}
                    busy={rootBusy}
                    onBusy={setRootBusy}
                    onGoToMissing={onGoToMissing}
                    disabled={dirty || busy}
                    disabledReason={
                      dirty ? 'Guardá tus cambios antes de enviar.' : undefined
                    }
                  />
                ) : null
              }
            />
            <Collapse
              items={[
                {
                  key: 'history',
                  label: 'Historial de versiones',
                  children: historyContent,
                },
              ]}
            />
          </>
        ) : (
          <div className="pilot-record-stack">
            <Card className="pilot-record-content">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: 'datos', label: 'Datos', children: dataContent },
                  ...(!legacy
                    ? [
                        {
                          key: 'pruebas',
                          label: 'Pruebas',
                          children: (
                            <RecordEvaluations
                              record={record}
                              staff={staff}
                              refresh={refresh}
                            />
                          ),
                        },
                      ]
                    : []),
                  {
                    key: 'revision',
                    label: 'Revisión',
                    children: (
                      <ReviewContent
                        record={record}
                        refresh={refresh}
                        staff={staff}
                      />
                    ),
                  },
                  {
                    key: 'documentos',
                    label: 'Documentos',
                    children: documentsContent,
                  },
                  ...(staff && !legacy
                    ? [
                        {
                          key: 'observaciones',
                          label: 'Observaciones',
                          children: observationContent,
                        },
                      ]
                    : []),
                  {
                    key: 'historial',
                    label: 'Historial',
                    children: historyContent,
                  },
                ]}
              />
            </Card>
            {editable ? (
              <SubmitPanel
                record={record}
                refresh={refresh}
                busy={rootBusy}
                onBusy={setRootBusy}
                onGoToMissing={(label) => {
                  const target = submissionAnchor(label, record);
                  if (target)
                    navigate(recordsPath + '/' + id + '/editar#' + target);
                }}
                disabled={pendingDocuments}
                disabledReason={
                  pendingDocuments
                    ? 'Adjuntá o retirá los archivos seleccionados antes de enviar.'
                    : undefined
                }
              />
            ) : null}
          </div>
        )}
      </div>
    </Container>
  );
}

function SubmitPanel({
  record,
  refresh,
  busy,
  onBusy,
  onGoToMissing,
  disabled = false,
  disabledReason,
}: {
  disabled?: boolean;
  disabledReason?: string;
  record: RecordDetail;
  refresh: () => Promise<void>;
  busy: boolean;
  onBusy: (value: boolean) => void;
  onGoToMissing: (label: string) => void;
}) {
  const { session, generation } = usePilotSession();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [reload, setReload] = useState(false);
  const lock = useRef(false);
  const missing = missingForSubmission(
    { ...record.person, ...record.academic, mobility: record.mobility },
    record.documents,
    record.curriculum ?? null
  );
  async function submit() {
    if (lock.current || busy || disabled) return;
    lock.current = true;
    onBusy(true);
    setPending(true);
    setFailure(null);
    try {
      const saved = await session.run((signal) =>
        pilotApi.submit(record.id, record.version, signal)
      );
      if (generation !== session.snapshot.generation) return;
      session.client.setQueryData(session.key('detail', record.id), saved);
      setOpen(false);
      await refresh();
    } catch (error) {
      if (!isCancel(error) && generation === session.snapshot.generation) {
        setFailure(error);
        setOpen(false);
      }
    } finally {
      lock.current = false;
      if (generation === session.snapshot.generation) {
        setPending(false);
        onBusy(false);
      }
    }
  }
  const errors = fieldErrors(failure);
  return (
    <Card
      className="pilot-record-submit"
      title={
        record.status === 'correction_requested'
          ? 'Reenviar a revisión'
          : 'Enviar a revisión'
      }
    >
      {disabledReason ? <Alert type="warning" title={disabledReason} /> : null}
      <Typography.Paragraph>
        Completá los datos y adjuntá los documentos necesarios para enviar tu
        inscripción. Podés seguir trabajando como borrador.
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        Este resumen corresponde a la versión {record.version} confirmada por el
        servidor; no incluye cambios locales ni archivos seleccionados sin
        adjuntar. La completitud no sustituye la validación ni la revisión del
        personal.
      </Typography.Paragraph>
      {missing.length ? (
        <Alert
          type="info"
          title="Pendientes para enviar"
          description={
            <ul>
              {missing.map((label) => (
                <li key={label}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onGoToMissing(label)}
                  >
                    {label}
                  </Button>
                </li>
              ))}
            </ul>
          }
        />
      ) : disabled ? (
        <Alert
          type="info"
          title="Los datos y documentos están completos."
          description="Todavía no podés enviar: hay cambios sin guardar. El envío siempre usa la última versión guardada de tu inscripción."
        />
      ) : (
        <Typography.Paragraph>
          Datos y documentos listos para enviar.
        </Typography.Paragraph>
      )}
      {failure ? (
        <Alert
          type="error"
          title={errorText(failure)}
          description={
            <ul>
              {Object.entries(errors).map(([key, messages]) => (
                <li key={key}>
                  {fields.find(([field]) => field === key)?.[1] ??
                    documentTypes.find((item) => key.includes(item.type))
                      ?.label ??
                    (key.startsWith('mobility')
                      ? 'Movilidad'
                      : key.startsWith('documents') ||
                          key.startsWith('documentos')
                        ? 'Documentos requeridos'
                        : 'Inscripción')}
                  : {messages.join(' ')}
                </li>
              ))}
            </ul>
          }
          action={
            httpStatus(failure) === 409 ? (
              <Button onClick={() => setReload(true)}>
                Recargar inscripción
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <Button
        type="primary"
        disabled={missing.length > 0 || busy || disabled}
        loading={pending}
        onClick={() => setOpen(true)}
      >
        {record.status === 'correction_requested'
          ? 'Reenviar a revisión'
          : 'Enviar a revisión'}
      </Button>
      <Modal
        open={open}
        title="Confirmar envío a revisión"
        okText="Enviar"
        cancelText="Volver"
        confirmLoading={pending}
        closable={!pending}
        mask={{ closable: !pending }}
        cancelButtonProps={{ disabled: pending }}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
      >
        <Typography.Paragraph>
          Después del envío no podrás editar ni adjuntar archivos hasta que te
          soliciten una corrección.
        </Typography.Paragraph>
      </Modal>
      <Modal
        open={reload}
        title="Recargar expediente"
        okText="Recargar"
        cancelText="Cancelar"
        onCancel={() => setReload(false)}
        onOk={() => {
          setReload(false);
          void refresh();
        }}
      >
        <Typography.Paragraph>
          Se consultará la versión actual del servidor.
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
}
function ReviewContent({
  record,
  refresh,
  staff,
}: {
  record: RecordDetail;
  refresh: () => Promise<void>;
  staff: boolean;
}) {
  const { user } = usePilotSession();
  const actionable =
    staff &&
    user?.can_review_talent === true &&
    record.holder_user_id !== user.id &&
    record.reviewer?.id === user.id &&
    (record.status === 'in_review' || record.status === 'review_concluded');
  return (
    <div id="revision" className="pilot-record-stack">
      {staff ? <ReviewPanel record={record} refresh={refresh} /> : null}
      <section
        id="revision-documental"
        className="pilot-review-section"
        aria-label="Revisión documental"
      >
        <Typography.Title level={3}>Revisión documental</Typography.Title>
        <ConclusionHistory record={record} />
        {record.document_conclusions.length === 0 ? (
          <Empty description="Sin conclusiones documentales" />
        ) : null}
        {actionable ? (
          <ConcludeBlock
            key={record.id + ':' + record.version}
            record={record}
            refresh={refresh}
          />
        ) : null}
      </section>
      <section
        id="revision-academica"
        className="pilot-review-section"
        aria-label="Revisión académica"
      >
        {actionable ? (
          <AcademicReviewBlock record={record} refresh={refresh} />
        ) : (
          <>
            <Typography.Title level={3}>Revisión académica</Typography.Title>
            <AcademicReviewHistory record={record} />
            {record.academic_reviews.reviews.length === 0 ? (
              <Empty description="Sin revisiones académicas registradas" />
            ) : null}
          </>
        )}
      </section>
      <section
        id="revision-cv"
        className="pilot-review-section"
        aria-label="Revisión del CV"
      >
        {actionable ? (
          <CvReviewBlock record={record} refresh={refresh} />
        ) : (
          <>
            <Typography.Title level={3}>Revisión del CV</Typography.Title>
            <CvReviewHistory record={record} />
            {record.cv_reviews.reviews.length === 0 ? (
              <Empty description="Sin revisiones del CV registradas" />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function ReviewPanel({
  record,
  refresh,
}: {
  record: RecordDetail;
  refresh: () => Promise<void>;
}) {
  const { session, user, generation } = usePilotSession();
  const [form] = Form.useForm<{ content: string }>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [correction, setCorrection] = useState(false);
  const [reload, setReload] = useState(false);
  const lock = useRef(false);
  const self = record.holder_user_id === user?.id;
  const assigned = record.reviewer?.id === user?.id;
  async function action(
    kind: 'tomar' | 'observaciones' | 'solicitar-correccion'
  ) {
    if (lock.current) return;
    let content: string | undefined;
    if (kind !== 'tomar') {
      try {
        content = (await form.validateFields()).content.trim();
      } catch {
        return;
      }
    }
    lock.current = true;
    setPending(true);
    setFailure(null);
    try {
      const saved = await session.run((signal) =>
        pilotApi.review(record.id, kind, record.version, content, signal)
      );
      if (generation !== session.snapshot.generation) return;
      session.client.setQueryData(
        session.key('staff-detail', record.id),
        saved
      );
      form.resetFields();
      setCorrection(false);
      await refresh();
    } catch (error) {
      if (!isCancel(error) && generation === session.snapshot.generation) {
        setFailure(error);
        form.setFields([
          { name: 'content', errors: fieldErrors(error).content ?? [] },
        ]);
      }
    } finally {
      lock.current = false;
      if (generation === session.snapshot.generation) setPending(false);
    }
  }
  if (user?.can_review_talent !== true || self)
    return self ? (
      <Alert type="warning" title="No podés revisar tu propia inscripción." />
    ) : null;
  return (
    <Card className="pilot-review-panel" title="Revisión privada">
      {record.status === 'correction_requested' ? (
        <Typography.Paragraph>
          Esperá a que el titular atienda las observaciones y reenvíe su
          inscripción.
        </Typography.Paragraph>
      ) : null}
      {record.reviewer && !assigned ? (
        <Typography.Paragraph>
          Revisión asignada a {record.reviewer.name}.
        </Typography.Paragraph>
      ) : null}
      {failure ? (
        <Alert
          type="error"
          title={errorText(failure)}
          action={
            httpStatus(failure) === 409 ? (
              <Button onClick={() => setReload(true)}>
                Recargar inscripción
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {record.status === 'submitted' && (!record.reviewer || assigned) ? (
        <Button
          type="primary"
          loading={pending}
          onClick={() => void action('tomar')}
        >
          Tomar revisión
        </Button>
      ) : null}
      {assigned &&
      (record.status === 'in_review' ||
        record.status === 'review_concluded') ? (
        <Form form={form} layout="vertical" disabled={pending}>
          <Form.Item
            name="content"
            label="Observación o motivo de corrección"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Escribí el contenido de la observación.',
              },
              { max: 4000, message: 'Máximo 4000 caracteres.' },
            ]}
          >
            <Input.TextArea rows={5} maxLength={4000} showCount />
          </Form.Item>
          <Flex gap={12} wrap>
            <Button
              loading={pending}
              onClick={() => void action('observaciones')}
            >
              Registrar observación
            </Button>
            <Button
              type="primary"
              disabled={pending}
              onClick={() =>
                void form
                  .validateFields()
                  .then(() => setCorrection(true))
                  .catch(() => undefined)
              }
            >
              Solicitar corrección
            </Button>
          </Flex>
        </Form>
      ) : null}
      <Modal
        open={correction}
        title="Solicitar corrección al titular"
        okText="Solicitar corrección"
        cancelText="Volver"
        confirmLoading={pending}
        closable={!pending}
        mask={{ closable: !pending }}
        cancelButtonProps={{ disabled: pending }}
        onCancel={() => setCorrection(false)}
        onOk={() => void action('solicitar-correccion')}
      >
        <Typography.Paragraph>
          El titular podrá corregir los datos y documentos y volver a enviar su
          inscripción.
        </Typography.Paragraph>
      </Modal>
      <Modal
        open={reload}
        title="Recargar expediente"
        okText="Descartar y recargar"
        cancelText="Conservar observación"
        onCancel={() => setReload(false)}
        onOk={() => {
          form.resetFields();
          setReload(false);
          void refresh();
        }}
      >
        <Typography.Paragraph>
          Se descartará el texto local y se consultará la versión actual.
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
}

function currentDocuments(record: RecordDetail) {
  const latest = new Map<string, DocumentMetadata>();
  for (const document of record.documents) {
    if (
      !latest.has(document.type) ||
      latest.get(document.type)!.version < document.version
    )
      latest.set(document.type, document);
  }
  return [...latest.values()].sort((a, b) => a.type.localeCompare(b.type));
}

function useReviewSubmit() {
  const { session, generation } = usePilotSession();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const lock = useRef(false);
  async function run(
    operation: (signal: AbortSignal) => Promise<RecordDetail>,
    onSaved: () => void,
    refresh: () => Promise<void>
  ) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setFailure(null);
    try {
      const saved = await session.run(operation);
      if (generation !== session.snapshot.generation) return;
      session.client.setQueryData(session.key('staff-detail', saved.id), saved);
      onSaved();
      await refresh();
    } catch (error) {
      if (!isCancel(error) && generation === session.snapshot.generation)
        setFailure(error);
    } finally {
      lock.current = false;
      if (generation === session.snapshot.generation) setPending(false);
    }
  }
  return { pending, failure, run };
}

function ConclusionHistory({ record }: { record: RecordDetail }) {
  if (!record.document_conclusions.length) return null;
  return (
    <div>
      <Typography.Title level={4}>Conclusiones documentales</Typography.Title>
      {record.document_conclusions.map((item) => (
        <div key={item.id}>
          <Typography.Paragraph>{item.summary}</Typography.Paragraph>
          <ReviewFacts
            items={[
              {
                key: 'reviewer',
                label: 'Responsable',
                children: item.reviewer.name,
              },
              {
                key: 'date',
                label: 'Fecha',
                children: new Date(item.created_at).toLocaleString('es-BO'),
              },
              ...Object.entries(item.versions).map(([type, doc]) => ({
                key: type,
                label: 'Versión revisada',
                children:
                  type + ' · versión ' + doc.version + ' · documento ' + doc.id,
              })),
            ]}
          />
        </div>
      ))}
    </div>
  );
}

type ReviewFact = { key: string; label?: ReactNode; children?: ReactNode };

// One structure for every width: CSS puts the value beside its label on wide
// screens and below it on narrow ones, so a summary can never clip its content.
function ReviewFacts({ items }: { items: ReviewFact[] }) {
  return (
    <dl className="pilot-review-facts">
      {items.map((item) => (
        <div className="pilot-review-fact" key={item.key}>
          <dt>{item.label}</dt>
          <dd>{item.children}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewDocumentDownload({
  record,
  id,
  label,
}: {
  record: RecordDetail;
  id: string;
  label: string;
}) {
  const { session, generation } = usePilotSession();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const lock = useRef(false);
  async function download() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setFailure(null);
    try {
      const blob = await session.run((signal) =>
        pilotApi.download(record.id, id, signal)
      );
      if (generation !== session.snapshot.generation) return;
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download =
          record.documents.find((doc) => doc.id === id)?.original_name ?? label;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (!isCancel(error) && generation === session.snapshot.generation)
        setFailure(error);
    } finally {
      lock.current = false;
      if (generation === session.snapshot.generation) setPending(false);
    }
  }
  return (
    <>
      <Button loading={pending} onClick={() => void download()}>
        Descargar {label}
      </Button>
      {failure ? <Alert type="error" title={errorText(failure)} /> : null}
    </>
  );
}

function AcademicReviewHistory({ record }: { record: RecordDetail }) {
  return (
    <div>
      {record.academic_reviews.pendiente ? (
        <Alert type="info" showIcon title="Revisión académica pendiente." />
      ) : null}
      {record.academic_reviews.reviews.map((item) => (
        <div key={item.id}>
          <Tag>{item.vigente ? 'Vigente' : 'Anterior'}</Tag>
          <ReviewFacts
            items={[
              {
                key: 'ppa',
                label: 'PPA revisado',
                children: item.reviewed_ppa ?? 'Pendiente',
              },
              {
                key: 'then',
                label: 'PPA declarado al revisar',
                children:
                  'Declarado entonces: ' +
                  (item.declared_ppa_snapshot ?? 'No declarado'),
              },
              {
                key: 'now',
                label: 'PPA declarado actual',
                children:
                  'Declarado ahora: ' +
                  (record.academic.declared_ppa ?? 'No declarado'),
              },
              {
                key: 'observations',
                label: 'Observaciones',
                children: item.observations,
              },
              {
                key: 'reviewer',
                label: 'Responsable',
                children: item.reviewer.name,
              },
              {
                key: 'date',
                label: 'Fecha',
                children: new Date(item.created_at).toLocaleString('es-BO'),
              },
              {
                key: 'document',
                label: 'Histórico utilizado',
                children: (
                  <Flex vertical gap="small" align="start">
                    <Typography.Text>
                      Histórico versión {item.historico_document_version}
                    </Typography.Text>
                    <ReviewDocumentDownload
                      record={record}
                      id={item.historico_document_id}
                      label={
                        'histórico versión ' + item.historico_document_version
                      }
                    />
                  </Flex>
                ),
              },
            ]}
          />
          {item.declared_ppa_changed ? (
            <Alert
              type="info"
              title="El valor declarado cambió después de esta revisión."
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CvReviewHistory({ record }: { record: RecordDetail }) {
  return (
    <div>
      {record.cv_reviews.pendiente ? (
        <Alert type="info" showIcon title="CV pendiente de revisión." />
      ) : null}
      {record.cv_reviews.reviews.map((item) => (
        <div key={item.id}>
          <Tag>{item.vigente ? 'Vigente' : 'Anterior'}</Tag>
          <ReviewFacts
            items={[
              {
                key: 'document',
                label: 'CV utilizado',
                children: item.absent ? (
                  'Ausencia registrada'
                ) : (
                  <Flex vertical gap="small" align="start">
                    <Typography.Text>
                      CV versión {item.cv_document_version}
                    </Typography.Text>
                    {item.cv_document_id ? (
                      <ReviewDocumentDownload
                        record={record}
                        id={item.cv_document_id}
                        label={'CV versión ' + item.cv_document_version}
                      />
                    ) : null}
                  </Flex>
                ),
              },
              {
                key: 'observations',
                label: 'Observaciones',
                children: item.observations,
              },
              {
                key: 'reviewer',
                label: 'Responsable',
                children: item.reviewer.name,
              },
              {
                key: 'date',
                label: 'Fecha',
                children: new Date(item.created_at).toLocaleString('es-BO'),
              },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

function ConcludeBlock({
  record,
  refresh,
}: {
  record: RecordDetail;
  refresh: () => Promise<void>;
}) {
  const [form] = Form.useForm<{ summary: string }>();
  const [confirm, setConfirm] = useState(false);
  const submit = useReviewSubmit();
  const current = currentDocuments(record);
  if (record.status !== 'in_review') return null;
  async function save(values: { summary: string }) {
    const documents = current.map((document) => ({
      type: document.type,
      id: document.id,
      version: document.version,
    }));
    await submit.run(
      (signal) =>
        pilotApi.review(
          record.id,
          'concluir-revision',
          record.version,
          values.summary.trim(),
          signal,
          {
            documents,
          }
        ),
      () => {
        form.resetFields();
        setConfirm(false);
      },
      refresh
    );
  }
  return (
    <div>
      <Typography.Title level={4}>Conclusión documental</Typography.Title>
      <Typography.Paragraph type="secondary">
        Registra responsable, fecha y las versiones vigentes. No admite, aprueba
        ni publica.
      </Typography.Paragraph>
      <Descriptions
        size="small"
        column={1}
        items={current.map((document) => ({
          key: document.type,
          label: document.original_name,
          children: `Versión ${document.version}`,
        }))}
      />
      {submit.failure ? (
        <Alert type="error" showIcon title={errorText(submit.failure)} />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        disabled={submit.pending}
        onFinish={(values) => void save(values)}
      >
        <Form.Item
          name="summary"
          label="Resumen de la revisión"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Escribí el resumen de la revisión.',
            },
            { max: 4000, message: 'Máximo 4000 caracteres.' },
          ]}
        >
          <Input.TextArea rows={4} maxLength={4000} showCount />
        </Form.Item>
        <Button
          type="primary"
          loading={submit.pending}
          onClick={() =>
            void form
              .validateFields()
              .then(() => setConfirm(true))
              .catch(() => undefined)
          }
        >
          Concluir revisión documental
        </Button>
      </Form>
      <Modal
        open={confirm}
        title="Confirmar conclusión documental"
        okText="Confirmar conclusión"
        cancelText="Volver"
        confirmLoading={submit.pending}
        closable={!submit.pending}
        mask={{ closable: !submit.pending }}
        cancelButtonProps={{ disabled: submit.pending }}
        onCancel={() => setConfirm(false)}
        onOk={() => form.submit()}
      >
        <Typography.Paragraph>
          Quedarán registradas estas versiones como revisadas:
        </Typography.Paragraph>
        <Descriptions
          size="small"
          column={1}
          items={current.map((document) => ({
            key: document.type,
            label: document.original_name,
            children: `Versión ${document.version}`,
          }))}
        />
      </Modal>
    </div>
  );
}

function AcademicReviewBlock({
  record,
  refresh,
}: {
  record: RecordDetail;
  refresh: () => Promise<void>;
}) {
  const [form] = Form.useForm<{
    reviewed_ppa?: string;
    historico_document_id: string;
    observations: string;
  }>();
  const submit = useReviewSubmit();
  const historicos = record.documents
    .filter((document) => document.type === 'historico')
    .sort((a, b) => b.version - a.version);
  async function save(values: {
    reviewed_ppa?: string;
    historico_document_id: string;
    observations: string;
  }) {
    await submit.run(
      (signal) =>
        pilotApi.review(
          record.id,
          'revision-academica',
          record.version,
          undefined,
          signal,
          {
            reviewed_ppa: values.reviewed_ppa?.trim() || null,
            historico_document_id: values.historico_document_id,
            observations: values.observations.trim(),
          }
        ),
      () => form.resetFields(),
      refresh
    );
  }
  return (
    <div>
      <Typography.Title level={3}>Revisión académica</Typography.Title>
      <AcademicReviewHistory record={record} />
      {submit.failure ? (
        <Alert type="error" showIcon title={errorText(submit.failure)} />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        disabled={submit.pending}
        onFinish={(values) => void save(values)}
      >
        <Form.Item name="reviewed_ppa" label="PPA revisado (opcional)">
          <Input maxLength={64} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="historico_document_id"
          label="Histórico utilizado"
          rules={[{ required: true, message: 'Elegí el histórico utilizado.' }]}
        >
          <Select
            virtual={false}
            placeholder="Elegí la versión del histórico"
            options={historicos.map((document) => ({
              value: document.id,
              label: `${document.original_name} · versión ${document.version}`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="observations"
          label="Observaciones académicas"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Escribí las observaciones.',
            },
            { max: 4000, message: 'Máximo 4000 caracteres.' },
          ]}
        >
          <Input.TextArea rows={4} maxLength={4000} showCount />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submit.pending}>
          Registrar revisión académica
        </Button>
      </Form>
    </div>
  );
}

function CvReviewBlock({
  record,
  refresh,
}: {
  record: RecordDetail;
  refresh: () => Promise<void>;
}) {
  const [form] = Form.useForm<{
    absent?: boolean;
    cv_document_id?: string;
    cv_observations: string;
  }>();
  const submit = useReviewSubmit();
  const cvs = record.documents
    .filter((document) => document.type === 'cv')
    .sort((a, b) => b.version - a.version);
  const validationMessage =
    httpStatus(submit.failure) === 422
      ? (submit.failure as { response?: { data?: { message?: unknown } } })
          .response?.data?.message
      : undefined;
  async function save(values: {
    absent?: boolean;
    cv_document_id?: string;
    cv_observations: string;
  }) {
    await submit.run(
      (signal) =>
        pilotApi.review(
          record.id,
          'revision-cv',
          record.version,
          undefined,
          signal,
          {
            ...(cvs.length === 0 && values.absent
              ? { absent: true }
              : { cv_document_id: values.cv_document_id }),
            observations: values.cv_observations.trim(),
          }
        ),
      () => form.resetFields(),
      refresh
    );
  }
  return (
    <div>
      <Typography.Title level={3}>Revisión del CV</Typography.Title>
      {cvs.length === 0 ? (
        <Typography.Paragraph type="secondary">
          Sin CV adjunto en el expediente.
        </Typography.Paragraph>
      ) : null}
      <CvReviewHistory record={record} />
      {submit.failure ? (
        <Alert
          type="error"
          showIcon
          title={
            typeof validationMessage === 'string'
              ? validationMessage
              : errorText(submit.failure)
          }
          description={Object.values(fieldErrors(submit.failure))
            .flat()
            .map((text, index) => (
              <div key={index}>{text}</div>
            ))}
        />
      ) : null}
      <Form
        form={form}
        layout="vertical"
        disabled={submit.pending}
        onFinish={(values) => void save(values)}
      >
        {cvs.length > 0 ? (
          <Form.Item
            name="cv_document_id"
            label="Versión del CV"
            rules={[{ required: true, message: 'Elegí la versión del CV.' }]}
          >
            <Select
              virtual={false}
              placeholder="Elegí la versión del CV"
              options={cvs.map((document) => ({
                value: document.id,
                label: `${document.original_name} · versión ${document.version}`,
              }))}
            />
          </Form.Item>
        ) : null}
        {cvs.length === 0 ? (
          <Form.Item
            name="absent"
            valuePropName="checked"
            rules={[
              {
                validator: (_, checked) =>
                  checked
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('Marcá la ausencia de CV para registrarla.')
                      ),
              },
            ]}
          >
            <Checkbox>Registrar ausencia de CV</Checkbox>
          </Form.Item>
        ) : null}
        <Form.Item
          name="cv_observations"
          label="Observaciones del CV"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Escribí las observaciones.',
            },
            { max: 4000, message: 'Máximo 4000 caracteres.' },
          ]}
        >
          <Input.TextArea rows={4} maxLength={4000} showCount />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submit.pending}>
          Registrar revisión del CV
        </Button>
      </Form>
    </div>
  );
}
