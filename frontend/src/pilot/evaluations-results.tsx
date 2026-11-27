import {
  Alert,
  Collapse,
  Flex,
  Table,
  Tag,
  Typography,
} from 'antd';
import type {
  DominosResult,
  EvaluationAssignment,
  Fp16FactorResult,
  Fp16Result,
  RawResult,
  SoftSkillsItemResult,
  SoftSkillsResult,
  StandardScoringResult,
} from './evaluations-types';

export function isDominosName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    lower.includes('dominó') ||
    lower.includes('dominos') ||
    lower.includes('d-48') ||
    lower.includes('d48')
  );
}

export function is16FpName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    lower.includes('16 fp') ||
    lower.includes('16fp') ||
    lower.includes('cuestionario 16')
  );
}

export function isSoftSkillsName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes('habilidades blandas') || lower.includes('blandas');
}

// ---------------------------------------------------------------------------
// Tests de Aptitud / Inteligencia / Conocimiento - Respuesta Porcentual
// ---------------------------------------------------------------------------

export function PercentageResultsView({
  assignment,
  result,
  staffView = false,
}: {
  assignment: EvaluationAssignment;
  result?: RawResult | null;
  staffView?: boolean;
}) {
  const res: StandardScoringResult | null =
    result && 'correct' in result && 'max_score' in result && !('detail' in result)
      ? (result as StandardScoringResult)
      : null;

  if (!res) return null;

  const percentage =
    typeof res.percentage === 'number'
      ? res.percentage
      : res.max_score > 0
      ? Math.round((res.score / res.max_score) * 1000) / 10
      : 0;

  const percentColor =
    percentage >= 80
      ? '#16a34a'
      : percentage >= 50
      ? '#2563eb'
      : '#d97706';

  return (
    <div className="dominos-results-wrapper">
      <Alert
        type="success"
        showIcon
        message="Evaluación completada y calificada"
        description={
          staffView
            ? 'Resultado porcentual directo registrado para el postulante.'
            : 'Tus respuestas quedaron confirmadas y calificadas automáticamente.'
        }
      />

      <div className="dominos-kpi-card">
        <Typography.Title level={4} style={{ textAlign: 'center', margin: '0 0 4px' }}>
          {assignment.instrument.name}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 20 }}>
          Porcentaje de aciertos sobre {res.max_score} reactivos evaluados.
        </Typography.Paragraph>

        <div className="dominos-score-circle" style={{ borderColor: percentColor }}>
          <span className="dominos-score-percent" style={{ color: percentColor }}>
            {percentage}%
          </span>
          <span className="dominos-score-fraction">
            {res.score} de {res.max_score} aciertos
          </span>
        </div>

        <div className="dominos-stats-row">
          <div className="dominos-stat-box dominos-stat-box--correct">
            <span className="dominos-stat-value">{res.correct}</span>
            <span className="dominos-stat-label">Correctas</span>
          </div>
          <div className="dominos-stat-box dominos-stat-box--incorrect">
            <span className="dominos-stat-value">{res.incorrect}</span>
            <span className="dominos-stat-label">Incorrectas</span>
          </div>
          <div className="dominos-stat-box dominos-stat-box--absent">
            <span className="dominos-stat-value">{res.absent}</span>
            <span className="dominos-stat-label">Sin responder</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test de Dominós (D-48) - Resultados Porcentuales
// ---------------------------------------------------------------------------

