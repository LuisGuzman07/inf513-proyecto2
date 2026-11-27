import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Flex,
  Form,
  Input,
  Result,
  Steps,
  Tag,
  Typography,
} from 'antd';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { PageIntro } from './presentation';
import { errorText, fieldErrors, httpStatus } from './api';
import { JobDescriptionFields, ServiceRequestFields } from './services-fields';
import { servicesApi } from './services-api';
import {
  applyFieldErrors,
  descriptionPayload,
  requestPayload,
  type DescriptionFormValues,
  type RequestFormValues,
} from './services-form';
import {
  formatSalary,
  languageLevelLabels,
  modalityLabels,
  paymentSchemeLabels,
  serviceStatusColors,
  serviceStatusLabels,
  travelLabels,
  workdayLabels,
} from './services-labels';
import type {
  ServiceConsult,
  ServiceFolio,
  ServiceRequestCreate,
} from './services-types';
import './services.css';

type SolicitudValues = RequestFormValues & {
  description?: DescriptionFormValues;
  confirmed?: boolean;
};

const requestFieldNames = [
  'company_name',
  'contact_name',
  'contact_position',
  'contact_area',
  'contact_email',
  'contact_phone',
  'position_title',
  'vacancies',
  'modality',
  'workday',
  'location',
  'salary_currency',
  'salary_min',
  'salary_max',
  'payment_scheme',
  'benefits',
  'required_education',
  'required_knowledge',
  'required_experience',
  'languages',
  'deadline',
];

const descriptionFieldNames = [
  'area',
  'reports_to',
  'headcount',
  'objective',
  'activities',
  'required_education',
  'required_knowledge',
  'required_experience',
  'work_schedule',
  'travel',
  'work_environment',
];

function SummaryRows({ values }: { values: SolicitudValues }) {
  const description = values.description ?? {};
  const languages = (values.languages ?? []).filter(
    (row) => (row.language ?? '').trim() !== ''
  );
  const rows: { key: string; label: string; children: ReactNode }[] = [
    {
      key: 'company',
      label: 'Nombre de la empresa',
      children: values.company_name,
    },
    {
      key: 'applicant',
      label: 'Nombre del solicitante',
      children: values.contact_name,
    },
    {
      key: 'applicant-position',
      label: 'Cargo del solicitante',
      children: values.contact_position,
    },
    {
      key: 'applicant-area',
      label: 'Área / Departamento',
      children: values.contact_area,
    },
    {
      key: 'email',
      label: 'Correo electrónico',
      children: values.contact_email,
    },
    {
      key: 'phone',
      label: 'Teléfono de contacto',
      children: values.contact_phone,
    },
    {
      key: 'title',
      label: 'Título exacto del puesto',
      children: values.position_title,
    },
    {
      key: 'vacancies',
      label: 'Número de vacantes',
      children: values.vacancies,
    },
    {
      key: 'modality',
      label: 'Modalidad de trabajo',
      children: values.modality ? modalityLabels[values.modality] : '',
    },
    {
      key: 'workday',
      label: 'Tipo de jornada',
      children: values.workday ? workdayLabels[values.workday] : '',
    },
    { key: 'location', label: 'Ubicación física', children: values.location },
    {
      key: 'salary',
      label: 'Rango salarial (opcional)',
      children: formatSalary(
        values.salary_currency ?? null,
        values.salary_min ?? null,
        values.salary_max ?? null
      ),
    },
    {
      key: 'payment',
      label: 'Esquema de pago',
      children: values.payment_scheme
        ? paymentSchemeLabels[values.payment_scheme]
        : '',
    },
    {
      key: 'benefits',
      label: 'Prestaciones y beneficios (opcional)',
      children: values.benefits?.trim() ? values.benefits : 'No informado',
    },
    {
      key: 'education',
      label: 'Formación académica',
      children: values.required_education,
    },
    {
      key: 'knowledge',
      label: 'Otros conocimientos específicos',
      children: values.required_knowledge,
    },
    {
      key: 'experience',
      label: 'Tiempo de experiencia mínima',
      children: values.required_experience,
    },
    {
      key: 'languages',
      label: 'Idiomas (idioma y nivel)',
      children: languages.length
        ? languages
            .map(
              (row) =>
                `${row.language} · ${
                  row.level ? languageLevelLabels[row.level] : ''
                }`
            )
            .join('; ')
        : 'No informados',
    },
    {
      key: 'deadline',
      label: 'Fecha límite para recibir terna',
      children: values.deadline ? values.deadline.format('YYYY-MM-DD') : '',
    },
    {
      key: 'description-title',
      label: 'Nombre del puesto (S11-C)',
      children: values.position_title,
    },
    {
      key: 'description-area',
      label: 'Área / Departamento (S11-C)',
      children: description.area,
    },
    {
      key: 'reports-to',
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
          {(description.activities ?? []).map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ol>
      ),
    },
    {
      key: 'description-education',
      label: 'Nivel de estudios / carrera',
      children: description.required_education,
    },
    {
      key: 'description-knowledge',
      label: 'Conocimientos técnicos / software',
      children: description.required_knowledge,
    },
    {
      key: 'description-experience',
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
      children: description.travel ? travelLabels[description.travel] : '',
    },
    {
      key: 'environment',
      label: 'Ambiente / esfuerzo físico',
      children: description.work_environment,
    },
  ];
  return (
    <Descriptions
      className="pilot-service-descriptions"
      bordered
      size="small"
      column={1}
      items={rows}
    />
  );
}

