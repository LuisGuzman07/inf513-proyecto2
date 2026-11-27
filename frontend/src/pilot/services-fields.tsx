import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  languageLevelOptions,
  modalityOptions,
  paymentSchemeOptions,
  travelOptions,
  workdayOptions,
} from './services-labels';
import { activitiesRule, languageRule, salaryRule } from './services-form';

const required = (message: string) => ({
  required: true,
  whitespace: true,
  message,
});
const max = (length: number) => ({
  max: length,
  message: `Máximo ${length} caracteres.`,
});

function LanguagesRows() {
  const form = Form.useFormInstance();
  return (
    <Form.List name="languages">
      {(fields, { add, remove }) => (
        <div className="pilot-service-languages">
          {fields.map((field, index) => (
            <div className="pilot-service-language-row" key={field.key}>
              <Form.Item
                name={[field.name, 'language']}
                label={`Idioma ${index + 1}`}
                rules={[{ max: 100, message: 'Máximo 100 caracteres.' }]}
              >
                <Input maxLength={100} placeholder="Inglés" />
              </Form.Item>
              <Form.Item
                name={[field.name, 'level']}
                label={`Nivel del idioma ${index + 1}`}
                dependencies={[['languages']]}
                rules={[languageRule(form, index)]}
              >
                <Select
                  virtual={false}
                  allowClear
                  placeholder="Seleccioná un nivel"
                  options={languageLevelOptions}
                />
              </Form.Item>
              <Button
                className="pilot-service-row-remove"
                aria-label={`Quitar idioma ${index + 1}`}
                onClick={() => remove(field.name)}
              >
                Quitar
              </Button>
            </div>
          ))}
          <Button
            disabled={fields.length >= 6}
            onClick={() => add({ language: '', level: undefined })}
          >
            Agregar idioma
          </Button>
          <Typography.Text type="secondary">
            Opcional. Se aceptan hasta seis idiomas, cada uno con su nivel.
          </Typography.Text>
        </div>
      )}
    </Form.List>
  );
}

