import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  message,
  notification,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileDoneOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { pilotApi } from './api';
import type {
  CandidateCurriculumData,
  EducationLevel,
  WorkExperience,
  CourseTraining,
  RecordDetail,
} from './types';

const defaultEducation: EducationLevel[] = [
  { level: 'Posgrado / Maestría', career: '', institution: '', status: '', year: '' },
  { level: 'Licenciatura / Ingeniería', career: '', institution: '', status: 'En curso', year: '' },
  { level: 'Técnico Superior / Medio', career: '', institution: '', status: '', year: '' },
];

const emptyJob: WorkExperience = {
  company: '',
  position: '',
  period: '',
  supervisor: '',
  reference_phone: '',
  leaving_reason: '',
  achievements: '',
};

export function CurriculumForm({
  record,
  editable = true,
  onSaved,
  onGoToNext,
}: {
  record?: RecordDetail;
  editable?: boolean;
  onSaved?: (updated: CandidateCurriculumData) => void;
  onGoToNext?: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [attemptedAdvance, setAttemptedAdvance] = useState(false);

  // Dynamic lists
  const [education, setEducation] = useState<EducationLevel[]>(defaultEducation);
  const [courses, setCourses] = useState<CourseTraining[]>([]);
  const [jobs, setJobs] = useState<WorkExperience[]>([{ ...emptyJob }]);

  useEffect(() => {
    if (!record?.id) return;
    setLoading(true);
    pilotApi
      .getCv(record.id)
      .then((data) => {
        if (data) {
          form.setFieldsValue({
            target_position: data.target_position || record.academic?.interest_area || '',
            application_date: data.application_date || new Date().toISOString().slice(0, 10),
            identity_card: data.identity_card || '',
            birth_date_and_age: data.birth_date_and_age || record.person?.birth_date || '',
            contact_phone: data.contact_phone || record.person?.contact_phone || '',
            contact_email: data.contact_email || record.person?.contact_email || '',
            address: data.address || '',
            expected_salary: data.expected_salary || '',
            incorporation_availability: data.incorporation_availability || 'Inmediata',
            technical_knowledge: data.technical_knowledge || '',
            languages: data.languages || '',
            work_modality: data.work_modality || 'Presencial',
            schedule_availability: data.schedule_availability || 'Tiempo completo',
            travel_availability: data.travel_availability || 'No',
            driver_license: data.driver_license || 'No',
            relatives_in_company: data.relatives_in_company || 'No',
            declaration_accepted: !!data.declaration_accepted,
          });

          if (data.education_levels && data.education_levels.length > 0) {
            setEducation(data.education_levels);
          } else if (record.academic?.career) {
            setEducation([
              { level: 'Posgrado / Maestría', career: '', institution: '', status: '', year: '' },
              {
                level: 'Licenciatura / Ingeniería',
                career: record.academic.career,
                institution: record.academic.faculty || 'UAGRM',
                status: 'En curso',
                year: String(new Date().getFullYear()),
              },
              { level: 'Técnico Superior / Medio', career: '', institution: '', status: '', year: '' },
            ]);
          }

          if (data.courses && data.courses.length > 0) {
            setCourses(data.courses);
          }

          if (data.work_experiences && data.work_experiences.length > 0) {
            setJobs(data.work_experiences);
          }
        }
      })
      .catch(() => {
        // use fallback initial
      })
      .finally(() => setLoading(false));
  }, [record?.id]);

  // Handlers for dynamic jobs
  const handleAddJob = () => {
    setJobs([...jobs, { ...emptyJob }]);
  };

  const handleRemoveJob = (index: number) => {
    if (jobs.length <= 1) {
      setJobs([{ ...emptyJob }]);
      return;
    }
    const next = jobs.filter((_, i) => i !== index);
    setJobs(next);
  };

  const handleJobChange = (index: number, field: keyof WorkExperience, val: string) => {
    const next = [...jobs];
    next[index] = { ...next[index], [field]: val };
    setJobs(next);
  };

  // Handlers for education
  const handleEducationChange = (index: number, field: keyof EducationLevel, val: string) => {
    const next = [...education];
    next[index] = { ...next[index], [field]: val };
    setEducation(next);
  };

  // Handlers for courses
  const handleAddCourse = () => {
    setCourses([...courses, { course: '', institution: '', period: '', year: '' }]);
  };

  const handleRemoveCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const handleCourseChange = (index: number, field: keyof CourseTraining, val: string) => {
    const next = [...courses];
    next[index] = { ...next[index], [field]: val };
    setCourses(next);
  };

  // Comprehensive validation of ALL required CV fields
  const validateCvCompleteness = (values: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!values?.target_position?.trim()) errors.push('Puesto / Vacante al que Postula');
    if (!values?.expected_salary?.trim()) errors.push('Pretensión Salarial en Bs');
    if (!values?.identity_card?.trim()) errors.push('Cédula de Identidad (CI)');
    if (!values?.incorporation_availability?.trim()) errors.push('Disponibilidad de Incorporación');
    if (!values?.application_date?.trim()) errors.push('Fecha de Solicitud');
    if (!values?.contact_phone?.trim()) errors.push('Teléfono / Celular de Contacto');
    if (!values?.contact_email?.trim()) errors.push('Correo Electrónico');
    if (!values?.address?.trim()) errors.push('Dirección de Domicilio');

    // Education: at least one complete entry
    const hasEdu = education.some(
      (e) => e.career?.trim() && e.institution?.trim() && e.status?.trim()
    );
    if (!hasEdu) {
      errors.push('Formación Académica: Debe registrar al menos un nivel con Carrera, Institución y Estado');
    }

    // Technical knowledge and languages
    if (!values?.technical_knowledge?.trim()) errors.push('Conocimientos Técnicos / Software');
    if (!values?.languages?.trim()) errors.push('Idiomas y Nivel');

    // Work experiences
    if (jobs.length === 0) {
      errors.push('Historial Laboral: Debe registrar al menos el Empleo 1');
    } else {
      jobs.forEach((job, idx) => {
        const num = idx + 1;
        if (!job.company?.trim()) errors.push(`Empleo ${num}: Empresa / Organización`);
        if (!job.position?.trim()) errors.push(`Empleo ${num}: Cargo Ocupado`);
        if (!job.period?.trim()) errors.push(`Empleo ${num}: Periodo (Mes/Año)`);
        if (!job.supervisor?.trim()) errors.push(`Empleo ${num}: Jefe Directo`);
        if (!job.reference_phone?.trim()) errors.push(`Empleo ${num}: Teléfono de Referencia`);
        if (!job.leaving_reason?.trim()) errors.push(`Empleo ${num}: Motivo de Salida`);
        if (!job.achievements?.trim()) errors.push(`Empleo ${num}: Principales Funciones y Logros`);
      });
    }

    // Conditions and availability
    if (!values?.work_modality?.trim()) errors.push('Modalidad de Trabajo Preferida');
    if (!values?.schedule_availability?.trim()) errors.push('Disponibilidad de Horario');
    if (!values?.travel_availability?.trim()) errors.push('Disponibilidad para Viajar');
    if (!values?.driver_license?.trim()) errors.push('Licencia de Conducir');
    if (!values?.relatives_in_company?.trim()) errors.push('Familiares en la Empresa');
    if (!values?.declaration_accepted) errors.push('Aceptación de la Declaración Jurada y Autorización');

    return { valid: errors.length === 0, errors };
  };

  const doSave = async (values: any): Promise<CandidateCurriculumData | null> => {
    if (!record?.id) {
      message.warning('Primero debes guardar el borrador inicial de tus datos personales.');
      return null;
    }
    setSaving(true);
    setSavedSuccess(false);

    const payload: Partial<CandidateCurriculumData> = {
      ...values,
      education_levels: education,
      courses: courses,
      work_experiences: jobs,
    };

    try {
      const res = await pilotApi.saveCv(record.id, payload);
      setSavedSuccess(true);
      if (onSaved) onSaved(res);
      return res;
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Error al guardar la solicitud de empleo.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // 1. Guardar y continuar al siguiente paso (estricto)
  const handleSaveAndAdvance = async () => {
    setAttemptedAdvance(true);
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      values = form.getFieldsValue();
    }

    const { valid, errors } = validateCvCompleteness(values);

    if (!valid) {
      notification.error({
        message: 'No puedes seguir al siguiente paso',
        description: (
          <div>
            <Typography.Paragraph style={{ marginBottom: 6 }}>
              Todos los campos del Formulario del Currículum Vitae son obligatorios. Hay{' '}
              <strong>{errors.length} campo(s) pendiente(s)</strong>:
            </Typography.Paragraph>
            <ul style={{ maxHeight: 180, overflowY: 'auto', paddingLeft: 20, margin: 0, color: '#cf1322' }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 8,
      });
      message.error(`No puedes avanzar. Hay ${errors.length} campo(s) obligatorio(s) sin completar en el CV.`);
      return;
    }

    const saved = await doSave(values);
    if (saved) {
      message.success('¡Currículum Vitae completado con éxito! Avanzando al siguiente paso...');
      onGoToNext?.();
    }
  };

  // 2. Guardar borrador parcial
  const handleSaveDraft = async () => {
    const values = form.getFieldsValue();
    const saved = await doSave(values);
    if (saved) {
      const { valid, errors } = validateCvCompleteness(values);
      if (!valid) {
        notification.warning({
          message: 'Borrador de CV guardado (Incompleto)',
          description: `Se guardaron tus avances, pero aún restan ${errors.length} campos por completar. No podrás avanzar al siguiente paso ni enviar tu postulación hasta completarlos todos.`,
          duration: 6,
        });
      } else {
        message.success('Borrador de Currículum Vitae guardado y validado.');
      }
    }
  };

  if (!record?.id) {
    return (
      <Alert
        type="info"
        showIcon
        message="Borrador pendiente"
        description="Guardá tus datos personales iniciales como borrador para poder registrar y vincular tu Currículum Vitae / Solicitud de Empleo digital."
      />
    );
  }

  const isEduValid = education.some((e) => e.career?.trim() && e.institution?.trim() && e.status?.trim());

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          <FileDoneOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          Formulario de Solicitud de Empleo / Currículum Vitae
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Completá de forma clara y veraz tu información académica, laboral y condiciones de disponibilidad.
          <strong> Todos los campos son obligatorios</strong>. No podrás avanzar al siguiente paso hasta completarlos en su totalidad.
        </Typography.Paragraph>
      </div>

      {savedSuccess && (
        <Alert
          type="success"
          showIcon
          message="Cambios guardados en el expediente"
          description="Tu solicitud de empleo y experiencia laboral se encuentran actualizadas en el servidor."
          style={{ marginBottom: 20 }}
          closable
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveAndAdvance}
        disabled={!editable || loading}
        initialValues={{
          incorporation_availability: 'Inmediata',
          work_modality: 'Presencial',
          schedule_availability: 'Tiempo completo',
          travel_availability: 'No',
          driver_license: 'No',
          relatives_in_company: 'No',
          declaration_accepted: false,
        }}
      >
        {/* ========================================================= */}
        {/* 1. DATOS DEL PUESTO Y GENERALES DEL CANDIDATO */}
        {/* ========================================================= */}
        <Card
          title="1. Datos del Puesto y Generales del Candidato"
          size="small"
          style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="target_position"
                label="Puesto / Vacante al que Postula *"
                rules={[{ required: true, message: 'Ingrese el puesto al que postula' }]}
              >
                <Input placeholder="Ej. Desarrollador Web, Analista de Selección, etc." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="expected_salary"
                label="Pretensión Salarial (Neto / Líquido en Bs) *"
                rules={[{ required: true, message: 'Ingrese su pretensión salarial en Bs' }]}
              >
                <Input placeholder="Ej. 4.500 Bs" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="identity_card"
                label="Cédula de Identidad (CI y extensión) *"
                rules={[{ required: true, message: 'Ingrese su cédula de identidad y extensión' }]}
              >
                <Input placeholder="Ej. 8452123 SC" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="incorporation_availability"
                label="Disponibilidad de Incorporación *"
                rules={[{ required: true, message: 'Seleccione la disponibilidad de incorporación' }]}
              >
                <Select
                  options={[
                    { value: 'Inmediata', label: 'Inmediata' },
                    { value: '15 días', label: '15 días' },
                    { value: 'A convenir', label: 'A convenir' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="application_date"
                label="Fecha de Solicitud *"
                rules={[{ required: true, message: 'Ingrese la fecha de solicitud' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="contact_phone"
                label="Teléfono / Celular de Contacto *"
                rules={[{ required: true, message: 'Ingrese un teléfono o celular de contacto' }]}
              >
                <Input placeholder="Principal y alternativo" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contact_email"
                label="Correo Electrónico *"
                rules={[
                  { required: true, message: 'Ingrese un correo electrónico' },
                  { type: 'email', message: 'Ingrese un formato de correo válido' },
                ]}
              >
                <Input placeholder="correo@ejemplo.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Dirección de Domicilio *"
            rules={[{ required: true, message: 'Ingrese su dirección de domicilio completa' }]}
          >
            <Input placeholder="Calle, Número, Zona / Barrio, Ciudad" />
          </Form.Item>
        </Card>

        {/* ========================================================= */}
        {/* 2. FORMACIÓN ACADÉMICA Y CONOCIMIENTOS TÉCNICOS */}
        {/* ========================================================= */}
        <Card
          title="2. Formación Académica y Conocimientos Técnicos"
          size="small"
          style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Typography.Text strong>
              Nivel Máximo de Estudios (Obligatorio al menos un nivel completado) *:
            </Typography.Text>
            {attemptedAdvance && !isEduValid && (
              <Typography.Text type="danger" style={{ fontSize: 13 }}>
                <ExclamationCircleOutlined /> Falta completar Carrera, Institución y Estado
              </Typography.Text>
            )}
          </div>

          {education.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#fafafa',
                padding: '12px 16px',
                borderRadius: 6,
                marginBottom: 12,
                border: attemptedAdvance && !isEduValid && idx === 1 ? '1px solid #ff4d4f' : '1px solid #f0f0f0',
              }}
            >
              <Typography.Text strong style={{ color: '#1677ff' }}>
                {item.level}
              </Typography.Text>
              <Row gutter={12} style={{ marginTop: 8 }}>
                <Col xs={24} md={8}>
                  <Input
                    placeholder="Carrera / Especialidad *"
                    value={item.career}
                    status={attemptedAdvance && !item.career?.trim() && idx === 1 ? 'error' : undefined}
                    onChange={(e) => handleEducationChange(idx, 'career', e.target.value)}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Input
                    placeholder="Institución Educativa (ej. UAGRM) *"
                    value={item.institution}
                    status={attemptedAdvance && !item.institution?.trim() && idx === 1 ? 'error' : undefined}
                    onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <Select
                    placeholder="Estado *"
                    value={item.status || undefined}
                    status={attemptedAdvance && !item.status?.trim() && idx === 1 ? 'error' : undefined}
                    onChange={(val) => handleEducationChange(idx, 'status', val)}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'Titulado', label: 'Titulado' },
                      { value: 'Egresado', label: 'Egresado' },
                      { value: 'En curso', label: 'En curso' },
                      { value: 'Trunco / Incompleto', label: 'Incompleto' },
                    ]}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <Input
                    placeholder="Año"
                    value={item.year}
                    onChange={(e) => handleEducationChange(idx, 'year', e.target.value)}
                  />
                </Col>
              </Row>
            </div>
          ))}

          <Divider style={{ margin: '16px 0' }} />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="technical_knowledge"
                label="Conocimientos Técnicos / Software *"
                tooltip="Detalle herramientas como Excel (nivel), ERP, CRM, lenguajes de programación, etc."
                rules={[{ required: true, message: 'Detalle sus conocimientos técnicos y software' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Ej. Excel intermedio, ERP SAP, React, PHP/Laravel, SQL, etc."
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="languages"
                label="Idiomas y Nivel *"
                tooltip="Ej. Español: Nativo / Inglés: Intermedio (B2)"
                rules={[{ required: true, message: 'Detalle los idiomas y su nivel de dominio' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Ej. Español: Nativo / Inglés: Intermedio (B2)"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Otros Cursos, Seminarios o Talleres (Opcional)
            </Typography.Text>
          </Divider>

          {courses.map((c, cIdx) => (
            <Row gutter={12} key={cIdx} style={{ marginBottom: 8 }} align="middle">
              <Col xs={24} md={8}>
                <Input
                  placeholder="Curso / Taller"
                  value={c.course}
                  onChange={(e) => handleCourseChange(cIdx, 'course', e.target.value)}
                />
              </Col>
              <Col xs={12} md={7}>
                <Input
                  placeholder="Institución"
                  value={c.institution}
                  onChange={(e) => handleCourseChange(cIdx, 'institution', e.target.value)}
                />
              </Col>
              <Col xs={8} md={4}>
                <Input
                  placeholder="Periodo"
                  value={c.period}
                  onChange={(e) => handleCourseChange(cIdx, 'period', e.target.value)}
                />
              </Col>
              <Col xs={8} md={3}>
                <Input
                  placeholder="Año"
                  value={c.year}
                  onChange={(e) => handleCourseChange(cIdx, 'year', e.target.value)}
                />
              </Col>
              <Col xs={4} md={2}>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveCourse(cIdx)}
                />
              </Col>
            </Row>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddCourse}
            style={{ width: '100%', marginTop: 8 }}
          >
            Añadir Curso o Certificación (+)
          </Button>
        </Card>

        {/* ========================================================= */}
        {/* 3. HISTORIAL LABORAL / EMPLEOS (DINÁMICO CON SIGNO +) */}
        {/* ========================================================= */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>3. Historial Laboral (Experiencia Profesional) *</span>
              <Button
                type="primary"
                ghost
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddJob}
              >
                Añadir otro empleo (+)
              </Button>
            </div>
          }
          size="small"
          style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Inicie por su empleo actual o más reciente. <strong>Todos los campos de cada empleo registrado son obligatorios</strong>.
            Haga clic en <strong>&quot;Añadir otro empleo (+)&quot;</strong> únicamente si desea agregar empleos anteriores.
          </Typography.Paragraph>

          {jobs.map((job, idx) => (
            <Card
              key={idx}
              type="inner"
              title={
                <span style={{ fontWeight: 600 }}>
                  Empleo {idx + 1} {idx === 0 ? '(Actual o Más Reciente) *' : ' *'}
                </span>
              }
              extra={
                jobs.length > 1 ? (
                  <Popconfirm
                    title="¿Quitar este empleo?"
                    okText="Sí, quitar"
                    cancelText="Cancelar"
                    onConfirm={() => handleRemoveJob(idx)}
                  >
                    <Button danger type="link" size="small" icon={<DeleteOutlined />}>
                      Quitar empleo
                    </Button>
                  </Popconfirm>
                ) : null
              }
              style={{
                marginBottom: 16,
                background: '#fafbfc',
                border: attemptedAdvance && (!job.company?.trim() || !job.position?.trim()) ? '1px solid #ff4d4f' : undefined,
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                      Empresa / Organización *
                    </label>
                    <Input
                      placeholder="Nombre de la empresa"
                      value={job.company}
                      status={attemptedAdvance && !job.company?.trim() ? 'error' : undefined}
                      onChange={(e) => handleJobChange(idx, 'company', e.target.value)}
                    />
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                      Cargo Ocupado *
                    </label>
                    <Input
                      placeholder="Puesto o título del cargo"
                      value={job.position}
                      status={attemptedAdvance && !job.position?.trim() ? 'error' : undefined}
                      onChange={(e) => handleJobChange(idx, 'position', e.target.value)}
                    />
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                      Periodo (Mes/Año) *
                    </label>
                    <Input
                      placeholder="Ej. 03/2022 - Actual o 12/2023"
                      value={job.period}
                      status={attemptedAdvance && !job.period?.trim() ? 'error' : undefined}
                      onChange={(e) => handleJobChange(idx, 'period', e.target.value)}
                    />
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                      Jefe Directo (Nombre y Cargo) *
                    </label>
                    <Input
                      placeholder="Nombre y puesto del supervisor"
                      value={job.supervisor}
                      status={attemptedAdvance && !job.supervisor?.trim() ? 'error' : undefined}
                      onChange={(e) => handleJobChange(idx, 'supervisor', e.target.value)}
                    />
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                      Teléfono de Referencia *
                    </label>
                    <Input
                      placeholder="Número de contacto para validación"
                      value={job.reference_phone}
                      status={attemptedAdvance && !job.reference_phone?.trim() ? 'error' : undefined}
                      onChange={(e) => handleJobChange(idx, 'reference_phone', e.target.value)}
                    />
                  </div>
                </Col>
              </Row>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                  Motivo de Salida *
                </label>
                <Input
                  placeholder="Ej. Crecimiento profesional, culminación de contrato, etc."
                  value={job.leaving_reason}
                  status={attemptedAdvance && !job.leaving_reason?.trim() ? 'error' : undefined}
                  onChange={(e) => handleJobChange(idx, 'leaving_reason', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                  Principales Funciones y Logros *
                </label>
                <Input.TextArea
                  rows={2}
                  placeholder="Describa brevemente sus responsabilidades principales y aportes"
                  value={job.achievements}
                  status={attemptedAdvance && !job.achievements?.trim() ? 'error' : undefined}
                  onChange={(e) => handleJobChange(idx, 'achievements', e.target.value)}
                />
              </div>
            </Card>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddJob}
            style={{ width: '100%', height: 40 }}
          >
            + Añadir Empleo {jobs.length + 1}
          </Button>
        </Card>

        {/* ========================================================= */}
        {/* 4. CONDICIONES Y DISPONIBILIDAD LABORAL */}
        {/* ========================================================= */}
        <Card
          title="4. Condiciones y Disponibilidad Laboral"
          size="small"
          style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="work_modality"
                label="Modalidad de Trabajo Preferida *"
                rules={[{ required: true, message: 'Seleccione la modalidad de trabajo preferida' }]}
              >
                <Radio.Group>
                  <Radio value="Presencial">Presencial</Radio>
                  <Radio value="Híbrido">Híbrido</Radio>
                  <Radio value="Remoto">Remoto</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="schedule_availability"
                label="Disponibilidad de Horario *"
                rules={[{ required: true, message: 'Seleccione la disponibilidad de horario' }]}
              >
                <Radio.Group>
                  <Radio value="Tiempo completo">Tiempo completo</Radio>
                  <Radio value="Turnos rotativos">Turnos rotativos</Radio>
                  <Radio value="Fines de semana">Fines de semana</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="travel_availability"
                label="Disponibilidad para Viajar *"
                rules={[{ required: true, message: 'Seleccione la disponibilidad para viajar' }]}
              >
                <Radio.Group>
                  <Radio value="No">No</Radio>
                  <Radio value="Sí, ocasionalmente">Sí, ocasionalmente</Radio>
                  <Radio value="Sí, constantemente">Sí, constantemente</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="driver_license"
                label="Licencia de Conducir *"
                rules={[{ required: true, message: 'Especifique si cuenta con licencia de conducir' }]}
              >
                <Input placeholder="Ej. No / Sí — Categoría P / A / B" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="relatives_in_company"
            label="¿Tiene familiares trabajando en la empresa / institución? *"
            rules={[{ required: true, message: 'Indique si tiene familiares en la empresa' }]}
          >
            <Input placeholder="Ej. No  /  Sí — Nombre y parentesco" />
          </Form.Item>
        </Card>

        {/* ========================================================= */}
        {/* 5. DECLARACIÓN Y AUTORIZACIÓN DEL CANDIDATO */}
        {/* ========================================================= */}
        <Card
          title="5. Declaración y Autorización del Candidato"
          size="small"
          style={{ marginBottom: 24, background: '#f6ffed', borderColor: '#b7eb8f' }}
        >
          <Form.Item
            name="declaration_accepted"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Debe aceptar la declaración jurada para continuar')),
              },
            ]}
          >
            <Checkbox>
              <strong>Declaro bajo juramento *</strong> que todos los datos consignados en la presente
              solicitud son verídicos y exactos. Asimismo, autorizo expresamente a realizar la verificación
              de mis antecedentes laborales, académicos y referencias personales proporcionadas en este
              documento.
            </Checkbox>
          </Form.Item>
        </Card>

        {/* ========================================================= */}
        {/* BOTONES DE ACCIÓN: GUARDAR BORRADOR Y AVANZAR */}
        {/* ========================================================= */}
        {editable && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
            <Button
              type="default"
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={saving}
              size="large"
            >
              Guardar borrador de CV
            </Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleSaveAndAdvance}
              loading={saving}
              size="large"
              style={{ background: '#1677ff', borderColor: '#1677ff' }}
            >
              Guardar y continuar al siguiente paso
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