export function DominosResultsView({
  assignment,
  result,
  staffView = false,
}: {
  assignment: EvaluationAssignment;
  result?: RawResult | null;
  staffView?: boolean;
}) {
  const dom: DominosResult | null =
    result && 'model' in result && result.model === 'dominos'
      ? (result as DominosResult)
      : null;

  if (!dom) return null;

  const percentColor =
    dom.percentage >= 80
      ? '#16a34a'
      : dom.percentage >= 50
      ? '#2563eb'
      : '#d97706';

  return (
    <div className="dominos-results-wrapper">
      <Alert
        type="success"
        showIcon
        message="Test de Dominós (D-48) Completado"
        description="Se ha registrado la evaluación psicométrica de razonamiento lógico inductivo y factor general de inteligencia."
      />

      <div className="dominos-kpi-card">
        <Typography.Title level={4} style={{ textAlign: 'center', margin: '0 0 4px' }}>
          {assignment.instrument.name}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 20 }}>
          Calificación directa expresada como porcentaje de aciertos sobre los 48 ejercicios.
        </Typography.Paragraph>

        <div className="dominos-score-circle" style={{ borderColor: percentColor }}>
          <span className="dominos-score-percent" style={{ color: percentColor }}>
            {dom.percentage}%
          </span>
          <span className="dominos-score-fraction">
            {dom.score} de {dom.max_score} aciertos
          </span>
        </div>

        <div className="dominos-stats-row">
          <div className="dominos-stat-box dominos-stat-box--correct">
            <span className="dominos-stat-number">{dom.correct}</span>
            <span className="dominos-stat-label">Aciertos</span>
          </div>
          <div className="dominos-stat-box dominos-stat-box--incorrect">
            <span className="dominos-stat-number">{dom.incorrect}</span>
            <span className="dominos-stat-label">Errores</span>
          </div>
          <div className="dominos-stat-box dominos-stat-box--absent">
            <span className="dominos-stat-number">{dom.absent}</span>
            <span className="dominos-stat-label">Sin responder</span>
          </div>
          <div className="dominos-stat-box dominos-stat-box--total">
            <span className="dominos-stat-number">{dom.max_score}</span>
            <span className="dominos-stat-label">Total ejercicios</span>
          </div>
        </div>

        <div className="dominos-info-note">
          <p>
            <strong>Nota psicométrica:</strong> El Test de Dominós (D-48) de Pierre Pichot evalúa la
            capacidad para abstraer y aplicar relaciones lógicas deductivas/inductivas a partir de
            fichas de dominó. El porcentaje refleja la exactitud de deducción del candidato en toda la prueba.
          </p>
        </div>
      </div>

      {dom.detail ? (
        <Collapse
          style={{ marginTop: 20 }}
          items={[
            {
              key: 'detail',
              label: `Ver desglose de los 48 ejercicios (${dom.correct} aciertos, ${dom.incorrect} fallos, ${dom.absent} ausentes)`,
              children: (
                <div className="dominos-exercise-grid">
                  {Object.entries(dom.detail)
                    .sort(([, a], [, b]) => a.number - b.number)
                    .map(([id, item]) => {
                      const isCorrect = item.status === 'correct';
                      const isAbsent = item.status === 'absent';
                      return (
                        <div
                          key={id}
                          className={
                            'dominos-exercise-cell ' +
                            (isCorrect
                              ? 'dominos-exercise-cell--correct'
                              : isAbsent
                              ? 'dominos-exercise-cell--absent'
                              : 'dominos-exercise-cell--incorrect')
                          }
                        >
                          <div className="dominos-exercise-header">
                            <span className="dominos-exercise-num">#{item.number}</span>
                            <Tag
                              color={isCorrect ? 'green' : isAbsent ? 'default' : 'red'}
                              style={{ margin: 0, fontSize: 11 }}
                            >
                              {isCorrect ? 'Acierto' : isAbsent ? 'Ausente' : 'Fallo'}
                            </Tag>
                          </div>
                          <div className="dominos-exercise-body">
                            <span className="dominos-exercise-val">
                              {item.given ? item.given : '—'}
                            </span>
                            {staffView && item.correct ? (
                              <span className="dominos-exercise-key">
                                (Clave: {item.correct})
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cuestionario 16 FP (Formas A y B) - Perfil Psicométrico
// ---------------------------------------------------------------------------

const CLASSIFICATION_COLORS: Record<string, string> = {
  Bajo: 'blue',
  'Medio-Bajo': 'cyan',
  Promedio: 'green',
  'Medio-Alto': 'orange',
  Alto: 'purple',
};

export const FACTOR_CHART_ITEMS: { key: string; label: string }[] = [
  { key: 'A', label: 'Sociabilidad' },
  { key: 'B', label: 'Capacidad escolar' },
  { key: 'C', label: 'Estabilidad emocional' },
  { key: 'E', label: 'Sumisión' },
  { key: 'F', label: 'Retraimiento' },
  { key: 'G', label: 'Superego' },
  { key: 'H', label: 'Timidez' },
  { key: 'I', label: 'Severidad' },
  { key: 'L', label: 'Confianza' },
  { key: 'M', label: 'Objetividad' },
  { key: 'N', label: 'Ingenuidad' },
  { key: 'O', label: 'Seguridad de sí mismo' },
  { key: 'Q1', label: 'Conservadurismo' },
  { key: 'Q2', label: 'Dependencia Grupal' },
  { key: 'Q3', label: 'Indiferencia' },
  { key: 'Q4', label: 'Tranquilidad' },
];

export function Fp16PersonalityProfileChart({
  factors,
}: {
  factors: Record<string, Fp16FactorResult>;
}) {
  const plotLeft = 80;
  const plotTop = 55;
  const plotWidth = 820;
  const plotHeight = 250;
  const plotBottom = plotTop + plotHeight; // 305
  const stepY = plotHeight / 10; // 25px por nivel de puntaje (0 a 10)

  const points = FACTOR_CHART_ITEMS.map((item, i) => {
    const factorData = factors[item.key];
    const sten = factorData ? factorData.sten : 5;
    const x = 100 + i * 52;
    const y = plotBottom - sten * stepY;
    return {
      key: item.key,
      label: item.label,
      sten,
      x,
      y,
      classification: factorData?.classification ?? 'Promedio',
    };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="fp16-chart-container" style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox="0 0 940 500"
        className="fp16-personality-chart-svg"
        style={{ width: '100%', minWidth: 680, height: 'auto', display: 'block' }}
      >
        {/* TÍTULO DEL GRÁFICO */}
        <text
          x={plotLeft + plotWidth / 2}
          y="34"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="#002060"
          letterSpacing="1"
        >
          PERFIL DE PERSONALIDAD
        </text>

        {/* ETIQUETA EJE VERTICAL (ROTADA A 90 GRADOS) */}
        <text
          x={-180}
          y="28"
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#002060"
          letterSpacing="2"
        >
          PUNTAJE
        </text>

        {/* FONDO GRIS DEL ÁREA DE GRÁFICO */}
        <rect
          x={plotLeft}
          y={plotTop}
          width={plotWidth}
          height={plotHeight}
          fill="#b8c0cc"
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* LÍNEAS HORIZONTALES Y NÚMEROS DEL EJE Y (0 AL 10) */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
          const y = plotBottom - score * stepY;
          return (
            <g key={score}>
              <line
                x1={plotLeft}
                y1={y}
                x2={plotLeft + plotWidth}
                y2={y}
                stroke="#556980"
                strokeWidth={score === 0 || score === 10 ? '1.5' : '1'}
              />
              <text
                x={plotLeft - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="13"
                fontWeight="bold"
                fill="#000000"
              >
                {score}
              </text>
            </g>
          );
        })}

        {/* POLILÍNEA DEL PERFIL REAL (TRAZO AZUL REY CONTINUO) */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#002080"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* PUNTOS CIRCULARES EN CADA COORDENADA */}
        {points.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#002080"
            stroke="#ffffff"
            strokeWidth="1.5"
          >
            <title>{`${p.label} (Factor ${p.key}): Estén ${p.sten} (${p.classification})`}</title>
          </circle>
        ))}

        {/* MARCAS VERTICALES EN EL BORDE INFERIOR */}
        {points.map((p) => (
          <line
            key={'tick-' + p.key}
            x1={p.x}
            y1={plotBottom}
            x2={p.x}
            y2={plotBottom + 6}
            stroke="#000000"
            strokeWidth="1.5"
          />
        ))}

        {/* ETIQUETAS DE FACTORES DIAGONALES A 45 GRADOS */}
        {points.map((p) => (
          <text
            key={'lbl-' + p.key}
            x={p.x}
            y={plotBottom + 16}
            transform={`rotate(45, ${p.x}, ${plotBottom + 16})`}
            textAnchor="start"
            fontSize="12"
            fontWeight="600"
            fill="#0f172a"
          >
            {p.label}
          </text>
        ))}

        {/* TÍTULO EJE HORIZONTAL */}
        <text
          x={plotLeft + plotWidth / 2}
          y="476"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#002060"
          letterSpacing="2"
        >
          FACTORES
        </text>

        {/* CUADRO DE LEYENDA (PERFIL REAL) */}
        <g transform="translate(740, 425)">
          <rect
            x="0"
            y="0"
            width="160"
            height="46"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="1"
          />
          <line x1="16" y1="23" x2="52" y2="23" stroke="#002080" strokeWidth="3" />
          <text x="62" y="27" fontSize="12" fontWeight="bold" fill="#002060">
            PERFIL REAL
          </text>
        </g>
      </svg>
    </div>
  );
}

export function Fp16ResultsView({
  assignment,
  result,
  staffView = false,
}: {
  assignment: EvaluationAssignment;
  result?: RawResult | null;
  staffView?: boolean;
}) {
  const fp: Fp16Result | null =
    result && 'model' in result && result.model === '16fp'
      ? (result as Fp16Result)
      : null;

  if (!fp) return null;

  const factorKeys = [
    'A',
    'B',
    'C',
    'E',
    'F',
    'G',
    'H',
    'I',
    'L',
    'M',
    'N',
    'O',
    'Q1',
    'Q2',
    'Q3',
    'Q4',
  ];

  const factorsList = factorKeys
    .map((k) => fp.factors[k])
    .filter(Boolean) as Fp16FactorResult[];

  const val = fp.validity;
  const isHighIndecision = val.indecision_percentage > 25;

  // Global functional areas synthesis based on specification
  const areaSocial = ['A', 'F', 'H', 'Q2'].map((k) => fp.factors[k]).filter(Boolean);
  const areaEmocional = ['C', 'O', 'Q4', 'L'].map((k) => fp.factors[k]).filter(Boolean);
  const areaTrabajo = ['G', 'Q3', 'E', 'Q1'].map((k) => fp.factors[k]).filter(Boolean);
  const areaCognitiva = ['B', 'I', 'M', 'N'].map((k) => fp.factors[k]).filter(Boolean);

  const getAreaAvgSten = (factors: Fp16FactorResult[]) =>
    factors.length > 0
      ? (factors.reduce((sum, f) => sum + f.sten, 0) / factors.length).toFixed(1)
      : '5.5';

  return (
    <div className="fp16-results-wrapper">
      <Alert
        type="success"
        showIcon
        message={`Cuestionario 16 Factores de la Personalidad (${fp.form}) Completado`}
        description="Se han calculado los 16 factores primarios y su conversión a Estenes con el Baremo Adultos Unificados (Cuadro 7.c)."
      />

      {/* Indicadores de Validez */}
      <div className="fp16-validity-card">
        <Typography.Title level={4} style={{ margin: '0 0 12px' }}>
          Indicadores de Validez y Estilo de Respuesta
        </Typography.Title>
        <Flex wrap gap={16} align="center" style={{ marginBottom: 12 }}>
          <div className="fp16-validity-stat">
            <span className="fp16-validity-label">Índice de Indecisión (Opción B):</span>
            <span className="fp16-validity-val">
              {val.indecision_count} / 184 reactivos ({val.indecision_percentage}%)
            </span>
          </div>
          <div className="fp16-validity-stat">
            <span className="fp16-validity-label">Omisiones / Ausentes:</span>
            <span className="fp16-validity-val">{val.omissions_count} reactivos</span>
          </div>
          <div className="fp16-validity-stat">
            <span className="fp16-validity-label">Reactivos de Control (1, 2, 187):</span>
            <span className="fp16-validity-val">
              1: {val.control_items[1] ?? '—'} · 2: {val.control_items[2] ?? '—'} · 187:{' '}
              {val.control_items[187] ?? '—'}
            </span>
          </div>
        </Flex>

        {isHighIndecision ? (
          <Alert
            type="warning"
            showIcon
            message="Atención: Alto índice de respuestas intermedias/duda"
            description={`El evaluado respondió con la opción intermedia ('b') en el ${val.indecision_percentage}% de los reactivos (umbral de referencia: 25%). Esto sugiere cautela o tendencia a evitar el compromiso con posturas definidas, lo que podría atenuar los polos extremos del perfil.`}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="Validez psicométrica conforme"
            description={`El estilo de respuesta presenta un nivel de indecisión del ${val.indecision_percentage}% (dentro del rango normal <= 25%), lo que valida la diferenciación de los 16 factores evaluados.`}
          />
        )}
      </div>

      {/* Hoja de Perfil Psicométrico */}
      <div className="fp16-profile-card">
        <Typography.Title level={4} style={{ textAlign: 'center', margin: '0 0 4px' }}>
          {assignment.instrument.name} — Hoja de Perfil Psicométrico
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
          La zona central (Estenes 5 y 6) representa el rango promedio poblacional. Los estenes 1–3
          identifican el polo bajo y los estenes 8–10 el polo alto.{' '}
          {staffView ? <Tag color="gold">Vista de Evaluador / Auditoría</Tag> : null}
        </Typography.Paragraph>

        {/* Header de la escala */}
        <div className="fp16-scale-header">
          <div className="fp16-col-pole-left">Polo Bajo (Estenes 1–3)</div>
          <div className="fp16-col-factor">Factor</div>
          <div className="fp16-col-scale">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <span
                key={num}
                className={
                  'fp16-scale-num ' + (num === 5 || num === 6 ? 'fp16-scale-num--avg' : '')
                }
              >
                {num}
              </span>
            ))}
          </div>
          <div className="fp16-col-pole-right">Polo Alto (Estenes 8–10)</div>
          <div className="fp16-col-badge">Estén</div>
        </div>

        {/* Filas de los 16 Factores */}
        <div className="fp16-factors-list">
          {factorsList.map((f) => (
            <div key={f.factor} className="fp16-factor-row">
              <div className="fp16-col-pole-left" title={f.low_pole}>
                {f.low_pole}
              </div>
              <div className="fp16-col-factor">
                <span className="fp16-factor-code">{f.factor}</span>
                <span className="fp16-factor-name">{f.name}</span>
              </div>
              <div className="fp16-col-scale">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isCandidateSten = f.sten === num;
                  const isAvgZone = num === 5 || num === 6;
                  return (
                    <div
                      key={num}
                      className={
                        'fp16-sten-cell ' +
                        (isAvgZone ? 'fp16-sten-cell--avg ' : '') +
                        (isCandidateSten ? 'fp16-sten-cell--active' : '')
                      }
                    >
                      {isCandidateSten ? (
                        <span
                          className="fp16-sten-dot"
                          title={`Estén ${num} - ${f.classification}`}
                        >
                          {num}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="fp16-col-pole-right" title={f.high_pole}>
                {f.high_pole}
              </div>
              <div className="fp16-col-badge">
                <Tag color={CLASSIFICATION_COLORS[f.classification] ?? 'default'}>
                  {f.sten} ({f.classification})
                </Tag>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Perfil de Personalidad (Polilínea continua de 16 factores s/ modelo de baremación psicométrica) */}
      <div className="fp16-personality-chart-card">
        <Fp16PersonalityProfileChart factors={fp.factors} />
      </div>

      {/* Secciones expandibles de consulta detallada */}
      <Collapse
        style={{ marginTop: 20 }}
        items={[
          {
            key: 'areas',
            label: 'Ver síntesis descriptiva por áreas ocupacionales (Social, Emocional, Normas y Cognitiva)',
            children: (
              <div className="fp16-areas-grid">
                <div className="fp16-area-box">
                  <div className="fp16-area-header">
                    <Typography.Title level={5} style={{ margin: 0, color: '#1e3a8a' }}>
                      🤝 Área Social y Extraversión
                    </Typography.Title>
                    <Tag color="blue">Estén Promedio: {getAreaAvgSten(areaSocial)}</Tag>
                  </div>
                  <p className="fp16-area-desc">
                    Factores <strong>A</strong> (Afabilidad), <strong>F</strong> (Animación),{' '}
                    <strong>H</strong> (Atrevimiento) y <strong>Q2</strong> (Autosuficiencia). Evalúa la
                    facilidad para entablar relaciones interpersonales, comunicación abierta y trabajo en equipo.
                  </p>
                </div>

                <div className="fp16-area-box">
                  <div className="fp16-area-header">
                    <Typography.Title level={5} style={{ margin: 0, color: '#065f46' }}>
                      🛡️ Área Emocional y Estabilidad
                    </Typography.Title>
                    <Tag color="green">Estén Promedio: {getAreaAvgSten(areaEmocional)}</Tag>
                  </div>
                  <p className="fp16-area-desc">
                    Factores <strong>C</strong> (Estabilidad), <strong>O</strong> (Aprensión),{' '}
                    <strong>Q4</strong> (Tensión) y <strong>L</strong> (Vigilancia). Mide la tolerancia
                    a la presión laboral, manejo de frustraciones y serenidad ante imprevistos.
                  </p>
                </div>

                <div className="fp16-area-box">
                  <div className="fp16-area-header">
                    <Typography.Title level={5} style={{ margin: 0, color: '#92400e' }}>
                      ⚙️ Estilo de Trabajo y Normas
                    </Typography.Title>
                    <Tag color="orange">Estén Promedio: {getAreaAvgSten(areaTrabajo)}</Tag>
                  </div>
                  <p className="fp16-area-desc">
                    Factores <strong>G</strong> (Atención a normas), <strong>Q3</strong> (Perfeccionismo),{' '}
                    <strong>E</strong> (Dominancia) y <strong>Q1</strong> (Apertura al cambio). Refleja
                    disciplina, apego a procedimientos, orden y liderazgo.
                  </p>
                </div>

                <div className="fp16-area-box">
                  <div className="fp16-area-header">
                    <Typography.Title level={5} style={{ margin: 0, color: '#5b21b6' }}>
                      🧠 Área Cognitiva y Toma de Decisiones
                    </Typography.Title>
                    <Tag color="purple">Estén Promedio: {getAreaAvgSten(areaCognitiva)}</Tag>
                  </div>
                  <p className="fp16-area-desc">
                    Factores <strong>B</strong> (Razonamiento), <strong>I</strong> (Sensibilidad),{' '}
                    <strong>M</strong> (Abstracción) y <strong>N</strong> (Privacidad). Determina el
                    estilo de pensamiento (analítico vs. intuitivo) y enfoque de resolución de problemas.
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'table',
            label: 'Ver tabla tabular completa de puntuaciones brutas (PD) y estenes',
            children: (
              <Table
                dataSource={factorsList.map((f) => ({ ...f, key: f.factor }))}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Factor',
                    dataIndex: 'factor',
                    key: 'factor',
                    width: 70,
                    render: (val: string) => <strong>{val}</strong>,
                  },
                  {
                    title: 'Denominación',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Puntuación Bruta (PD)',
                    key: 'raw_score',
                    render: (_: unknown, record: Fp16FactorResult) => (
                      <span>
                        {record.raw_score} / {record.max_score}
                      </span>
                    ),
                  },
                  {
                    title: 'Estén (1–10)',
                    dataIndex: 'sten',
                    key: 'sten',
                    render: (val: number) => <strong>{val}</strong>,
                  },
                  {
                    title: 'Clasificación',
                    dataIndex: 'classification',
                    key: 'classification',
                    render: (val: string) => (
                      <Tag color={CLASSIFICATION_COLORS[val] ?? 'default'}>{val}</Tag>
                    ),
                  },
                  {
                    title: 'Polo Bajo (1–3)',
                    dataIndex: 'low_pole',
                    key: 'low_pole',
                  },
                  {
                    title: 'Polo Alto (8–10)',
                    dataIndex: 'high_pole',
                    key: 'high_pole',
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test de Habilidades Blandas (28 reactivos) - Psicograma Vertical Continuo
// ---------------------------------------------------------------------------

export function SoftSkillsResultsView({
  assignment,
  result,
  staffView = false,
}: {
  assignment: EvaluationAssignment;
  result?: RawResult | null;
  staffView?: boolean;
}) {
  const ss: SoftSkillsResult | null =
    result && 'model' in result && result.model === 'habilidades_blandas'
      ? (result as SoftSkillsResult)
      : null;

  // Items from result or parsed from assignment
  const items: SoftSkillsItemResult[] =
    ss?.items ??
    assignment.exercises
      .map((ex) => {
        const rawAns = assignment.answers[ex.id];
        let score: number | null = null;
        if (typeof rawAns === 'number' && rawAns >= 1 && rawAns <= 5) {
          score = rawAns;
        } else if (typeof rawAns === 'string') {
          const parsed = parseInt(rawAns, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
            score = parsed;
          } else {
            const letterMap: Record<string, number> = {
              a: 1,
              b: 2,
              c: 3,
              d: 4,
              e: 5,
            };
            score = letterMap[rawAns.toLowerCase()] ?? null;
          }
        }
        return {
          number: ex.number,
          source_id: ex.id,
          text: ex.text ?? `Reactivo #${ex.number}`,
          dimension: 'General',
          score,
        };
      })
      .sort((a, b) => a.number - b.number);

  const rowHeight = 56;
  const totalHeight = items.length * rowHeight;
  const svgWidth = 240;

  // Scale positions for 1, 2, 3, 4, 5 across svgWidth (240px):
  // 1 => 24, 2 => 72, 3 => 120, 4 => 168, 5 => 216
  const getX = (val: number | null): number => {
    if (val === null || val < 1 || val > 5) return 120;
    return 24 + (val - 1) * 48;
  };

  // Build SVG points:
  const validPoints: { x: number; y: number }[] = [];
  items.forEach((item, idx) => {
    if (item.score !== null) {
      validPoints.push({
        x: getX(item.score),
        y: idx * rowHeight + rowHeight / 2,
      });
    }
  });

  const polylinePoints = validPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const globalAvg =
    ss?.global_average ??
    (validPoints.length > 0
      ? (
          items.reduce((sum, it) => sum + (it.score ?? 0), 0) /
          validPoints.length
        ).toFixed(2)
      : '0.00');

  const globalPct =
    ss?.global_percentage ??
    (items.length > 0
      ? Math.round(
          (items.reduce((sum, it) => sum + (it.score ?? 0), 0) /
            (items.length * 5)) *
            100
        )
      : 0);

  return (
    <div className="soft-skills-results-wrapper">
      <Alert
        type="success"
        showIcon
        message="Formulario de Evaluación de Habilidades Blandas Completado"
        description={`Evaluación psicométrica conductual completada con ${validPoints.length} de ${items.length} reactivos respondidos.`}
      />

      <div className="soft-skills-card">
        <Typography.Title
          level={4}
          style={{ textAlign: 'center', margin: '0 0 4px' }}
        >
          {assignment.instrument.name}
        </Typography.Title>
        <Typography.Paragraph
          type="secondary"
          style={{ textAlign: 'center', marginBottom: 20 }}
        >
          Puntaje promedio global: <strong>{globalAvg} / 5.0</strong> ({globalPct}
          % de efectividad conductual autodeclarada).{' '}
          {staffView ? <Tag color="gold">Vista de Evaluador</Tag> : null}
        </Typography.Paragraph>

        {/* Psicograma Tabular con Línea Continua SVG */}
        <div className="soft-skills-table-container">
          <table className="soft-skills-table">
            <thead>
              <tr>
                <th className="soft-skills-th-text">
                  Mi Comportamiento Real y Capacidad Actual
                </th>
                <th className="soft-skills-th-scale">Escala de Calificación</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.source_id} style={{ height: `${rowHeight}px` }}>
                  <td className="soft-skills-td-text">
                    <span className="soft-skills-item-num">
                      {item.number}.
                    </span>{' '}
                    {item.text}
                  </td>
                  <td className="soft-skills-td-scale">
                    <div className="soft-skills-scale-row">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <span
                          key={num}
                          className={
                            'soft-skills-scale-num ' +
                            (item.score === num
                              ? 'soft-skills-scale-num--selected'
                              : '')
                          }
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SVG Overlay layer matching the scale column precisely */}
          <div
            className="soft-skills-svg-overlay"
            style={{ height: `${totalHeight}px`, top: '44px' }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${svgWidth} ${totalHeight}`}
              preserveAspectRatio="none"
            >
              {/* Vertical Guide Lines */}
              {[1, 2, 3, 4, 5].map((num) => (
                <line
                  key={num}
                  x1={getX(num)}
                  y1={0}
                  x2={getX(num)}
                  y2={totalHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Continuous response line */}
              {polylinePoints ? (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#4338ca"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Nodes at each answer vertex */}
              {validPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#4338ca"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