/** S11-B §1–§4 del formulario de solicitud de servicio de selección. */
export function ServiceRequestFields() {
  const form = Form.useFormInstance();
  return (
    <>
      <Typography.Title level={2}>
        Datos de la empresa y del contacto
      </Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="company_name"
            label="Nombre de la empresa"
            rules={[required('Ingresá el nombre de la empresa.'), max(200)]}
          >
            <Input maxLength={200} autoComplete="organization" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="contact_name"
            label="Nombre del solicitante"
            rules={[required('Ingresá el nombre del solicitante.'), max(200)]}
          >
            <Input maxLength={200} autoComplete="name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="contact_position"
            label="Cargo del solicitante"
            rules={[required('Ingresá el cargo del solicitante.'), max(200)]}
          >
            <Input maxLength={200} autoComplete="organization-title" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="contact_area"
            label="Área / Departamento"
            rules={[
              required('Ingresá el área o departamento del solicitante.'),
              max(200),
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="contact_email"
            label="Correo electrónico"
            rules={[
              required('Ingresá el correo electrónico de contacto.'),
              {
                type: 'email',
                message: 'Ingresá un correo electrónico válido.',
              },
              max(254),
            ]}
          >
            <Input maxLength={254} autoComplete="email" inputMode="email" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="contact_phone"
            label="Teléfono de contacto"
            rules={[required('Ingresá el teléfono de contacto.'), max(50)]}
          >
            <Input maxLength={50} autoComplete="tel" inputMode="tel" />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={2}>Especificaciones del puesto</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="position_title"
            label="Título exacto del puesto"
            rules={[required('Ingresá el título exacto del puesto.'), max(200)]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name="vacancies"
            label="Número de vacantes"
            rules={[
              {
                required: true,
                message: 'Indicá el número de vacantes.',
              },
            ]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name="modality"
            label="Modalidad de trabajo"
            rules={[{ required: true, message: 'Seleccioná la modalidad.' }]}
          >
            <Select virtual={false} options={modalityOptions} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name="workday"
            label="Tipo de jornada"
            rules={[
              { required: true, message: 'Seleccioná el tipo de jornada.' },
            ]}
          >
            <Select virtual={false} options={workdayOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="location"
            label="Ubicación física"
            rules={[
              required('Ingresá la ubicación física del puesto.'),
              max(200),
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={12} md={8}>
          <Form.Item
            name="salary_currency"
            label="Moneda"
            dependencies={['salary_min', 'salary_max']}
            rules={[salaryRule(form), max(3)]}
          >
            <Input maxLength={3} placeholder="BOB" />
          </Form.Item>
        </Col>
        <Col xs={12} md={8}>
          <Form.Item
            name="salary_min"
            label="Monto mínimo"
            dependencies={['salary_currency', 'salary_max']}
            rules={[salaryRule(form)]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={8}>
          <Form.Item
            name="salary_max"
            label="Monto máximo"
            dependencies={['salary_currency', 'salary_min']}
            rules={[salaryRule(form)]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="payment_scheme"
            label="Esquema de pago"
            rules={[
              { required: true, message: 'Seleccioná el esquema de pago.' },
            ]}
          >
            <Select virtual={false} options={paymentSchemeOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="benefits"
            label="Prestaciones y beneficios (opcional)"
            rules={[max(2000)]}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Col>
      </Row>
      <Typography.Paragraph type="secondary">
        El rango salarial es opcional: se informa con moneda, monto mínimo y
        monto máximo, o no se informa.
      </Typography.Paragraph>

      <Typography.Title level={2}>Perfil requerido</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="required_education"
            label="Formación académica"
            rules={[
              required('Indicá la formación académica requerida.'),
              max(200),
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="required_experience"
            label="Tiempo de experiencia mínima"
            rules={[required('Indicá la experiencia mínima.'), max(200)]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="required_knowledge"
            label="Otros conocimientos específicos"
            rules={[
              required('Describí los conocimientos específicos.'),
              max(2000),
            ]}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Col>
      </Row>
      <Typography.Title level={3}>Idiomas</Typography.Title>
      <LanguagesRows />

      <Typography.Title level={2}>Plazo</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="deadline"
            label="Fecha límite para recibir terna"
            rules={[
              {
                required: true,
                message: 'Indicá la fecha límite para recibir la terna.',
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(current) =>
                current !== null && current < dayjs().startOf('day')
              }
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

/** S11-C del formulario de descripción de funciones. */
export function JobDescriptionFields({
  positionTitle,
  prefix = [],
}: {
  positionTitle?: string | null;
  prefix?: string[];
}) {
  const name = (field: string) => [...prefix, field];
  return (
    <>
      <Typography.Title level={2}>Identificación del puesto</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Nombre del puesto">
            <Input value={positionTitle ?? ''} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name={name('area')}
            label="Área / Departamento"
            rules={[
              required('Ingresá el área o departamento del puesto.'),
              max(200),
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name={name('reports_to')}
            label="Reporta a (Jefe Directo)"
            rules={[required('Indicá a quién reporta el puesto.'), max(200)]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name={name('headcount')}
            label="Personal a Cargo"
            rules={[required('Indicá el personal a cargo.'), max(100)]}
          >
            <Input maxLength={100} placeholder="Cantidad o «Ninguno»" />
          </Form.Item>
        </Col>
      </Row>
      <Typography.Paragraph type="secondary">
        El nombre del puesto se precarga con el título exacto del puesto de la
        solicitud de servicio.
      </Typography.Paragraph>

      <Typography.Title level={2}>Funciones</Typography.Title>
      <Form.Item
        name={name('objective')}
        label="Objetivo general del puesto"
        rules={[
          required('Describí el objetivo general del puesto.'),
          max(4000),
        ]}
      >
        <Input.TextArea rows={3} maxLength={4000} />
      </Form.Item>
      <Form.List name={name('activities')} rules={[activitiesRule()]}>
        {(fields, { add, remove }, { errors }) => (
          <div className="pilot-service-activities">
            <Typography.Title level={3}>
              Actividades y funciones principales
            </Typography.Title>
            {fields.map((field, index) => (
              <div className="pilot-service-activity-row" key={field.key}>
                <Form.Item
                  name={field.name}
                  label={`Actividad ${index + 1}`}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Describí la actividad.',
                    },
                    max(500),
                  ]}
                >
                  <Input maxLength={500} />
                </Form.Item>
                <Button
                  className="pilot-service-row-remove"
                  aria-label={`Quitar actividad ${index + 1}`}
                  onClick={() => remove(field.name)}
                >
                  Quitar
                </Button>
              </div>
            ))}
            <Button onClick={() => add('')}>Agregar actividad</Button>
            <Typography.Text type="secondary">
              En el orden del formulario de descripción de funciones.
            </Typography.Text>
            <Form.ErrorList errors={errors} />
          </div>
        )}
      </Form.List>

      <Typography.Title level={2}>Requisitos del puesto</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name={name('required_education')}
            label="Nivel de estudios / carrera"
            rules={[
              required('Indicá el nivel de estudios o carrera.'),
              max(200),
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name={name('required_experience')}
            label="Experiencia previa mínima"
            rules={[required('Indicá la experiencia previa mínima.'), max(200)]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name={name('required_knowledge')}
            label="Conocimientos técnicos / software"
            rules={[
              required('Describí los conocimientos técnicos o software.'),
              max(2000),
            ]}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={2}>Condiciones del puesto</Typography.Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name={name('work_schedule')}
            label="Modalidad y horario"
            rules={[required('Indicá la modalidad y el horario.'), max(200)]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name={name('travel')}
            label="Disponibilidad para viajar"
            rules={[
              {
                required: true,
                message: 'Seleccioná la disponibilidad para viajar.',
              },
            ]}
          >
            <Select virtual={false} options={travelOptions} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name={name('work_environment')}
            label="Ambiente / esfuerzo físico"
            rules={[
              required('Describí el ambiente y el esfuerzo físico.'),
              max(2000),
            ]}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