/** S2.4: formulario S11-B → S11-C → resumen → confirmación explícita → folio y código. */
export function SolicitudServicioPage() {
  const [form] = Form.useForm<SolicitudValues>();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [created, setCreated] = useState<ServiceFolio | null>(null);
  const [values, setValues] = useState<SolicitudValues>({});

  async function advance() {
    setFailure(null);
    try {
      await form.validateFields(
        step === 0
          ? requestFieldNames
          : descriptionFieldNames.map((name) => ['description', name])
      );
      setStep(step + 1);
    } catch {
      // Ant Design muestra el error en cada campo: no se avanza.
    }
  }

  async function submit() {
    setFailure(null);
    try {
      await form.validateFields([...requestFieldNames, 'confirmed']);
    } catch {
      return;
    }
    const current = form.getFieldsValue(true) as SolicitudValues;
    const payload: ServiceRequestCreate = {
      ...requestPayload(current),
      description: descriptionPayload(current.description ?? {}),
      confirmed: true,
    };
    setPending(true);
    const controller = new AbortController();
    try {
      setCreated(await servicesApi.create(payload, controller.signal));
    } catch (error) {
      setFailure(error);
      applyFieldErrors(form, fieldErrors(error));
    } finally {
      setPending(false);
    }
  }

  if (created)
    return (
      <Container className="pilot-service-container">
        <Card>
          <Result
            status="success"
            title="Solicitud enviada"
            subTitle={`Guardá el folio ${created.folio} y el código de acceso: el código se muestra una sola vez y no se puede recuperar.`}
            extra={
              <Flex gap={12} wrap>
                <Link to="/servicios/consulta">
                  <Button type="primary">Consultar esta solicitud</Button>
                </Link>
                <Link to="/">
                  <Button>Volver al inicio</Button>
                </Link>
              </Flex>
            }
          />
          <Alert
            type="warning"
            showIcon
            title="Guardá estos datos antes de continuar"
            description="El folio identifica la solicitud; el código de acceso es la única forma de consultarla sin cuenta. No se envían por correo y no se pueden recuperar."
          />
          <Descriptions
            className="pilot-service-descriptions"
            bordered
            size="small"
            column={1}
            items={[
              {
                key: 'folio',
                label: 'Folio',
                children: (
                  <Typography.Text
                    className="pilot-service-folio"
                    data-testid="service-folio"
                    strong
                    copyable
                  >
                    {created.folio}
                  </Typography.Text>
                ),
              },
              {
                key: 'access_code',
                label: 'Código de acceso',
                children: (
                  <Typography.Text
                    className="pilot-service-access-code"
                    data-testid="service-access-code"
                    strong
                    copyable
                  >
                    {created.access_code}
                  </Typography.Text>
                ),
              },
            ]}
          />
        </Card>
      </Container>
    );

  return (
    <Container className="pilot-service-container">
      <Card>
        <div className="pilot-service-stack">
          <PageIntro
            title="Solicitud de servicio de selección"
            description="La entrada empresarial acordada es consultar primero el talento universitario y después solicitar un servicio específico. El banco público de talento todavía no está disponible en esta versión, así que no se simulan perfiles ni consultas."
          />
          <Alert
            type="info"
            showIcon
            title="Qué incluye esta solicitud"
            description="Los datos de contacto y del puesto, el perfil requerido y la descripción de funciones. Honorarios, garantía de reposición y firmas quedan fuera de esta versión."
          />
          <Steps
            className="pilot-service-steps"
            current={step}
            items={[
              { title: 'Solicitud de servicio' },
              { title: 'Descripción del cargo' },
              { title: 'Resumen y confirmación' },
            ]}
          />
          {failure ? (
            <Alert
              type="error"
              showIcon
              title={errorText(failure)}
              description="No se guardó nada. Revisá los datos indicados y volvé a enviar."
            />
          ) : null}
          <Form
            form={form}
            layout="vertical"
            disabled={pending}
            requiredMark={false}
            initialValues={{ languages: [] }}
            onValuesChange={(_, all) => setValues(all as SolicitudValues)}
            onFinish={submit}
          >
            {step === 0 ? <ServiceRequestFields /> : null}
            {step === 1 ? (
              <JobDescriptionFields
                positionTitle={values.position_title ?? ''}
                prefix={['description']}
              />
            ) : null}
            {step === 2 ? (
              <>
                <Typography.Title level={2}>
                  Resumen de la solicitud
                </Typography.Title>
                <Typography.Paragraph type="secondary">
                  Revisá los datos antes de enviarlos. Después del envío el
                  folio y el código de acceso se muestran una sola vez.
                </Typography.Paragraph>
                <SummaryRows values={values} />
                <Form.Item
                  name="confirmed"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: async (_rule, checked) => {
                        if (checked !== true)
                          throw new Error(
                            'Confirmá que los datos son correctos antes de enviar la solicitud.'
                          );
                      },
                    },
                  ]}
                >
                  <Checkbox>
                    Confirmo que revisé los datos de la solicitud y de la
                    descripción del cargo y quiero enviarlos.
                  </Checkbox>
                </Form.Item>
              </>
            ) : null}
            <Flex gap={12} wrap className="pilot-service-actions">
              {step > 0 ? (
                <Button onClick={() => setStep(step - 1)} disabled={pending}>
                  {step === 2
                    ? 'Volver a la descripción'
                    : 'Volver a la solicitud'}
                </Button>
              ) : null}
              {step < 2 ? (
                <Button type="primary" onClick={() => void advance()}>
                  Continuar
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" loading={pending}>
                  Enviar solicitud
                </Button>
              )}
            </Flex>
          </Form>
        </div>
      </Card>
    </Container>
  );
}

