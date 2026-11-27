import {
  Button,
  Checkbox,
  Col,
  Form,
  DatePicker,
  Input,
  Modal,
  Row,
  Select,
  Alert,
  Flex,
  Spin,
  Tag,
  Typography,
  App,
  type SelectProps,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { isCancel } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { errorText, fieldErrors, httpStatus, pilotApi } from './api';
import { groupCatalogOptions, matchesCatalogSearch } from './catalog';
import { usePilotSession } from './context';
import type { Draft, DraftInput, RecordDetail } from './types';
import { fields, normalizeDraft, validateDraft } from './validation';
import { Documents } from './documents';
import { CurriculumForm } from './curriculum-form';
import { PageIntro, NextAction } from './presentation';
import { formSections } from './presentation-data';
import { canEdit, documentTypes, missingCurriculum, missingForSubmission } from './workflow';
import './portal.css';

const basePath = '/portal/inscripciones';
const mobilityFields = [
  ['province', 'Provincia'],
  ['department', 'Departamento'],
  ['country', 'País'],
] as const;
function missingSection(label: string) {
  if (label.startsWith('Movilidad: ')) return 'contacto';
  if (label.startsWith('Currículum') || label.startsWith('CV')) return 'curriculum';
  if (documentTypes.some((item) => item.label === label)) return 'documentos';
  const field = fields.find(([, title]) => title === label)?.[0];
  const section = formSections.find((group) =>
    group.fields.some((key) => key === field)
  )?.id;
  return section === 'intereses-movilidad' ? 'contacto' : section;
}
export function RecordEditor({
  record,
  reload,
  renderActions,
  observationsCount = 0,
}: {
  record?: RecordDetail;
  reload?: () => void;
  observationsCount?: number;
  renderActions?: (state: {
    record?: RecordDetail;
    dirty: boolean;
    busy: boolean;
    onGoToMissing: (label: string) => void;
  }) => ReactNode;
}) {
  const { session, generation, user } = usePilotSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<DraftInput>();
  const dirty = useRef(false);
  const formDirty = useRef(false);
  const pendingSelection = useRef(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [hasSelectedFiles, setHasSelectedFiles] = useState(false);
  const [activeSection, setActiveSection] = useState('datos-personales');
  const [submissionTarget, setSubmissionTarget] = useState<string | null>(null);
  const { message, notification } = App.useApp();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(record);
  const saveLock = useRef(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const [manualCareer, setManualCareer] = useState(
    () => record?.catalog.career_manual ?? false
  );
  const [facultyMismatch, setFacultyMismatch] = useState(false);
  const optionFaculties = useRef(new Map<string, string>());
  const blocker = useBlocker(() => dirty.current);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  const initial = record
    ? normalizeDraft({
        ...record.person,
        ...record.academic,
        faculty_catalog_id: record.catalog.faculty_catalog_id,
        career_catalog_id: record.catalog.career_catalog_id,
        career_manual: record.catalog.career_manual,
        mobility: record.mobility,
      })
    : normalizeDraft({});
  const selectedFacultyId = Form.useWatch('faculty_catalog_id', form) as
    | string
    | null
    | undefined;
  const selectedCareerId = Form.useWatch('career_catalog_id', form) as
    | string
    | null
    | undefined;
  const watchedValues = Form.useWatch([], { form, preserve: true }) as
    | DraftInput
    | undefined;
  const facultiesQuery = useQuery({
    queryKey: session.key('catalog-faculties'),
    queryFn: ({ signal }) =>
      session.run((request) => pilotApi.catalogFaculties(request), signal),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const optionsQuery = useQuery({
    queryKey: session.key('catalog-options'),
    queryFn: ({ signal }) =>
      session.run((request) => pilotApi.catalogOptions(request, {}), signal),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const localValues = watchedValues ?? initial;
  const localMissing = missingForSubmission(
    {
      ...localValues,
      career:
        !manualCareer && localValues.career_catalog_id
          ? optionsQuery.data?.find(
              (option) => option.id === localValues.career_catalog_id
            )?.name ?? localValues.career
          : localValues.career,
    },
    currentRecord?.documents ?? [],
    currentRecord?.curriculum ?? null
  );
  const confirmedMissing = currentRecord
    ? missingForSubmission(
        {
          ...currentRecord.person,
          ...currentRecord.academic,
          mobility: currentRecord.mobility,
        },
        currentRecord.documents,
        currentRecord.curriculum ?? null
      )
    : null;

  useEffect(() => {
    let target: string;
    try {
      target = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (!target) return;
    if (target === 'career_catalog_id' && !optionsQuery.isSuccess) return;
    if (target === 'faculty_catalog_id' && !facultiesQuery.isSuccess) return;
    if (target.startsWith('missing-mobility-')) {
      const key = target.slice('missing-mobility-'.length);
      if (!mobilityFields.some(([field]) => field === key)) return;
      setSubmissionTarget('mobility.' + key);
      form.scrollToField(['mobility', key], { focus: true });
      return;
    }
    if (target.startsWith('document-')) {
      setSubmissionTarget(target);
      const card = document.getElementById(target);
      if (card && typeof card.scrollIntoView === 'function')
        card.scrollIntoView({ block: 'nearest' });
      card
        ?.querySelector<HTMLButtonElement>('[aria-label^="Seleccionar "]')
        ?.focus();
      return;
    }
    if (
      !fields.some(([key]) => key === target) &&
      !['faculty_catalog_id', 'career_catalog_id', 'career'].includes(target)
    )
      return;
    setSubmissionTarget(target);
    form.scrollToField(target, { focus: true });
  }, [form, location.hash, optionsQuery.isSuccess, facultiesQuery.isSuccess]);
  const visibleOptions = useMemo(
    () =>
      selectedFacultyId
        ? (optionsQuery.data ?? []).filter(
            (item) => item.faculty_id === selectedFacultyId
          )
        : optionsQuery.data ?? [],
    [optionsQuery.data, selectedFacultyId]
  );
  useEffect(() => {
    for (const option of optionsQuery.data ?? [])
      optionFaculties.current.set(option.id, option.faculty_id);
  }, [optionsQuery.data]);
  useEffect(() => {
    if (!selectedFacultyId || !selectedCareerId || manualCareer) return;
    if (visibleOptions.some((item) => item.id === selectedCareerId)) {
      setFacultyMismatch(false);
      return;
    }
    const known = optionFaculties.current.get(selectedCareerId);
    if (known !== undefined && known !== selectedFacultyId) {
      form.setFieldsValue({ career_catalog_id: null, career: null });
      setFacultyMismatch(true);
      void message.warning(
        'La carrera seleccionada no corresponde a la nueva facultad. Elegí una carrera de la lista.'
      );
    }
  }, [
    visibleOptions,
    selectedFacultyId,
    selectedCareerId,
    manualCareer,
    form,
    message,
  ]);
  function markDirty() {
    formDirty.current = true;
    dirty.current = true;
    setHasPendingChanges(true);
  }
  function goToSection(id: string) {
    if (id === 'documentos' || id === 'revision-envio') {
      const cvMissing = missingCurriculum(currentRecord?.curriculum);
      if (cvMissing.length > 0) {
        notification.error({
          message: 'No puedes seguir al siguiente paso',
          description: (
            <div>
              <Typography.Paragraph style={{ marginBottom: 6 }}>
                Debes completar y guardar todos los campos obligatorios del Formulario de Currículum Vitae antes de pasar a <strong>{id === 'documentos' ? 'Documentos' : 'Revisión y envío'}</strong> ({cvMissing.length} pendientes):
              </Typography.Paragraph>
              <ul style={{ maxHeight: 180, overflowY: 'auto', paddingLeft: 20, margin: 0, color: '#cf1322' }}>
                {cvMissing.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 8,
        });
        void message.error(`Paso bloqueado: Faltan ${cvMissing.length} campo(s) obligatorio(s) en el Currículum Vitae.`);
        setActiveSection('curriculum');
        const target = document.getElementById('curriculum');
        target?.scrollIntoView?.({ block: 'start' });
        return;
      }
    }
    setActiveSection(id);
    const target = document.getElementById(id);
    target?.scrollIntoView?.({ block: 'start' });
    if (target) {
      const focusTarget = target.matches('h2, [tabindex]')
        ? target
        : target.querySelector<HTMLElement>('h2') ?? target;
      focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
  }
  function goToMissing(label: string) {
    if (label.startsWith('CV: ') || label.startsWith('Currículum')) {
      setActiveSection('curriculum');
      goToSection('curriculum');
      return;
    }
    const mobility = label.startsWith('Movilidad: ')
      ? mobilityFields.find(([, title]) => title === label.slice(11))?.[0]
      : undefined;
    if (mobility) {
      setActiveSection('contacto');
      const target = 'mobility.' + mobility;
      setSubmissionTarget(
        typeof form.getFieldValue(['mobility', mobility]) === 'boolean'
          ? null
          : target
      );
      form.scrollToField(['mobility', mobility], { focus: true });
      return;
    }
    const field = fields.find(([, title]) => title === label)?.[0];
    if (field) {
      const section = formSections.find((group) =>
        group.fields.some((key) => key === field)
      );
      setActiveSection(
        section?.id === 'intereses-movilidad'
          ? 'contacto'
          : section?.id ?? 'datos-personales'
      );
      const target =
        field === 'faculty'
          ? 'faculty_catalog_id'
          : field === 'career'
            ? manualCareer
              ? 'career'
              : 'career_catalog_id'
            : field;
      const value = form.getFieldValue(target);
      setSubmissionTarget(
        value === null || value === undefined || value === '' ? target : null
      );
      form.scrollToField(target, { focus: true });
      return;
    }
    const documentType = documentTypes.find((item) => item.label === label);
    if (documentType) {
      setActiveSection('documentos');
      const target = document.getElementById('document-' + documentType.type);
      setSubmissionTarget('document-' + documentType.type);
      if (!target) {
        goToSection('documentos');
        return;
      }
      if (target && typeof target.scrollIntoView === 'function')
        target.scrollIntoView({ block: 'nearest' });
      const action = target?.querySelector<HTMLButtonElement>(
        '[aria-label^="Seleccionar "]'
      );
      action?.focus();
    }
  }
  function setManual(value: boolean) {
    setManualCareer(value);
    if (value) form.setFieldsValue({ career_catalog_id: null });
    setFacultyMismatch(false);
    markDirty();
  }
  function selectionChanged(selected: boolean) {
    setHasSelectedFiles(selected);
    pendingSelection.current = selected;
    dirty.current = formDirty.current || selected;
    setHasPendingChanges(dirty.current);
  }
  function confirm(values: DraftInput) {
    const errors = validateDraft(values);
    form.setFields(
      fields.map(([name]) => ({
        name,
        errors: errors[name] ? [errors[name]] : [],
      }))
    );
    if (Object.keys(errors).length) {
      form.scrollToField(Object.keys(errors)[0], { focus: true });
      return;
    }
    setFailure(null);
    setDraft({ ...normalizeDraft(values), career_manual: manualCareer });
  }
  async function save() {
    if (
      !draft ||
      uploading ||
      saveLock.current ||
      generation !== session.snapshot.generation ||
      session.snapshot.status !== 'authenticated'
    )
      return;
    saveLock.current = true;
    setSaving(true);
    setFailure(null);
    try {
      const saved = await session.run((signal) =>
        record
          ? pilotApi.update(
              record.id,
              { ...draft, version: currentRecord!.version },
              signal
            )
          : pilotApi.create(draft, signal)
      );
      if (generation !== session.snapshot.generation) return;
      formDirty.current = false;
      dirty.current = pendingSelection.current;
      setHasPendingChanges(dirty.current);
      setCurrentRecord(saved);
      setDraft(null);
      void message.success('Borrador guardado.');
      void session.client.invalidateQueries({ queryKey: session.key('list') });
      if (!pendingSelection.current)
        session.client.setQueryData(session.key('detail', saved.id), saved);
      session.client.removeQueries({
        queryKey: session.key('history', saved.id),
      });
      if (!pendingSelection.current)
        navigate(`${basePath}/${saved.id}`, { replace: true });
    } catch (error) {
      if (generation !== session.snapshot.generation || isCancel(error)) return;
      setFailure(error);
      setDraft(null);
      const errors = fieldErrors(error);
      form.setFields(
        fields.map(([name]) => ({ name, errors: errors[name] ?? [] }))
      );
      form.setFields([
        {
          name: 'faculty_catalog_id',
          errors: errors['faculty_catalog_id'] ?? [],
        },
        {
          name: 'career_catalog_id',
          errors: errors['career_catalog_id'] ?? [],
        },
      ]);
      form.setFields(
        mobilityFields.map(([key]) => ({
          name: ['mobility', key],
          errors: errors[`mobility.${key}`] ?? [],
        }))
      );
    } finally {
      saveLock.current = false;
      if (generation === session.snapshot.generation) setSaving(false);
    }
  }
  return (
    <Container className="pilot-portal-container">
      <Card className="pilot-portal-editor">
        <div className="pilot-portal-stack">
          <PageIntro
            title="Mi inscripción"
            status={currentRecord?.status}
            description="Todos los campos pueden quedar pendientes en el borrador. Completá los datos y documentos indicados antes de enviar a revisión."
            extra={
              currentRecord ? (
                <Flex align="center" gap={8} wrap>
                  {currentRecord.candidate_code ? (
                    <Tag color="blue" style={{ fontSize: 13, fontWeight: 600, padding: '2px 8px' }}>
                      Código de Postulante: {currentRecord.candidate_code}
                    </Tag>
                  ) : null}
                  <Tag
                    color="green"
                    style={{ fontSize: 13, fontWeight: 600, padding: '2px 8px', cursor: 'pointer' }}
                    onClick={() => navigate('/portal/pruebas')}
                  >
                    🎯 Test de Logro y Liderazgo disponible
                  </Tag>
                  <Typography.Text className="pilot-portal-version">
                    <span>Versión {currentRecord?.version}</span> · confirmada por
                    el servidor
                  </Typography.Text>
                </Flex>
              ) : (
                <Typography.Text>Nueva inscripción</Typography.Text>
              )
            }
          />
          <div
            className="pilot-portal-save-state"
            aria-live="polite"
            aria-atomic="true"
          >
            <Typography.Text strong>
              {saving
                ? 'Guardando borrador…'
                : uploading
                  ? 'Adjuntando documento…'
                  : hasPendingChanges
                    ? 'Cambios locales pendientes'
                    : currentRecord
                      ? 'Versión confirmada disponible'
                      : 'Borrador local sin guardar'}
            </Typography.Text>
            {hasSelectedFiles ? (
              <Typography.Text>
                Hay archivos seleccionados sin adjuntar. No cuentan como
                documentos cargados.
              </Typography.Text>
            ) : null}
            {hasPendingChanges ? (
              <Typography.Text>
                El avance local puede estar completo y seguir pendiente en la
                versión confirmada hasta guardar o adjuntar los cambios.
              </Typography.Text>
            ) : null}
            {currentRecord ? (
              <Typography.Text>
                {confirmedMissing?.length} pendientes para enviar en la versión
                confirmada. La completitud no implica aprobación.
              </Typography.Text>
            ) : null}
          </div>
          {currentRecord ? (
            <NextAction
              status={currentRecord.status}
              observationsCount={observationsCount}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              title="Comenzá tu inscripción"
              description="Guardá tus datos como borrador para poder adjuntar los documentos."
            />
          )}
          {failure ? (
            <Alert
              type="error"
              showIcon
              title={errorText(failure)}
              action={
                httpStatus(failure) === 409 ? (
                  <Button onClick={() => setReloadConfirm(true)}>
                    Recargar inscripción
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          <div className="pilot-portal-workspace">
            <nav
              className="pilot-portal-navigation"
              aria-label="Secciones de mi inscripción"
            >
              {[
                ['datos-personales', 'Datos personales'],
                ['informacion-academica', 'Información académica'],
                ['contacto', 'Contacto y disponibilidad'],
                ['curriculum', 'Currículum / Solicitud'],
                ['documentos', 'Documentos'],
                ['revision-envio', 'Revisión y envío'],
              ].map(([id, label]) => {
                const localCount = localMissing.filter(
                  (missing) => missingSection(missing) === id
                ).length;
                const confirmedCount = confirmedMissing?.filter(
                  (missing) => missingSection(missing) === id
                ).length;
                return (
                  <Button
                    key={id}
                    type="text"
                    aria-label={'Ir a ' + label}
                    aria-describedby={[
                      `portal-nav-${id}-progress`,
                      id !== 'documentos' &&
                      id !== 'revision-envio' &&
                      confirmedCount !== undefined
                        ? `portal-nav-${id}-confirmed`
                        : null,
                      id === 'documentos' && hasSelectedFiles
                        ? `portal-nav-${id}-selection`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-current={activeSection === id ? 'location' : undefined}
                    onClick={() => goToSection(id)}
                  >
                    <span className="pilot-portal-nav-copy">
                      <span>{label}</span>
                      <span
                        id={`portal-nav-${id}-progress`}
                        className="pilot-portal-nav-progress"
                      >
                        {(id === 'documentos' || id === 'revision-envio') &&
                        missingCurriculum(currentRecord?.curriculum).length > 0
                          ? '🔒 Bloqueado · requiere CV'
                          : id === 'revision-envio'
                          ? currentRecord &&
                            [
                              'submitted',
                              'in_review',
                              'review_concluded',
                            ].includes(currentRecord.status)
                            ? 'Envío confirmado'
                            : currentRecord?.status === 'correction_requested'
                              ? 'Pendiente de reenvío'
                              : 'Pendiente de envío'
                          : id === 'curriculum'
                            ? missingCurriculum(currentRecord?.curriculum).length > 0
                              ? `${missingCurriculum(currentRecord?.curriculum).length} pendiente${
                                  missingCurriculum(currentRecord?.curriculum).length === 1 ? '' : 's'
                                } · CV`
                              : 'CV completo'
                          : id === 'documentos'
                            ? localCount
                              ? `${localCount} sin adjuntar · ${
                                  currentRecord
                                    ? 'versión confirmada'
                                    : 'sin guardar'
                                }`
                              : 'Adjuntos completos · no implica aprobación'
                            : localCount
                              ? `${localCount} pendiente${
                                  localCount === 1 ? '' : 's'
                                } · local`
                              : 'Datos completos · local'}
                      </span>
                      {id === 'documentos' && hasSelectedFiles ? (
                        <span
                          id={`portal-nav-${id}-selection`}
                          className="pilot-portal-nav-progress"
                        >
                          Archivos locales sin adjuntar
                        </span>
                      ) : null}
                      {id !== 'documentos' &&
                      id !== 'revision-envio' &&
                      confirmedCount !== undefined ? (
                        <span
                          id={`portal-nav-${id}-confirmed`}
                          className="pilot-portal-nav-progress"
                        >
                          Versión confirmada: {confirmedCount}{' '}
                          {confirmedCount === 1 ? 'pendiente' : 'pendientes'}
                        </span>
                      ) : null}
                    </span>
                  </Button>
                );
              })}
              <Typography.Paragraph>
                Podés consultar todas las secciones y guardar un borrador
                incompleto. El avance local no implica validación ni aprobación.
              </Typography.Paragraph>
            </nav>
            <Form
              className="pilot-portal-form"
              form={form}
              initialValues={initial}
              layout="vertical"
              requiredMark={false}
              onValuesChange={(_, values) => {
                formDirty.current = true;
                dirty.current = true;
                setHasPendingChanges(true);
                setSubmissionTarget((current) => {
                  if (!current || current.startsWith('document-'))
                    return current;
                  const value = current
                    .split('.')
                    .reduce<unknown>(
                      (result, key) =>
                        result && typeof result === 'object'
                          ? (result as Record<string, unknown>)[key]
                          : undefined,
                      values
                    );
                  return value === undefined || value === null || value === ''
                    ? current
                    : null;
                });
              }}
              onFinish={confirm}
              disabled={saving || uploading}
            >
              {formSections.map((group) => (
                <section key={group.id} className="pilot-portal-group">
                  <Typography.Title
                    level={2}
                    id={group.id}
                    tabIndex={-1}
                    className="pilot-portal-group-title"
                  >
                    {group.title}
                  </Typography.Title>
                  <Typography.Paragraph type="secondary">
                    {group.description}
                  </Typography.Paragraph>
                  <Row gutter={[24, 0]}>
                    {group.fields.map((field) => {
                      if (field === 'faculty') {
                        return (
                          <Col key="faculty" xs={24} md={12}>
                            <Form.Item
                              name="faculty_catalog_id"
                              label="Facultad"
                              extra={
                                <span id="submission-requirement-faculty">
                                  Opcional
                                </span>
                              }
                            >
                              {facultiesQuery.isPending ? (
                                <Spin size="small" />
                              ) : facultiesQuery.isError ? (
                                <Alert
                                  type="error"
                                  showIcon
                                  title="No se pudo cargar el catálogo de facultades."
                                  action={
                                    <Button
                                      size="small"
                                      onClick={() =>
                                        void facultiesQuery.refetch()
                                      }
                                    >
                                      Reintentar
                                    </Button>
                                  }
                                />
                              ) : (
                                <Select
                                  allowClear
                                  showSearch
                                  virtual={false}
                                  placeholder="Seleccioná una facultad (opcional)"
                                  optionFilterProp="label"
                                  options={(facultiesQuery.data ?? []).map(
                                    (item) => ({
                                      value: item.id,
                                      label: item.name,
                                    })
                                  )}
                                  filterOption={(input, option) =>
                                    matchesCatalogSearch(
                                      {
                                        name:
                                          typeof option?.label === 'string'
                                            ? option.label
                                            : '',
                                      },
                                      input
                                    )
                                  }
                                  aria-invalid={
                                    submissionTarget === 'faculty_catalog_id' ||
                                    undefined
                                  }
                                  aria-describedby={
                                    submissionTarget === 'faculty_catalog_id'
                                      ? 'submission-requirement-faculty'
                                      : undefined
                                  }
                                  onChange={() => setFacultyMismatch(false)}
                                />
                              )}
                            </Form.Item>
                            {initial.faculty && !initial.faculty_catalog_id ? (
                              <Typography.Paragraph type="secondary">
                                {'Valor declarado anterior: "' +
                                  initial.faculty +
                                  '". Se conserva hasta que elijas una opción del catálogo.'}
                              </Typography.Paragraph>
                            ) : null}
                          </Col>
                        );
                      }
                      if (field === 'career') {
                        const options = visibleOptions;
                        const careerOptions: SelectProps['options'] =
                          selectedFacultyId
                            ? options.map((item) => ({
                                value: item.id,
                                label: item.needs_review
                                  ? item.name + ' · revisión pendiente'
                                  : item.name,
                              }))
                            : groupCatalogOptions(options).map(
                                ([group, items]) => ({
                                  label: group,
                                  options: items.map((item) => ({
                                    value: item.id,
                                    label: item.needs_review
                                      ? item.name + ' · revisión pendiente'
                                      : item.name,
                                  })),
                                })
                              );
                        return (
                          <Col key="career" xs={24} md={12}>
                            <Form.Item
                              name={
                                manualCareer ? 'career' : 'career_catalog_id'
                              }
                              label="Carrera o programa"
                              extra={
                                <span id="submission-requirement-career">
                                  Necesario para enviar
                                </span>
                              }
                            >
                              {manualCareer ? (
                                <Input
                                  maxLength={200}
                                  autoComplete="off"
                                  placeholder="Declaración manual excepcional"
                                  aria-invalid={
                                    submissionTarget === 'career' || undefined
                                  }
                                  aria-describedby={
                                    submissionTarget === 'career'
                                      ? 'submission-requirement-career'
                                      : undefined
                                  }
                                />
                              ) : optionsQuery.isPending ? (
                                <Spin size="small" />
                              ) : optionsQuery.isError ? (
                                <Alert
                                  type="error"
                                  showIcon
                                  title="No se pudo cargar el catálogo de carreras."
                                  action={
                                    <Button
                                      size="small"
                                      onClick={() =>
                                        void optionsQuery.refetch()
                                      }
                                    >
                                      Reintentar
                                    </Button>
                                  }
                                />
                              ) : (
                                <Select
                                  showSearch
                                  virtual={false}
                                  placeholder="Buscá y elegí tu carrera o programa"
                                  optionFilterProp="label"
                                  options={careerOptions}
                                  aria-invalid={
                                    submissionTarget === 'career_catalog_id' ||
                                    undefined
                                  }
                                  aria-describedby={
                                    submissionTarget === 'career_catalog_id'
                                      ? 'submission-requirement-career'
                                      : undefined
                                  }
                                  filterOption={(input, option) => {
                                    const item = visibleOptions.find(
                                      (entry) => entry.id === option?.value
                                    );
                                    return item
                                      ? matchesCatalogSearch(
                                          {
                                            name: item.name,
                                            sourceNames: item.source_names,
                                          },
                                          input
                                        )
                                      : false;
                                  }}
                                />
                              )}
                            </Form.Item>
                            {manualCareer ? (
                              <Typography.Paragraph type="secondary">
                                Declaración excepcional: se conserva tu texto y
                                se marca para revisión del catálogo. No bloquea
                                el envío.
                              </Typography.Paragraph>
                            ) : initial.career && !initial.career_catalog_id ? (
                              <Typography.Paragraph type="secondary">
                                {'Valor declarado anterior: "' +
                                  initial.career +
                                  '". Se conserva hasta que elijas una opción o marques la declaración manual.'}
                              </Typography.Paragraph>
                            ) : null}
                            {facultyMismatch ? (
                              <Alert
                                type="warning"
                                showIcon
                                title="La carrera anterior no corresponde a esta facultad. Elegí una carrera de la lista."
                              />
                            ) : null}
                            <Checkbox
                              checked={manualCareer}
                              onChange={(event) =>
                                setManual(event.target.checked)
                              }
                            >
                              No encuentro mi carrera
                            </Checkbox>
                          </Col>
                        );
                      }
                      const [key, label, max] = fields.find(
                        ([name]) => name === field
                      )!;
                      const requirementId = 'submission-requirement-' + key;
                      const submissionMissing = submissionTarget === key;
                      return (
                        <Col key={key} xs={24} md={12}>
                          <Form.Item
                            name={key}
                            label={label}
                            getValueProps={
                              key === 'birth_date'
                                ? (value: string | null) => ({
                                    value: value ? dayjs(value) : null,
                                  })
                                : undefined
                            }
                            getValueFromEvent={
                              key === 'birth_date'
                                ? (value: Dayjs | null) =>
                                    value?.format('YYYY-MM-DD') ?? null
                                : undefined
                            }
                            extra={
                              <Flex vertical gap={4}>
                                <span id={requirementId}>
                                  {key === 'faculty'
                                    ? 'Opcional'
                                    : 'Necesario para enviar'}
                                </span>
                                {key === 'declared_ppa' ? (
                                  <Typography.Text type="secondary">
                                    Declaralo con respaldo en tu histórico. Se
                                    conserva como texto; el sistema no lo
                                    calcula ni lo convierte.
                                  </Typography.Text>
                                ) : null}
                                {key === 'sex' ? (
                                  <Typography.Text type="secondary">
                                    Ingresá el dato que querés declarar. Se
                                    conserva como texto; no se infiere ni se
                                    convierte.
                                  </Typography.Text>
                                ) : null}
                              </Flex>
                            }
                          >
                            {key === 'birth_date' ? (
                              <DatePicker
                                className="pilot-portal-date-picker"
                                format="YYYY-MM-DD"
                                placeholder="Seleccioná una fecha"
                                aria-invalid={submissionMissing || undefined}
                                aria-describedby={
                                  submissionMissing ? requirementId : undefined
                                }
                              />
                            ) : (
                              <Input
                                maxLength={max}
                                type="text"
                                autoComplete="off"
                                aria-invalid={submissionMissing || undefined}
                                aria-describedby={
                                  submissionMissing ? requirementId : undefined
                                }
                              />
                            )}
                          </Form.Item>
                        </Col>
                      );
                    })}
                    {group.id === 'intereses-movilidad'
                      ? mobilityFields.map(([key, label]) => (
                          <Col key={key} xs={24} md={12}>
                            <Form.Item
                              name={['mobility', key]}
                              label={label}
                              extra={
                                <span
                                  id={'submission-requirement-mobility.' + key}
                                >
                                  Necesario para enviar
                                </span>
                              }
                              getValueProps={(value: boolean | null) => ({
                                value:
                                  value === true
                                    ? 'yes'
                                    : value === false
                                      ? 'no'
                                      : 'undeclared',
                              })}
                              getValueFromEvent={(value: string) =>
                                value === 'yes'
                                  ? true
                                  : value === 'no'
                                    ? false
                                    : null
                              }
                            >
                              <Select
                                aria-invalid={
                                  submissionTarget === 'mobility.' + key ||
                                  undefined
                                }
                                aria-describedby={
                                  submissionTarget === 'mobility.' + key
                                    ? 'submission-requirement-mobility.' + key
                                    : undefined
                                }
                                options={[
                                  {
                                    value: 'undeclared',
                                    label: 'No declarado',
                                  },
                                  { value: 'yes', label: 'Sí' },
                                  { value: 'no', label: 'No' },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                        ))
                      : null}
                  </Row>
                </section>
              ))}
              <section
                id="curriculum"
                className="pilot-portal-group"
                style={{ marginBottom: 32 }}
                aria-label="Currículum Vitae y Solicitud de Empleo"
              >
                <CurriculumForm
                  record={currentRecord}
                  editable={!currentRecord || canEdit(currentRecord, user)}
                  onSaved={(updatedCv) => {
                    if (currentRecord) {
                      setCurrentRecord({
                        ...currentRecord,
                        curriculum: updatedCv,
                      });
                    }
                    reload?.();
                  }}
                  onGoToNext={() => goToSection('documentos')}
                />
              </section>
              <section
                className="pilot-portal-documents"
                aria-label="Documentación de la inscripción"
              >
                {currentRecord &&
                missingCurriculum(currentRecord.curriculum).length > 0 ? (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Paso bloqueado: Currículum Vitae incompleto"
                    description={
                      <div>
                        <Typography.Paragraph style={{ marginBottom: 8 }}>
                          Debes completar y guardar todos los campos obligatorios del Formulario de Currículum Vitae antes de adjuntar o validar tus documentos.
                        </Typography.Paragraph>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => goToSection('curriculum')}
                        >
                          Ir al Currículum Vitae
                        </Button>
                      </div>
                    }
                  />
                ) : null}
                {currentRecord ? (
                  <Documents
                    record={currentRecord}
                    editable
                    missingDocumentType={
                      documentTypes.find(
                        (item) => submissionTarget === 'document-' + item.type
                      )?.type
                    }
                    busy={saving}
                    onBusy={setUploading}
                    onUploaded={(saved) => {
                      setCurrentRecord(saved);
                      setSubmissionTarget(null);
                    }}
                    onSelectionChange={selectionChanged}
                    reload={() => {
                      dirty.current = false;
                      formDirty.current = false;
                      pendingSelection.current = false;
                      setHasPendingChanges(false);
                      reload?.();
                    }}
                  />
                ) : (
                  <div>
                    <Typography.Title
                      level={2}
                      id="documentos"
                      tabIndex={-1}
                      className="pilot-portal-group-title"
                    >
                      Documentos
                    </Typography.Title>
                    <Typography.Paragraph>
                      Guardá el borrador para poder adjuntar documentos.
                    </Typography.Paragraph>
                  </div>
                )}
              </section>
              <section
                className="pilot-portal-review"
                aria-labelledby="revision-envio"
              >
                <Typography.Title
                  level={2}
                  id="revision-envio"
                  tabIndex={-1}
                  className="pilot-portal-group-title"
                >
                  Revisión y envío
                </Typography.Title>
                <Typography.Paragraph>
                  Guardar conserva tu borrador; enviar lo presenta al personal
                  para revisión. El envío utiliza únicamente la versión
                  confirmada por el servidor.
                </Typography.Paragraph>
                {!currentRecord ? (
                  <Alert
                    type="info"
                    title="Pendientes del borrador local"
                    description={
                      <>
                        <Typography.Paragraph>
                          Este resumen cambia con tus datos locales. Los
                          documentos sólo cuentan después de adjuntarlos a un
                          borrador guardado. Podés guardar aunque haya
                          pendientes; completitud no equivale a validación.
                        </Typography.Paragraph>
                        <ul>
                          {localMissing.map((label) => (
                            <li key={label}>
                              <Button
                                type="link"
                                size="small"
                                aria-label={'Ir al pendiente local: ' + label}
                                onClick={() => goToMissing(label)}
                              >
                                {label}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </>
                    }
                  />
                ) : null}
                <Flex className="pilot-portal-actions" gap={16} wrap>
                  <Button
                    htmlType="submit"
                    type={
                      currentRecord && renderActions ? 'default' : 'primary'
                    }
                    loading={saving}
                  >
                    Guardar borrador
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(
                        record
                          ? `${basePath}/${record.id}`
                          : '/portal/inscripcion'
                      )
                    }
                  >
                    Descartar y volver
                  </Button>
                </Flex>
                {renderActions?.({
                  record: currentRecord,
                  dirty: hasPendingChanges,
                  busy: saving || uploading,
                  onGoToMissing: goToMissing,
                })}
              </section>
            </Form>
          </div>
          <Modal
            open={draft !== null}
            title={
              record ? 'Guardar cambios del borrador' : 'Confirmar borrador'
            }
            okText="Guardar"
            cancelText="Seguir editando"
            confirmLoading={saving}
            closable={!saving}
            mask={{ closable: !saving }}
            cancelButtonProps={{ disabled: saving }}
            onCancel={() => setDraft(null)}
            onOk={() => void save()}
          >
            <Typography.Paragraph>
              Guardarás los datos de tu inscripción como borrador. Este paso no
              la envía a revisión.
            </Typography.Paragraph>
          </Modal>
          <Modal
            open={blocker.state === 'blocked'}
            title="Descartar cambios sin guardar"
            okText="Descartar"
            cancelText="Seguir editando"
            onCancel={() => {
              if (blocker.state === 'blocked') blocker.reset();
            }}
            onOk={() => {
              dirty.current = false;
              if (blocker.state === 'blocked') blocker.proceed();
            }}
          >
            <Typography.Paragraph>
              Los cambios de este formulario y los archivos todavía no
              adjuntados se perderán. Los documentos ya adjuntados se conservan.
            </Typography.Paragraph>
          </Modal>
          <Modal
            open={reloadConfirm}
            title="Recargar expediente"
            okText="Descartar y recargar"
            cancelText="Conservar borrador"
            onCancel={() => setReloadConfirm(false)}
            onOk={() => {
              dirty.current = false;
              setReloadConfirm(false);
              if (reload) reload();
              else {
                void session.client.invalidateQueries({
                  queryKey: session.key('list'),
                });
                navigate('/portal/inscripcion', { replace: true });
              }
            }}
          >
            <Typography.Paragraph>
              Se descartarán los cambios sin guardar y se consultará la versión
              actual de la inscripción.
            </Typography.Paragraph>
          </Modal>
        </div>
      </Card>
    </Container>
  );
}
