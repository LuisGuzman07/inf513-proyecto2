import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Descriptions,
  Divider,
  Alert,
  Spin,
  Empty,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  IdcardOutlined,
  BookOutlined,
  ToolOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { CandidateReportModal } from './candidate-report';
import { pilotApi } from './api';
import { usePilotSession } from './context';
import type { AnonymousCandidate, AnonymousCandidateDetail } from './types';
import { formatRecordDate } from './presentation-data';
import { Container } from '../components/shared/container/container';
import { StatusTag } from './presentation';

export function CandidatePoolPage() {
  const { session } = usePilotSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [careerFilter, setCareerFilter] = useState<string | undefined>();
  const [modalityFilter, setModalityFilter] = useState<string | undefined>();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // Query candidate pool list
  const { data, isLoading, refetch } = useQuery({
    queryKey: session.key('candidate-pool', page, search, careerFilter ?? '', modalityFilter ?? ''),
    queryFn: ({ signal }) =>
      pilotApi.candidatePool(
        {
          page,
          per_page: 15,
          search: search.trim() || undefined,
          career: careerFilter || undefined,
          modality: modalityFilter || undefined,
        },
        signal
      ),
    staleTime: 30000,
  });

  // Query candidate detail for modal
  const detailQuery = useQuery({
    queryKey: session.key('candidate-pool-detail', selectedCode ?? ''),
    queryFn: ({ signal }) =>
      selectedCode ? pilotApi.candidatePoolDetail(selectedCode, signal) : Promise.resolve(null),
    enabled: !!selectedCode,
  });

  const candidates = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Container style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ marginBottom: 6 }}>
          <SafetyCertificateOutlined style={{ marginRight: 10, color: '#1677ff' }} />
          Banco de Candidatos (Talento Universitario)
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 15 }}>
          Directorio de postulantes universitarios y titulados de la UAGRM evaluados mediante pruebas psicométricas y de aptitud profesional.
        </Typography.Paragraph>
      </div>

      <Card style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Input
              placeholder="Buscar por código, puesto, conocimientos técnicos..."
              prefix={<SearchOutlined />}
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                void refetch();
              }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              placeholder="Modalidad de trabajo"
              allowClear
              style={{ width: '100%' }}
              value={modalityFilter}
              onChange={(val) => {
                setModalityFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'Presencial', label: 'Presencial' },
                { value: 'Híbrido', label: 'Híbrido' },
                { value: 'Remoto', label: 'Remoto' },
              ]}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              placeholder="Carrera / Área"
              allowClear
              style={{ width: '100%' }}
              value={careerFilter}
              onChange={(val) => {
                setCareerFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'Sistemas', label: 'Ing. de Sistemas / Informática' },
                { value: 'Comercial', label: 'Ingeniería Comercial' },
                { value: 'Administración', label: 'Administración de Empresas' },
                { value: 'Contaduría', label: 'Contaduría Pública' },
                { value: 'Industrial', label: 'Ingeniería Industrial' },
              ]}
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              type="primary"
              onClick={() => {
                setPage(1);
                void refetch();
              }}
              style={{ width: '100%' }}
            >
              Filtrar
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table<AnonymousCandidate>
          rowKey="candidate_code"
          loading={isLoading}
          dataSource={candidates}
          pagination={{
            current: meta?.current_page ?? 1,
            pageSize: meta?.per_page ?? 15,
            total: meta?.total ?? 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Código Postulante',
              dataIndex: 'candidate_code',
              width: 170,
              render: (code: string) => (
                <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, padding: '3px 8px' }}>
                  {code}
                </Tag>
              ),
            },
            {
              title: 'Puesto / Vacante de Interés',
              dataIndex: 'target_position',
              width: 220,
              render: (pos: string) => <strong>{pos}</strong>,
            },
            {
              title: 'Carrera y Rendimiento',
              key: 'academic',
              render: (_, item) => (
                <div>
                  <Typography.Text strong style={{ display: 'block' }}>
                    {item.career}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Facultad: {item.faculty} {item.declared_ppa ? `· PPA: ${item.declared_ppa}` : ''}
                  </Typography.Text>
                </div>
              ),
            },
            {
              title: 'Condiciones',
              key: 'conditions',
              width: 200,
              render: (_, item) => (
                <Space direction="vertical" size={2}>
                  <Tag color={item.work_modality === 'Remoto' ? 'green' : item.work_modality === 'Híbrido' ? 'cyan' : 'default'}>
                    {item.work_modality}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#555' }}>
                    Salario: <strong>{item.expected_salary}</strong>
                  </span>
                </Space>
              ),
            },
            {
              title: 'Conocimientos y Software',
              dataIndex: 'technical_knowledge',
              render: (tech: string | null) =>
                tech ? (
                  <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12 }}>
                    {tech}
                  </Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
            {
              title: 'Pruebas',
              key: 'evaluations',
              width: 130,
              align: 'center',
              render: (_, item) =>
                item.evaluations_completed_count > 0 ? (
                  <Badge count={`${item.evaluations_completed_count} rendidas`} style={{ backgroundColor: '#52c41a' }} />
                ) : (
                  <Tag>Sin rendir</Tag>
                ),
            },
            {
              title: 'Estado',
              dataIndex: 'status',
              width: 140,
              render: (status) => <StatusTag status={status} />,
            },
            {
              title: 'Acciones',
              key: 'action',
              width: 180,
              render: (_, item) => (
                <Space size="small">
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedCode(item.candidate_code);
                    }}
                  >
                    Ficha
                  </Button>
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<FilePdfOutlined />}
                    onClick={() => {
                      setSelectedCode(item.candidate_code);
                      setReportOpen(true);
                    }}
                  >
                    Reporte PDF
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal de Ficha Técnica Anónima */}
      <Modal
        open={!!selectedCode && !reportOpen}
        onCancel={() => setSelectedCode(null)}
        footer={[
          <Button
            key="report"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => setReportOpen(true)}
          >
            Ver Reporte Completo / PDF
          </Button>,
          <Button key="close" onClick={() => setSelectedCode(null)}>
            Cerrar ficha
          </Button>,
        ]}
        width={850}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IdcardOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span>{detailQuery.data?.is_staff_view ? 'Ficha Integral del Candidato' : 'Ficha Técnica Anónima del Postulante'}</span>
            {selectedCode && (
              <Tag color="blue" style={{ fontSize: 14, fontWeight: 700 }}>
                {selectedCode}
              </Tag>
            )}
            {detailQuery.data?.is_staff_view && (
              <Tag color="purple">Vista Evaluador</Tag>
            )}
          </div>
        }
      >
        {detailQuery.isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : detailQuery.data ? (
          <AnonymousProfileView candidate={detailQuery.data} />
        ) : (
          <Empty description="No se pudo cargar la información del postulante." />
        )}
      </Modal>

      {/* Modal de Reporte Completo e Imprimible (PDF) */}
      <CandidateReportModal
        candidate={detailQuery.data ?? null}
        open={reportOpen && !detailQuery.isLoading && !!detailQuery.data}
        onClose={() => setReportOpen(false)}
      />
    </Container>
  );
}