function consultStateHint(status: ServiceConsult['status']) {
  return {
    submitted:
      'La solicitud fue recibida y está pendiente de vinculación verificada a una empresa.',
    in_review:
      'El personal de la plataforma está revisando la solicitud y la descripción del cargo.',
    linked:
      'La solicitud ya está vinculada a una empresa; su responsable puede consultarla en el panel empresarial.',
  }[status];
}

/** S2.3 y S2.2.2: consulta sin cuenta con folio + código, sólo resumen y estado. */
export function ConsultaServicioPage() {
  const [form] = Form.useForm<{ folio: string; access_code: string }>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [consult, setConsult] = useState<ServiceConsult | null>(null);

  async function submit(values: { folio: string; access_code: string }) {
    setPending(true);
    setFailure(null);
    setConsult(null);
    const controller = new AbortController();
    try {
      setConsult(
        await servicesApi.consult(
          values.folio.trim().toUpperCase(),
          values.access_code.trim(),
          controller.signal
        )
      );
    } catch (error) {
      setFailure(error);
      form.resetFields(['access_code']);
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="pilot-service-container">
      <Card>
        <div className="pilot-service-stack">
          <PageIntro
            title="Consultar mi solicitud"
            description="Con el folio y el código de acceso podés ver el resumen y el estado de la solicitud sin crear una cuenta."
          />
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            disabled={pending}
            onFinish={submit}
          >
            <Form.Item
              name="folio"
              label="Folio de la solicitud"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Ingresá el folio de la solicitud.',
                },
                { max: 20, message: 'Máximo 20 caracteres.' },
              ]}
            >
              <Input maxLength={20} placeholder="B-2026-0001" />
            </Form.Item>
            <Form.Item
              name="access_code"
              label="Código de acceso"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Ingresá el código de acceso.',
                },
                { max: 64, message: 'Máximo 64 caracteres.' },
              ]}
            >
              <Input.Password maxLength={64} autoComplete="off" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={pending}>
              Consultar
            </Button>
          </Form>
          {failure ? (
            <Alert
              type="error"
              showIcon
              title={
                httpStatus(failure) === 404
                  ? 'No encontramos una solicitud con ese folio y código.'
                  : errorText(failure)
              }
              description={
                httpStatus(failure) === 404
                  ? 'Revisá el folio y el código de acceso. Por seguridad no confirmamos si un folio existe.'
                  : undefined
              }
            />
          ) : null}
          {consult ? (
            <div className="pilot-service-consult">
              <Flex gap={12} align="center" wrap>
                <Typography.Title level={2}>{consult.folio}</Typography.Title>
                <Tag
                  color={serviceStatusColors[consult.status]}
                  variant="filled"
                >
                  {serviceStatusLabels[consult.status]}
                </Tag>
              </Flex>
              <Alert
                type="info"
                showIcon
                title={consultStateHint(consult.status)}
                description="Esta consulta pública no muestra candidatos, documentos, informes ni historial."
              />
              <Descriptions
                className="pilot-service-descriptions"
                bordered
                size="small"
                column={1}
                items={[
                  {
                    key: 'company',
                    label: 'Nombre de la empresa',
                    children: consult.company_name,
                  },
                  {
                    key: 'position',
                    label: 'Título exacto del puesto',
                    children: consult.position_title,
                  },
                  {
                    key: 'vacancies',
                    label: 'Número de vacantes',
                    children: consult.vacancies,
                  },
                  {
                    key: 'modality',
                    label: 'Modalidad de trabajo',
                    children: modalityLabels[consult.modality],
                  },
                  {
                    key: 'workday',
                    label: 'Tipo de jornada',
                    children: workdayLabels[consult.workday],
                  },
                  {
                    key: 'location',
                    label: 'Ubicación física',
                    children: consult.location,
                  },
                  {
                    key: 'deadline',
                    label: 'Fecha límite para recibir terna',
                    children: consult.deadline ?? 'No informada',
                  },
                  {
                    key: 'created',
                    label: 'Fecha de envío',
                    children: consult.created_at.slice(0, 10),
                  },
                ]}
              />
              <Typography.Paragraph type="secondary">
                Para editar la solicitud o trabajar con candidatos necesitás una
                cuenta de responsable con vinculación activa a la empresa.
              </Typography.Paragraph>
            </div>
          ) : null}
        </div>
      </Card>
    </Container>
  );
}
