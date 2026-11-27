import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { AdvancedTable } from '../components/shared/advanced-table/advanced-table';
import { PageIntro } from './presentation';
import { formatRecordDate } from './presentation-data';
import { errorText, fieldErrors, httpStatus } from './api';
import { usePilotSession } from './context';
import { useServiceAccess } from './services-access';
import { servicesApi } from './services-api';
import { JobDescriptionFields, ServiceRequestFields } from './services-fields';
import {
  descriptionFormValues,
  descriptionPayload,
  requestFormValues,
  requestPayload,
  type DescriptionFormValues,
  type RequestFormValues,
} from './services-form';
import { applyFieldErrors } from './services-form';
import {
  actorKindLabels,
  formatSalary,
  languageLevelLabels,
  modalityLabels,
  paymentSchemeLabels,
  serviceActionLabels,
  serviceStatusColors,
  serviceStatusLabels,
  serviceStatusOptions,
  travelLabels,
  workdayLabels,
} from './services-labels';
import type {
  ServiceArea,
  ServiceCandidate,
  ServiceListFilters,
  ServiceRequestDetail,
  ServiceRequestStatus,
  ServiceRequestSummary,
} from './services-types';
import './services.css';

const areaPath: Record<ServiceArea, string> = {
  company: '/empresa/servicios',
  staff: '/personal/servicios',
};

type CompanyRequestValues = RequestFormValues & {
  description?: DescriptionFormValues;
};

const areaTitle: Record<ServiceArea, string> = {
  company: 'Solicitudes de mi empresa',
  staff: 'Bandeja de servicios',
};

const areaDescription: Record<ServiceArea, string> = {
  company:
    'Solicitudes de servicio vinculadas a tu empresa. Podés editar la solicitud y la descripción del cargo, y trabajar con sus candidatos.',
  staff:
    'Solicitudes de servicio de todas las empresas. El personal vincula las solicitudes públicas a una empresa, edita con control de versión y registra candidatos.',
};

const fieldLabels: Record<string, string> = {
  status: 'Estado',
  company_name: 'Nombre de la empresa',
  contact_name: 'Nombre del solicitante',
  contact_position: 'Cargo del solicitante',
  contact_area: 'Área / Departamento',
  contact_email: 'Correo electrónico',
  contact_phone: 'Teléfono de contacto',
  position_title: 'Título exacto del puesto',
  vacancies: 'Número de vacantes',
  modality: 'Modalidad de trabajo',
  workday: 'Tipo de jornada',
  location: 'Ubicación física',
  salary_currency: 'Moneda',
  salary_min: 'Monto mínimo',
  salary_max: 'Monto máximo',
  payment_scheme: 'Esquema de pago',
  benefits: 'Prestaciones y beneficios',
  required_education: 'Formación académica',
  required_knowledge: 'Otros conocimientos específicos',
  required_experience: 'Tiempo de experiencia mínima',
  languages: 'Idiomas (idioma y nivel)',
  deadline: 'Fecha límite para recibir terna',
  company_id: 'Empresa',
  area: 'Área / Departamento',
  reports_to: 'Reporta a (Jefe Directo)',
  headcount: 'Personal a Cargo',
  objective: 'Objetivo general del puesto',
  activities: 'Actividades y funciones principales',
  work_schedule: 'Modalidad y horario',
  travel: 'Disponibilidad para viajar',
  work_environment: 'Ambiente / esfuerzo físico',
  full_name: 'Nombre completo del candidato',
  notes: 'Notas del candidato',
  candidate_id: 'Candidato',
};

function shownValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'vacío';
  if (Array.isArray(value))
    return value.length
      ? value.map((item) => shownValue(item)).join('; ')
      : 'vacío';
  if (typeof value === 'object')
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${shownValue(item)}`)
      .join(', ');
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

function StatusTag({ status }: { status: ServiceRequestStatus }) {
  return (
    <Tag color={serviceStatusColors[status]} variant="filled">
      {serviceStatusLabels[status]}
    </Tag>
  );
}

function QueryFailure({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Alert
      showIcon
      type="error"
      title={errorText(error)}
      action={<Button onClick={retry}>Reintentar</Button>}
    />
  );
}

export function ServiceRequestListPage({ area }: { area: ServiceArea }) {
  const { session } = usePilotSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ServiceListFilters>({});
  const query = useQuery({
    queryKey: session.key(
      'services',
      area,
      page,
      filters.search ?? '',
      filters.status ?? ''
    ),
    queryFn: ({ signal }) =>
      session.run(
        (request) => servicesApi.list(page, filters, request),
        signal
      ),
  });
  const filtered = Boolean(filters.search || filters.status);
  const path = areaPath[area];
  return (
    <Container className="pilot-service-container">
      <Card>
        <div className="pilot-service-stack">
          <PageIntro
            title={areaTitle[area]}
            description={areaDescription[area]}
          />
          <Flex gap={12} wrap>
            <Link to={path + '/nueva'}>
              <Button type="primary">Nueva solicitud</Button>
            </Link>
            <Button
              onClick={() => void query.refetch()}
              loading={query.isFetching}
            >
              Actualizar
            </Button>
          </Flex>
          <form
            className="pilot-service-filters"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setFilters((current) => ({
                ...current,
                search: search.trim() || undefined,
              }));
            }}
          >
            <div className="pilot-service-search">
              <label htmlFor="pilot-service-search">
                Buscar por folio, empresa o puesto
              </label>
              <Input
                id="pilot-service-search"
                value={search}
                maxLength={200}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="pilot-service-status">
              <label htmlFor="pilot-service-status">Estado</label>
              <Select<ServiceRequestStatus | ''>
                id="pilot-service-status"
                virtual={false}
                value={filters.status ?? ''}
                options={[
                  { value: '', label: 'Todos los estados' },
                  ...serviceStatusOptions,
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
          {query.isPending ? (
            <div role="status" className="pilot-service-loading">
              <Spin /> Cargando solicitudes…
            </div>
          ) : query.isError ? (
            <QueryFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            <>
              <div className="pilot-record-table">
                <AdvancedTable
                  title="Solicitudes de servicio"
                  exportable={false}
                  refreshable
                  refreshText="Actualizar"
                  onRefresh={() => void query.refetch()}
                  scroll={{ x: 880 }}
                  rowKey="id"
                  dataSource={query.data.data}
                  paginated={false}
                  loading={query.isFetching}
                  locale={{
                    emptyText: (
                      <Empty
                        description={
                          filtered
                            ? 'No hay coincidencias. Probá otra búsqueda o limpiá los filtros.'
                            : area === 'company'
                              ? 'Tu empresa todavía no tiene solicitudes vinculadas.'
                              : 'No hay solicitudes de servicio registradas.'
                        }
                      />
                    ),
                  }}
                  columns={[
                    {
                      title: 'Folio',
                      dataIndex: 'folio',
                      width: 140,
                      render: (folio: string, item: ServiceRequestSummary) => (
                        <Link
                          aria-label={'Abrir solicitud ' + folio}
                          to={path + '/' + item.id}
                        >
                          {folio}
                        </Link>
                      ),
                    },
                    {
                      title: 'Empresa',
                      dataIndex: 'company_name',
                      width: 200,
                      render: (name: string, item: ServiceRequestSummary) =>
                        item.company ? item.company.name : name,
                    },
                    {
                      title: 'Puesto',
                      dataIndex: 'position_title',
                      width: 200,
                    },
                    {
                      title: 'Vacantes',
                      dataIndex: 'vacancies',
                      width: 100,
                    },
                    {
                      title: 'Plazo',
                      dataIndex: 'deadline',
                      width: 130,
                      render: (deadline: string | null) =>
                        deadline ?? 'No informado',
                    },
                    {
                      title: 'Estado',
                      dataIndex: 'status',
                      width: 180,
                      render: (status: ServiceRequestStatus) => (
                        <StatusTag status={status} />
                      ),
                    },
                    {
                      title: 'Candidatos',
                      dataIndex: 'candidates_count',
                      width: 110,
                    },
                    {
                      title: 'Acción',
                      key: 'open',
                      width: 150,
                      render: (_: unknown, item: ServiceRequestSummary) => (
                        <Link
                          aria-label={'Abrir solicitud ' + item.folio}
                          to={path + '/' + item.id}
                        >
                          Abrir solicitud
                        </Link>
                      ),
                    },
                  ]}
                />
              </div>
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

/**
 * S2.2.2: alta autenticada con S11-B/S11-C. La empresa del responsable la resuelve el
 * servidor desde su vinculación activa; sólo se pregunta si tiene más de una, y el personal
 * indica el identificador que entrega `pilot:company list`.
 */
export function ServiceRequestCreatePage({ area }: { area: ServiceArea }) {
  const { session } = usePilotSession();
  const navigate = useNavigate();
  const access = useServiceAccess(true);
  const [form] = Form.useForm<CompanyRequestValues>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [companyId, setCompanyId] = useState('');
  const [values, setValues] = useState<CompanyRequestValues>({});
  const companies = access.data?.companies ?? [];
  const chooseCompany = area === 'staff' || companies.length > 1;

  async function submit() {
    let current: CompanyRequestValues;
    try {
      current = await form.validateFields();
    } catch {
      return;
    }
    setPending(true);
    setFailure(null);
    try {
      const created = await session.run((request) =>
        servicesApi.createCompanyRequest(
          {
            ...requestPayload(current),
            description: descriptionPayload(current.description ?? {}),
            ...(chooseCompany && companyId.trim() !== ''
              ? { company_id: companyId.trim() }
              : {}),
          },
          request
        )
      );
      navigate(areaPath[area] + '/' + created.solicitud.id);
    } catch (error) {
      setFailure(error);
      applyFieldErrors(form, fieldErrors(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="pilot-service-container">
      <Card>
        <div className="pilot-service-stack">
          <PageIntro
            title="Nueva solicitud de servicio"
            description={
              area === 'company'
                ? 'La solicitud queda vinculada a tu empresa: la empresa la resuelve el servidor a partir de la vinculación activa.'
                : 'El personal puede crear la solicitud para una empresa activa o sin atribución, igual que un alta pública.'
            }
          />
          <Link to={areaPath[area]}>Volver a {areaTitle[area]}</Link>
          {failure ? (
            <Alert
              type="error"
              showIcon
              title={errorText(failure)}
              description="No se guardó nada. Revisá los datos indicados y volvé a enviar."
            />
          ) : null}
          {chooseCompany ? (
            <div className="pilot-service-company-input">
              <label htmlFor="pilot-service-new-company">
                {area === 'staff'
                  ? 'ID de la empresa (opcional)'
                  : 'Empresa de la solicitud'}
              </label>
              {area === 'staff' ? (
                <Input
                  id="pilot-service-new-company"
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  placeholder="Identificador entregado por pilot:company list"
                />
              ) : (
                <Select
                  id="pilot-service-new-company"
                  virtual={false}
                  value={companyId}
                  placeholder="Seleccioná la empresa"
                  options={companies.map((company) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                  onChange={setCompanyId}
                />
              )}
            </div>
          ) : null}
          <Form
            form={form}
            layout="vertical"
            disabled={pending}
            requiredMark={false}
            initialValues={{ languages: [] }}
            onValuesChange={(_, all) => setValues(all as CompanyRequestValues)}
            onFinish={submit}
          >
            <ServiceRequestFields />
            <JobDescriptionFields
              positionTitle={values.position_title ?? ''}
              prefix={['description']}
            />
            <Flex gap={12} wrap className="pilot-service-actions">
              <Button type="primary" htmlType="submit" loading={pending}>
                Crear solicitud
              </Button>
              <Link to={areaPath[area]}>
                <Button>Cancelar</Button>
              </Link>
            </Flex>
          </Form>
        </div>
      </Card>
    </Container>
  );
}

function RequestDescription({ detail }: { detail: ServiceRequestDetail }) {
  const solicitud = detail.solicitud;
  return (
    <Descriptions
      className="pilot-service-descriptions"
      bordered
      size="small"
      column={1}
      items={[
        {
          key: 'company',
          label: 'Nombre de la empresa',
          children: solicitud.company
            ? `${solicitud.company.name} (${solicitud.company_name})`
            : solicitud.company_name,
        },
        {
          key: 'contact',
          label: 'Nombre del solicitante',
          children: solicitud.contact_name,
        },
        {
          key: 'contact_position',
          label: 'Cargo del solicitante',
          children: solicitud.contact_position,
        },
        {
          key: 'contact_area',
          label: 'Área / Departamento',
          children: solicitud.contact_area,
        },
        {
          key: 'contact_email',
          label: 'Correo electrónico',
          children: solicitud.contact_email,
        },
        {
          key: 'contact_phone',
          label: 'Teléfono de contacto',
          children: solicitud.contact_phone,
        },
        {
          key: 'position',
          label: 'Título exacto del puesto',
          children: solicitud.position_title,
        },
        {
          key: 'vacancies',
          label: 'Número de vacantes',
          children: solicitud.vacancies,
        },
        {
          key: 'modality',
          label: 'Modalidad de trabajo',
          children: modalityLabels[solicitud.modality],
        },
        {
          key: 'workday',
          label: 'Tipo de jornada',
          children: workdayLabels[solicitud.workday],
        },
        {
          key: 'location',
          label: 'Ubicación física',
          children: solicitud.location,
        },
        {
          key: 'salary',
          label: 'Rango salarial (opcional)',
          children: formatSalary(
            solicitud.salary_currency,
            solicitud.salary_min,
            solicitud.salary_max
          ),
        },
        {
          key: 'payment',
          label: 'Esquema de pago',
          children: paymentSchemeLabels[solicitud.payment_scheme],
        },
        {
          key: 'benefits',
          label: 'Prestaciones y beneficios (opcional)',
          children: solicitud.benefits?.trim()
            ? solicitud.benefits
            : 'No informado',
        },
        {
          key: 'education',
          label: 'Formación académica',
          children: solicitud.required_education,
        },
        {
          key: 'knowledge',
          label: 'Otros conocimientos específicos',
          children: solicitud.required_knowledge,
        },
        {
          key: 'experience',
          label: 'Tiempo de experiencia mínima',
          children: solicitud.required_experience,
        },
        {
          key: 'languages',
          label: 'Idiomas (idioma y nivel)',
          children: solicitud.languages.length
            ? solicitud.languages
                .map(
                  (row) => `${row.language} · ${languageLevelLabels[row.level]}`
                )
                .join('; ')
            : 'No informados',
        },
        {
          key: 'deadline',
          label: 'Fecha límite para recibir terna',
          children: solicitud.deadline ?? 'No informada',
        },
      ]}
    />
  );
}

function JobDescriptionDetail({ detail }: { detail: ServiceRequestDetail }) {
  const description = detail.descripcion;
  if (!description)
    return (
      <Alert
        type="warning"
        showIcon
        title="La solicitud no tiene descripción del cargo registrada."
      />
    );
  return (
    <Descriptions
      className="pilot-service-descriptions"
      bordered
      size="small"
      column={1}
      items={[
        {
          key: 'position',
          label: 'Nombre del puesto',
          children: description.position_title ?? 'No informado',
        },
        {
          key: 'area',
          label: 'Área / Departamento',
          children: description.area,
        },
        {
          key: 'reports_to',
          label: 'Reporta a (Jefe Directo)',
          children: description.reports_to,
        },
        {
          key: 'headcount',
          label: 'Personal a Cargo',
          children: description.headcount,
        },
        {
          key: 'objective',
          label: 'Objetivo general del puesto',
          children: description.objective,
        },
        {
          key: 'activities',
          label: 'Actividades y funciones principales',
          children: (
            <ol className="pilot-service-activities-summary">
              {description.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ol>
          ),
        },
        {
          key: 'education',
          label: 'Nivel de estudios / carrera',
          children: description.required_education,
        },
        {
          key: 'knowledge',
          label: 'Conocimientos técnicos / software',
          children: description.required_knowledge,
        },
        {
          key: 'experience',
          label: 'Experiencia previa mínima',
          children: description.required_experience,
        },
        {
          key: 'schedule',
          label: 'Modalidad y horario',
          children: description.work_schedule,
        },
        {
          key: 'travel',
          label: 'Disponibilidad para viajar',
          children: travelLabels[description.travel],
        },
        {
          key: 'environment',
          label: 'Ambiente / esfuerzo físico',
          children: description.work_environment,
        },
      ]}
    />
  );
}

function CandidatePanel({
  detail,
  onSaved,
}: {
  detail: ServiceRequestDetail;
  onSaved: (detail: ServiceRequestDetail) => void;
}) {
  const { session } = usePilotSession();
  const [form] = Form.useForm<{
    full_name: string;
    contact_email?: string;
    contact_phone?: string;
    notes?: string;
  }>();
  const [editing, setEditing] = useState<ServiceCandidate | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);

  function start(candidate: ServiceCandidate | null) {
    setEditing(candidate);
    setFailure(null);
    form.resetFields();
    if (candidate)
      form.setFieldsValue({
        full_name: candidate.full_name,
        contact_email: candidate.contact_email ?? undefined,
        contact_phone: candidate.contact_phone ?? undefined,
        notes: candidate.notes ?? undefined,
      });
    setOpen(true);
  }

  async function save() {
    let values: {
      full_name: string;
      contact_email?: string;
      contact_phone?: string;
      notes?: string;
    };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setPending(true);
    setFailure(null);
    const input = {
      full_name: values.full_name.trim(),
      contact_email: values.contact_email?.trim() || null,
      contact_phone: values.contact_phone?.trim() || null,
      notes: values.notes?.trim() || null,
    };
    try {
      const updated = editing
        ? await session.run((request) =>
            servicesApi.updateCandidate(
              detail.solicitud.id,
              editing.id,
              { ...input, version: editing.version },
              request
            )
          )
        : await session.run((request) =>
            servicesApi.addCandidate(detail.solicitud.id, input, request)
          );
      onSaved(updated);
      setOpen(false);
      setEditing(null);
    } catch (error) {
      setFailure(error);
      applyFieldErrors(form, fieldErrors(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pilot-service-candidates">
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={2}>Candidatos</Typography.Title>
        <Button type="primary" onClick={() => start(null)}>
          Agregar candidato
        </Button>
      </Flex>
      {detail.candidatos.length ? (
        <div className="pilot-service-candidate-list">
          {detail.candidatos.map((candidate) => (
            <Card
              key={candidate.id}
              size="small"
              className="pilot-service-candidate"
            >
              <Descriptions
                size="small"
                column={1}
                items={[
                  {
                    key: 'name',
                    label: 'Nombre completo del candidato',
                    children: candidate.full_name,
                  },
                  {
                    key: 'email',
                    label: 'Correo de contacto',
                    children: candidate.contact_email ?? 'No informado',
                  },
                  {
                    key: 'phone',
                    label: 'Teléfono de contacto',
                    children: candidate.contact_phone ?? 'No informado',
                  },
                  {
                    key: 'notes',
                    label: 'Notas',
                    children: candidate.notes ?? 'Sin notas',
                  },
                  {
                    key: 'updated',
                    label: 'Última edición',
                    children: formatRecordDate(candidate.updated_at),
                  },
                ]}
              />
              <Button
                aria-label={'Editar candidato ' + candidate.full_name}
                onClick={() => start(candidate)}
              >
                Editar candidato
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Empty description="Todavía no hay candidatos vinculados a esta solicitud." />
      )}
      <Modal
        open={open}
        title={editing ? 'Editar candidato' : 'Agregar candidato'}
        okText="Guardar candidato"
        cancelText="Cancelar"
        confirmLoading={pending}
        mask={{ closable: false }}
        onOk={() => void save()}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        {failure ? (
          <Alert
            type="error"
            showIcon
            title={errorText(failure)}
            description={
              httpStatus(failure) === 409
                ? 'Otra edición cambió este candidato. Cerrá el formulario y abrí de nuevo el candidato para ver los datos vigentes.'
                : undefined
            }
          />
        ) : null}
        <Form
          form={form}
          layout="vertical"
          disabled={pending}
          requiredMark={false}
        >
          <Form.Item
            name="full_name"
            label="Nombre completo del candidato"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Ingresá el nombre completo del candidato.',
              },
              { max: 200, message: 'Máximo 200 caracteres.' },
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item
            name="contact_email"
            label="Correo de contacto"
            rules={[
              {
                type: 'email',
                message: 'Ingresá un correo electrónico válido.',
              },
              { max: 254, message: 'Máximo 254 caracteres.' },
            ]}
          >
            <Input maxLength={254} />
          </Form.Item>
          <Form.Item
            name="contact_phone"
            label="Teléfono de contacto"
            rules={[{ max: 50, message: 'Máximo 50 caracteres.' }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notas"
            rules={[{ max: 2000, message: 'Máximo 2000 caracteres.' }]}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary">
          El candidato no crea cuenta, no exige título universitario y no se
          publica en el banco de talento.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}

function HistoryPanel({ detail }: { detail: ServiceRequestDetail }) {
  return (
    <div className="pilot-service-history">
      <Typography.Title level={2}>Historial</Typography.Title>
      <ul>
        {detail.historial.map((event) => (
          <li key={event.id}>
            <Typography.Text strong>
              {serviceActionLabels[event.action] ?? event.action}
            </Typography.Text>
            <div className="pilot-service-history-meta">
              Versión {event.version} ·{' '}
              {actorKindLabels[event.actor_kind] ?? event.actor_kind}
              {event.actor ? ` · ${event.actor.name}` : ''} ·{' '}
              {formatRecordDate(event.created_at)}
            </div>
            <Descriptions
              size="small"
              column={1}
              className="pilot-service-history-changes"
              items={Object.entries(event.changes).map(
                ([field, change], index) => ({
                  key: field + index,
                  label: fieldLabels[field] ?? field,
                  children: `${shownValue(change.before)} → ${shownValue(
                    change.after
                  )}`,
                })
              )}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceRequestPage({ area }: { area: ServiceArea }) {
  const { id = '' } = useParams();
  const { session } = usePilotSession();
  const client = useQueryClient();
  const queryKey = session.key('service', id);
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      session.run((request) => servicesApi.detail(id, request), signal),
  });
  const [requestForm] = Form.useForm<RequestFormValues>();
  const [descriptionForm] = Form.useForm<DescriptionFormValues>();
  const [editingRequest, setEditingRequest] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [pending, setPending] = useState(false);
  const [requestFailure, setRequestFailure] = useState<unknown>(null);
  const [descriptionFailure, setDescriptionFailure] = useState<unknown>(null);
  const [linkFailure, setLinkFailure] = useState<unknown>(null);
  const [linkPending, setLinkPending] = useState(false);
  const [companyId, setCompanyId] = useState('');

  if (query.isPending)
    return (
      <Container className="pilot-service-container">
        <Card>
          <div role="status" className="pilot-service-loading">
            <Spin /> Cargando la solicitud…
          </div>
        </Card>
      </Container>
    );
  if (query.isError)
    return (
      <Container className="pilot-service-container">
        <Card>
          <QueryFailure
            error={query.error}
            retry={() => void query.refetch()}
          />
          <Link to={areaPath[area]}>Volver a {areaTitle[area]}</Link>
        </Card>
      </Container>
    );
  const detail = query.data;
  const save = (updated: ServiceRequestDetail) => {
    client.setQueryData(queryKey, updated);
  };
  const reload = async () => {
    await query.refetch();
  };

  function openRequestEditor() {
    requestForm.resetFields();
    requestForm.setFieldsValue(requestFormValues(detail));
    setRequestFailure(null);
    setEditingRequest(true);
  }

  function openDescriptionEditor() {
    descriptionForm.resetFields();
    descriptionForm.setFieldsValue(descriptionFormValues(detail));
    setDescriptionFailure(null);
    setEditingDescription(true);
  }

  async function submitRequest() {
    let values: RequestFormValues;
    try {
      values = await requestForm.validateFields();
    } catch {
      return;
    }
    setPending(true);
    setRequestFailure(null);
    try {
      const updated = await session.run((request) =>
        servicesApi.update(
          detail.solicitud.id,
          {
            ...requestPayload(values),
            version: detail.solicitud.version,
            ...(detail.solicitud.status === 'linked' || !values.status
              ? {}
              : { status: values.status }),
          },
          request
        )
      );
      save(updated);
      setEditingRequest(false);
    } catch (error) {
      setRequestFailure(error);
      form400(requestForm, error);
    } finally {
      setPending(false);
    }
  }

  async function submitDescription() {
    let values: DescriptionFormValues;
    try {
      values = await descriptionForm.validateFields();
    } catch {
      return;
    }
    setPending(true);
    setDescriptionFailure(null);
    try {
      const updated = await session.run((request) =>
        servicesApi.updateDescription(
          detail.solicitud.id,
          { ...descriptionPayload(values), version: detail.solicitud.version },
          request
        )
      );
      save(updated);
      setEditingDescription(false);
    } catch (error) {
      setDescriptionFailure(error);
      form400(descriptionForm, error);
    } finally {
      setPending(false);
    }
  }

  async function linkCompany() {
    setLinkPending(true);
    setLinkFailure(null);
    try {
      save(
        await session.run((request) =>
          servicesApi.linkCompany(
            detail.solicitud.id,
            companyId.trim(),
            detail.solicitud.version,
            request
          )
        )
      );
      setCompanyId('');
    } catch (error) {
      setLinkFailure(error);
    } finally {
      setLinkPending(false);
    }
  }

  return (
    <Container className="pilot-service-container">
      <div className="pilot-service-stack">
        <Card>
          <div className="pilot-service-stack">
            <PageIntro
              title={`Solicitud ${detail.solicitud.folio}`}
              description={
                detail.solicitud.company
                  ? `Empresa vinculada: ${detail.solicitud.company.name}.`
                  : 'Solicitud pública todavía no vinculada a una empresa.'
              }
              extra={
                <Flex gap={8} align="center" wrap>
                  <StatusTag status={detail.solicitud.status} />
                  <Tag variant="outlined">
                    Versión {detail.solicitud.version}
                  </Tag>
                </Flex>
              }
            />
            <Link to={areaPath[area]}>Volver a {areaTitle[area]}</Link>
            {detail.solicitud.company_id === null ? (
              area === 'staff' ? (
                <div className="pilot-service-link">
                  <Alert
                    type="info"
                    showIcon
                    title="Vinculación pendiente"
                    description="El alta pública nunca atribuye una empresa por nombre, correo ni dominio. La vinculación la realiza el personal y deja historial."
                  />
                  {linkFailure ? (
                    <Alert
                      type="error"
                      showIcon
                      title={errorText(linkFailure)}
                      description={
                        httpStatus(linkFailure) === 409
                          ? 'La solicitud ya está vinculada o su versión cambió. Actualizá la solicitud.'
                          : undefined
                      }
                    />
                  ) : null}
                  <Flex gap={12} wrap align="end">
                    <div className="pilot-service-company-input">
                      <label htmlFor="pilot-service-company">
                        ID de la empresa
                      </label>
                      <Input
                        id="pilot-service-company"
                        value={companyId}
                        onChange={(event) => setCompanyId(event.target.value)}
                        placeholder="Identificador entregado por pilot:company list"
                      />
                    </div>
                    <Button
                      type="primary"
                      loading={linkPending}
                      disabled={companyId.trim() === ''}
                      onClick={() => void linkCompany()}
                    >
                      Vincular empresa
                    </Button>
                    <Button onClick={() => void reload()}>Actualizar</Button>
                  </Flex>
                </div>
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  title="Tu empresa todavía no está vinculada a esta solicitud."
                  description="La vinculación la realiza el personal de la plataforma. Cuando esté registrada, la solicitud aparecerá en este panel."
                />
              )
            ) : null}
            <Flex gap={12} wrap>
              <Button type="primary" onClick={openRequestEditor}>
                Editar solicitud
              </Button>
              <Button onClick={openDescriptionEditor}>
                Editar descripción del cargo
              </Button>
              <Button onClick={() => void reload()} loading={query.isFetching}>
                Actualizar
              </Button>
            </Flex>
          </div>
        </Card>
        <Card>
          <Typography.Title level={2}>Solicitud de servicio</Typography.Title>
          <RequestDescription detail={detail} />
        </Card>
        <Card>
          <Typography.Title level={2}>Descripción del cargo</Typography.Title>
          <JobDescriptionDetail detail={detail} />
        </Card>
        <Card>
          <CandidatePanel detail={detail} onSaved={save} />
        </Card>
        <Card>
          <HistoryPanel detail={detail} />
        </Card>
      </div>
      <Modal
        open={editingRequest}
        title="Editar solicitud"
        okText="Guardar cambios"
        cancelText="Cancelar"
        width={880}
        confirmLoading={pending}
        mask={{ closable: false }}
        onOk={() => void submitRequest()}
        onCancel={() => setEditingRequest(false)}
        destroyOnHidden
      >
        {requestFailure ? (
          <Alert
            type="error"
            showIcon
            title={errorText(requestFailure)}
            description={
              httpStatus(requestFailure) === 409
                ? 'Otra persona editó la solicitud y cambió su versión. No se sobrescribieron tus cambios.'
                : undefined
            }
            action={
              httpStatus(requestFailure) === 409 ? (
                <Button
                  onClick={() => {
                    setEditingRequest(false);
                    void reload();
                  }}
                >
                  Recargar solicitud
                </Button>
              ) : undefined
            }
          />
        ) : null}
        <Form
          form={requestForm}
          layout="vertical"
          disabled={pending}
          requiredMark={false}
        >
          <ServiceRequestFields />
          {detail.solicitud.status === 'linked' ? (
            <Typography.Paragraph type="secondary">
              El estado lo fija la vinculación a la empresa y no se edita desde
              aquí.
            </Typography.Paragraph>
          ) : (
            <Form.Item name="status" label="Estado">
              <Select
                virtual={false}
                options={serviceStatusOptions.filter(
                  (option) => option.value !== 'linked'
                )}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
      <Modal
        open={editingDescription}
        title="Editar descripción del cargo"
        okText="Guardar descripción"
        cancelText="Cancelar"
        width={880}
        confirmLoading={pending}
        mask={{ closable: false }}
        onOk={() => void submitDescription()}
        onCancel={() => setEditingDescription(false)}
        destroyOnHidden
      >
        {descriptionFailure ? (
          <Alert
            type="error"
            showIcon
            title={errorText(descriptionFailure)}
            description={
              httpStatus(descriptionFailure) === 409
                ? 'Otra persona editó la solicitud y cambió su versión. No se sobrescribieron tus cambios.'
                : undefined
            }
            action={
              httpStatus(descriptionFailure) === 409 ? (
                <Button
                  onClick={() => {
                    setEditingDescription(false);
                    void reload();
                  }}
                >
                  Recargar solicitud
                </Button>
              ) : undefined
            }
          />
        ) : null}
        <Form
          form={descriptionForm}
          layout="vertical"
          disabled={pending}
          requiredMark={false}
        >
          <JobDescriptionFields
            positionTitle={detail.solicitud.position_title}
            prefix={[]}
          />
        </Form>
      </Modal>
    </Container>
  );
}

function form400(form: FormInstance, error: unknown) {
  applyFieldErrors(form, fieldErrors(error));
}