function AnonymousProfileView({ candidate }: { candidate: AnonymousCandidateDetail }) {
  const isStaff = !!candidate.is_staff_view;

  return (
    <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 }}>
      {isStaff && (
        <Alert
          type="success"
          showIcon
          message="Vista de Evaluador / Administración"
          description="Visualizando expediente completo del postulante con datos de contacto, PPA verificado y referencias completas."
          style={{ marginBottom: 20 }}
        />
      )}

      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 20 }}>
        {isStaff && candidate.full_name && (
          <Descriptions.Item label="Nombre Completo" span={2}>
            <strong>{candidate.full_name}</strong>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Código de Postulante">
          <Tag color="blue" style={{ fontWeight: 700 }}>{candidate.candidate_code}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Puesto al que postula">
          <strong>{candidate.target_position}</strong>
        </Descriptions.Item>
        {isStaff && (
          <>
            <Descriptions.Item label="Correo Electrónico">
              {candidate.email || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Teléfono de Contacto">
              {candidate.phone || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Registro Universitario / CI">
              {candidate.university_registration || candidate.national_id || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Rendimiento (PPA)">
              <Tag color="purple" style={{ fontWeight: 700 }}>
                {candidate.reviewed_ppa ? `${candidate.reviewed_ppa} (Revisado)` : candidate.declared_ppa ?? 'No declarado'}
              </Tag>
            </Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="Carrera declarada">
          {candidate.career}
        </Descriptions.Item>
        <Descriptions.Item label="Facultad">
          {candidate.faculty}
        </Descriptions.Item>
        <Descriptions.Item label="Pretensión Salarial">
          {candidate.expected_salary}
        </Descriptions.Item>
        <Descriptions.Item label="Modalidad de Trabajo">
          {candidate.work_modality}
        </Descriptions.Item>
        <Descriptions.Item label="Disponibilidad Horaria">
          {candidate.schedule_availability}
        </Descriptions.Item>
        <Descriptions.Item label="Disponibilidad para Viajar">
          {candidate.travel_availability}
        </Descriptions.Item>
        <Descriptions.Item label="Licencia de Conducir">
          {candidate.driver_license}
        </Descriptions.Item>
      </Descriptions>

      {/* Competencias y software */}
      <Divider style={{ margin: '16px 0' }} />
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        <ToolOutlined style={{ marginRight: 6, color: '#1677ff' }} /> Competencias Técnicas e Idiomas
      </Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card size="small" title="Conocimientos de Software y Herramientas">
            <Typography.Paragraph style={{ margin: 0 }}>
              {candidate.technical_knowledge || 'No especificados'}
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="Idiomas">
            <Typography.Paragraph style={{ margin: 0 }}>
              {candidate.languages || 'No especificados'}
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      {/* Formación Académica */}
      <Divider style={{ margin: '16px 0' }} />
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        <BookOutlined style={{ marginRight: 6, color: '#1677ff' }} /> Formación Académica
      </Typography.Title>
      {candidate.education_levels && candidate.education_levels.length > 0 ? (
        candidate.education_levels.filter((edu) => edu.career).map((edu, i) => (
          <div key={i} style={{ background: '#fafafa', padding: '10px 14px', borderRadius: 6, marginBottom: 8 }}>
            <span style={{ color: '#1677ff', fontWeight: 600 }}>{edu.level}: </span>
            <strong>{edu.career}</strong> — {edu.institution} ({edu.status} {edu.year ? `· ${edu.year}` : ''})
          </div>
        ))
      ) : (
        <Typography.Text type="secondary">Sin formación detallada</Typography.Text>
      )}

      {/* Historial Laboral Anónimo */}
      <Divider style={{ margin: '16px 0' }} />
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        <IdcardOutlined style={{ marginRight: 6, color: '#1677ff' }} /> Historial de Experiencia Laboral (Anónima)
      </Typography.Title>
      {candidate.work_experiences && candidate.work_experiences.length > 0 ? (
        candidate.work_experiences.map((job, idx) => (
          <Card key={idx} size="small" type="inner" title={`Empleo ${idx + 1}: ${job.position} en ${job.company}`} style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#666' }}>
              <strong>Periodo:</strong> {job.period} {job.leaving_reason ? `· Motivo de salida: ${job.leaving_reason}` : ''}
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              <strong>Funciones y logros:</strong> {job.achievements}
            </p>
          </Card>
        ))
      ) : (
        <Typography.Text type="secondary">Sin experiencia laboral previa registrada</Typography.Text>
      )}

      {/* Pruebas Psicotécnicas Rendidas */}
      <Divider style={{ margin: '16px 0' }} />
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        <ExperimentOutlined style={{ marginRight: 6, color: '#1677ff' }} /> Pruebas y Evaluaciones Psicolaborales
      </Typography.Title>
      {candidate.evaluations && candidate.evaluations.length > 0 ? (
        candidate.evaluations.map((ev) => (
          <div
            key={ev.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <div>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <strong>{ev.instrument_name || ev.instrument_title || 'Prueba psicotécnica'}</strong>
              <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                (Completada {ev.submitted_at ? formatRecordDate(ev.submitted_at) : ''})
              </span>
            </div>
            <Space>
              {(ev.raw_result as any)?.dominant && (
                <Tag color="cyan">Dominante: {(ev.raw_result as any).dominant}</Tag>
              )}
              {typeof (ev.raw_result as any)?.percentage === 'number' && (
                <Tag color="blue">{Math.round((ev.raw_result as any).percentage)}% aciertos</Tag>
              )}
              {typeof (ev.raw_result as any)?.global_percentage === 'number' && (
                <Tag color="blue">{Math.round((ev.raw_result as any).global_percentage)}% promedio</Tag>
              )}
              <Tag color="success">Rendida</Tag>
            </Space>
          </div>
        ))
      ) : (
        <Typography.Text type="secondary">No se han asignado o completado evaluaciones psicotécnicas aún.</Typography.Text>
      )}
    </div>
  );
}
