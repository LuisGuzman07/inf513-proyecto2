import {
  Button,
  Descriptions,
  Tag,
  Typography,
  Modal,
} from 'antd';
import {
  PrinterOutlined,
  UserOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { AnonymousCandidateDetail } from './types';
import {
  DominosResultsView,
  Fp16ResultsView,
  SoftSkillsResultsView,
  isDominosName,
  is16FpName,
  isSoftSkillsName,
} from './evaluations-results';
import { isMcClellandName, McClellandResultsView } from './evaluations';
import type { EvaluationAssignment } from './evaluations-types';
import './candidate-report.css';

interface CandidateReportModalProps {
  candidate: AnonymousCandidateDetail | null;
  open: boolean;
  onClose: () => void;
}

export function CandidateReportModal({
  candidate,
  open,
  onClose,
}: CandidateReportModalProps) {
  if (!candidate) return null;

  const isStaff = Boolean(candidate.is_staff_view);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1050}
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ background: '#1e3a8a', borderColor: '#1e3a8a' }}
        >
          Descargar Reporte PDF / Imprimir
        </Button>,
      ]}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilePdfOutlined style={{ color: '#dc2626', fontSize: 20 }} />
          <span>Reporte de Evaluación del Candidato</span>
          <Tag color={isStaff ? 'gold' : 'blue'} style={{ fontWeight: 700 }}>
            {candidate.candidate_code}
          </Tag>
          {isStaff ? (
            <Tag color="gold">Vista Administrador</Tag>
          ) : (
            <Tag color="cyan">Vista Pública</Tag>
          )}
        </div>
      }
    >
      <div className="candidate-report-printable">
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="report-header">
          <div className="report-header-brand">
            <Typography.Title level={3} style={{ margin: 0, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
              UAGRM · Talento Universitario
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
              Dirección de Selección y Evaluación de Personal · Formato Oficial
            </Typography.Paragraph>
          </div>
          <div className="report-header-meta">
            <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px' }}>
              CÓDIGO: {candidate.candidate_code}
            </Tag>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Emisión: {new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 1. FICHA DE DATOS DEL CANDIDATO (Perfil_de_Candidato.pdf) */}
        <div className="report-section-box">
          <div className="report-section-title">
            <UserOutlined /> I. DATOS DE IDENTIFICACIÓN DEL CANDIDATO
          </div>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, md: 3 }}
            className="report-descriptions"
          >
            {isStaff ? (
              <Descriptions.Item label="Nombre Completo" span={2}>
                <strong>{candidate.full_name || 'No declarado'}</strong>
              </Descriptions.Item>
            ) : (
              <Descriptions.Item label="Identificador" span={2}>
                <Tag color="blue" style={{ fontWeight: 800 }}>{candidate.candidate_code}</Tag>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  (Identidad clasificada)
                </span>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Puesto de Postulación">
              <strong>{candidate.target_position}</strong>
            </Descriptions.Item>

            {isStaff ? (
              <>
                <Descriptions.Item label="Correo Electrónico">
                  {candidate.email || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Teléfono de Contacto">
                  {candidate.phone || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Registro / CI">
                  {candidate.university_registration || candidate.national_id || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Rendimiento (PPA)">
                  <Tag color="purple" style={{ fontWeight: 700 }}>
                    {candidate.reviewed_ppa ? `PPA Revisado: ${candidate.reviewed_ppa}` : `PPA: ${candidate.declared_ppa || 'No declarado'}`}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Sexo Declarado">
                  {candidate.sex || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha de Nacimiento">
                  {candidate.birth_date || '—'}
                </Descriptions.Item>
              </>
            ) : null}

            <Descriptions.Item label="Carrera">
              {candidate.career}
            </Descriptions.Item>
            <Descriptions.Item label="Facultad">
              {candidate.faculty}
            </Descriptions.Item>
            <Descriptions.Item label="Modalidad">
              {candidate.work_modality}
            </Descriptions.Item>
            <Descriptions.Item label="Pretensión Salarial">
              {candidate.expected_salary}
            </Descriptions.Item>
            <Descriptions.Item label="Disponibilidad">
              {candidate.incorporation_availability} ({candidate.schedule_availability})
            </Descriptions.Item>
            <Descriptions.Item label="Licencia de Conducir">
              {candidate.driver_license}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 2. CUADRO RESUMEN DE COEFICIENTES Y PRUEBAS (Perfil_de_Candidato.pdf) */}
        <div className="report-section-box">
          <div className="report-section-title">
            <ExperimentOutlined /> II. TABLA RESUMEN DE BATERÍA DE EVALUACIONES Y RESULTADOS
          </div>
          <table className="report-summary-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Área / Instrumento</th>
                <th style={{ width: '25%' }}>Tipo de Métrica</th>
                <th style={{ width: '25%' }}>Resultado Obtenido</th>
                <th style={{ width: '20%' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {/* Currículum y Méritos */}
              <tr>
                <td><strong>Evaluación Curricular y Perfil</strong></td>
                <td>Méritos y experiencia laboral</td>
                <td>{candidate.has_curriculum ? 'Expediente Verificado' : 'Declaración Inicial'}</td>
                <td><Tag color="green">Aprobado</Tag></td>
              </tr>

              {/* Mapeo dinámico de todas las pruebas rendidas */}
              {candidate.evaluations && candidate.evaluations.length > 0 ? (
                candidate.evaluations.map((ev) => {
                  const raw = ev.raw_result;
                  let metricType = 'Aciertos / Calificación';
                  let resultText = 'Completada';

                  if (raw && 'model' in raw) {
                    if (raw.model === 'dominos') {
                      metricType = 'Porcentaje de Deducción (D-48)';
                      resultText = `${raw.percentage}% (${raw.score}/${raw.max_score} aciertos)`;
                    } else if (raw.model === '16fp') {
                      metricType = '16 Factores de Personalidad';
                      resultText = `${raw.form} · Baremos Estenes (1–10)`;
                    } else if (raw.model === 'mcclelland') {
                      metricType = 'Liderazgo y Motivadores';
                      resultText = `Dominante: ${raw.dominant} (${raw.highest_score} pts)`;
                    } else if (raw.model === 'habilidades_blandas') {
                      metricType = 'Autopercepción Conductual (1–5)';
                      resultText = `Promedio ${raw.global_average} / 5.0 (${raw.global_percentage}%)`;
                    }
                  } else if (raw && 'score' in raw && 'percentage' in raw) {
                    metricType = 'Porcentaje de aciertos';
                    resultText = `${(raw as any).percentage}% (${(raw as any).score}/${(raw as any).max_score})`;
                  } else if (raw && 'score' in raw) {
                    metricType = 'Puntaje bruto';
                    resultText = `${raw.score} / ${raw.max_score} aciertos`;
                  }

                  return (
                    <tr key={ev.id}>
                      <td>
                        {ev.classified_area_label && (
                          <Tag
                            color={
                              ev.classified_area === 'inteligencia'
                                ? 'blue'
                                : ev.classified_area === 'habilidades_blandas'
                                ? 'green'
                                : ev.classified_area === 'personalidad'
                                ? 'purple'
                                : 'gold'
                            }
                            style={{ fontSize: 11, marginRight: 6, fontWeight: 600 }}
                          >
                            {ev.classified_area_label}
                          </Tag>
                        )}
                        <strong>{ev.instrument_name || ev.instrument_title}</strong>
                      </td>
                      <td>{metricType}</td>
                      <td><strong>{resultText}</strong></td>
                      <td>
                        <Tag color={ev.status === 'submitted' ? 'green' : 'processing'}>
                          {ev.status === 'submitted' ? 'Calificada' : 'En progreso'}
                        </Tag>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>
                    No se han registrado evaluaciones psicotécnicas rendidas para este postulante.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. REPORTES PSICOMÉTRICOS DETALLADOS POR PRUEBA */}
        {candidate.evaluations && candidate.evaluations.length > 0 ? (
          candidate.evaluations.map((ev) => {
            const raw = ev.raw_result;
            const instName = ev.instrument_name || ev.instrument_title || '';

            // Adapt evaluation assignment shape for existing visualizers
            const syntheticAssignment: EvaluationAssignment = {
              id: ev.id,
              registration_id: '',
              version: 1,
              status: ev.status as any,
              assigned_at: '',
              submitted_at: ev.submitted_at,
              answer_type: (ev.answer_type as any) || 'single_choice',
              answered_count: 0,
              unanswered_count: 0,
              partial_count: 0,
              instrument: {
                id: ev.instrument_id || '',
                name: instName,
                version_label: ev.version_label || '1.0.0',
                answer_type: (ev.answer_type as any) || 'single_choice',
                scoring_enabled: true,
                source_review_state: 'aprobado',
                exercise_count: 0,
                conformity: null,
              },
              instructions: '',
              example_text: '',
              example_image_url: null,
              exercises: [],
              answers: {},
              raw_result: raw,
            };

            // Test de Habilidades Blandas: Psicograma Vertical Continuo (según imagen del usuario)
            if (isSoftSkillsName(instName) && raw && 'model' in raw && raw.model === 'habilidades_blandas') {
              return (
                <div key={ev.id} className="report-section-box report-break-before">
                  <div className="report-section-title">
                    <CheckCircleOutlined /> EVALUACIÓN DE HABILIDADES BLANDAS (PSICOGRAMA CONDUCTUAL)
                  </div>
                  <SoftSkillsResultsView
                    assignment={syntheticAssignment}
                    result={raw}
                    staffView={isStaff}
                  />
                </div>
              );
            }

            // Cuestionario 16 FP: Hoja de Perfil Psicométrico
            if (is16FpName(instName) && raw && 'model' in raw && raw.model === '16fp') {
              return (
                <div key={ev.id} className="report-section-box report-break-before">
                  <div className="report-section-title">
                    <CheckCircleOutlined /> CUESTIONARIO 16 FACTORES DE LA PERSONALIDAD (16 FP)
                  </div>
                  <Fp16ResultsView
                    assignment={syntheticAssignment}
                    result={raw}
                    staffView={isStaff}
                  />
                </div>
              );
            }

            // Test de Liderazgo y Motivación (McClelland)
            if (isMcClellandName(instName)) {
              return (
                <div key={ev.id} className="report-section-box report-break-inside-avoid">
                  <div className="report-section-title">
                    <CheckCircleOutlined /> TEST DE LOGRO Y LIDERAZGO (MOTIVACIÓN DE MCCLELLAND)
                  </div>
                  <McClellandResultsView
                    assignment={syntheticAssignment}
                    result={raw}
                  />
                </div>
              );
            }

            // Test de Dominós (D-48)
            if (isDominosName(instName) && raw && 'model' in raw && raw.model === 'dominos') {
              return (
                <div key={ev.id} className="report-section-box report-break-inside-avoid">
                  <div className="report-section-title">
                    <CheckCircleOutlined /> TEST DE DOMINÓS (D-48 — RAZONAMIENTO INDUCTIVO)
                  </div>
                  <DominosResultsView
                    assignment={syntheticAssignment}
                    result={raw}
                    staffView={isStaff}
                  />
                </div>
              );
            }

            return null;
          })
        ) : null}

        {/* PIE DE PÁGINA INSTITUCIONAL */}
        <div className="report-footer">
          <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 11, textAlign: 'center' }}>
            Universidad Autónoma Gabriel René Moreno · Sistema de Gestión de Selección de Personal (Grupo 18B)
            <br />
            Reporte generado electrónicamente. La información contenida en este documento es confidencial y para fines evaluativos exclusivos.
          </Typography.Paragraph>
        </div>
      </div>
    </Modal>
  );
}
