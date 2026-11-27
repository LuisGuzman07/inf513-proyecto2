import { Button, Card, Col, Divider, Row, Space, Tag, Typography } from 'antd';
import {
  RiseOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ApartmentOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Container } from '../components/shared/container/container';

export function CorporateServicesPage() {
  return (
    <Container style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* HERO BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0369a1 100%)',
          borderRadius: 16,
          padding: '44px 36px',
          color: '#ffffff',
          marginBottom: 36,
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.25)',
        }}
      >
        <Space direction="vertical" size="middle" style={{ maxWidth: 840 }}>
          <Tag color="cyan" style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', border: 0 }}>
            UAGRM · Consultoría y Servicios Empresariales
          </Tag>
          <Typography.Title
            level={1}
            style={{ color: '#ffffff', margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            Soluciones Especializadas en Gestión del Talento Humano y Productividad
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#e0f2fe', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            Además de nuestro Banco de Talento Universitario, brindamos asesoría técnica y consultoría organizacional
            a medida para empresas e instituciones que buscan estructurar sus áreas, diagnosticar su clima interno
            y maximizar el rendimiento de sus equipos de trabajo.
          </Typography.Paragraph>
          <Space size="middle" wrap style={{ paddingTop: 8 }}>
            <Link to="/servicios/solicitud">
              <Button
                type="primary"
                size="large"
                style={{
                  background: '#f59e0b',
                  borderColor: '#f59e0b',
                  color: '#1e293b',
                  fontWeight: 700,
                  height: 46,
                  padding: '0 28px',
                }}
                icon={<ArrowRightOutlined />}
              >
                Solicitar Asesoría Empresarial
              </Button>
            </Link>
            <Link to="/banco-candidatos">
              <Button
                ghost
                size="large"
                style={{ height: 46, padding: '0 24px', fontWeight: 600 }}
              >
                Explorar Banco de Talentos
              </Button>
            </Link>
          </Space>
        </Space>
      </div>

      {/* SECTION TITLE */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          Portafolio de Servicios para Empresas
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 15, marginTop: 6, maxWidth: 680, marginInline: 'auto' }}>
          Metodologías profesionales y herramientas métricas aplicadas por docentes y especialistas universitarios.
        </Typography.Paragraph>
      </div>

      {/* 3 CORE SERVICES HIGHLIGHTED */}
      <Row gutter={[24, 24]}>
        {/* SERVICIO 1: DESCRIPCIÓN DE FUNCIONES */}
        <Col xs={24} lg={8}>
          <Card
            hoverable
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                marginBottom: 20,
              }}
            >
              <ApartmentOutlined />
            </div>
            <Typography.Title level={4} style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
              Descripción y Análisis de Funciones
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>
              Estructuramos de forma clara y formal las responsabilidades de cada puesto dentro de su organización,
              evitando duplicidades de tareas y alineando las funciones individuales con los objetivos estratégicos.
            </Typography.Paragraph>
            <Divider style={{ margin: '14px 0' }} />
            <Typography.Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 10 }}>
              Alcance y Entregables:
            </Typography.Text>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
              <li>Levantamiento y actualización de Manuales de Organización y Funciones (MOF).</li>
              <li>Perfiles de puesto por competencias laborales y requisitos del cargo.</li>
              <li>Jerarquización, líneas de supervisión y matrices de responsabilidades (RACI).</li>
              <li>Base técnica para planes salariales y reclutamiento eficiente.</li>
            </ul>
          </Card>
        </Col>

        {/* SERVICIO 2: CLIMA LABORAL */}
        <Col xs={24} lg={8}>
          <Card
            hoverable
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                marginBottom: 20,
              }}
            >
              <SmileOutlined />
            </div>
            <Typography.Title level={4} style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
              Diagnóstico de Clima y Cultura Laboral
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>
              Identificamos la percepción real de sus colaboradores respecto a su entorno de trabajo, liderazgo,
              comunicación y motivación, permitiendo reducir la rotación y construir un clima de alta confianza.
            </Typography.Paragraph>
            <Divider style={{ margin: '14px 0' }} />
            <Typography.Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 10 }}>
              Alcance y Entregables:
            </Typography.Text>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
              <li>Aplicación de instrumentos estandarizados y anónimos de clima laboral.</li>
              <li>Evaluación de liderazgo, reconocimiento, canales de comunicación y bienestar.</li>
              <li>Identificación de factores psicosociales y focos de estrés organizacional.</li>
              <li>Informe ejecutivo con indicadores semaforizados y plan de intervención.</li>
            </ul>
          </Card>
        </Col>

        {/* SERVICIO 3: EVALUACIÓN DEL DESEMPEÑO */}
        <Col xs={24} lg={8}>
          <Card
            hoverable
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: '#faf5ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                marginBottom: 20,
              }}
            >
              <RiseOutlined />
            </div>
            <Typography.Title level={4} style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
              Evaluación del Desempeño y Potencial
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>
              Diseñamos e implementamos sistemas métricos objetivos para medir el cumplimiento de metas,
              el aporte individual y las competencias laborales, sentando las bases para planes de carrera y bonos.
            </Typography.Paragraph>
            <Divider style={{ margin: '14px 0' }} />
            <Typography.Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 10 }}>
              Alcance y Entregables:
            </Typography.Text>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
              <li>Modelos de evaluación 90°, 180° y 360° adaptados a la dinámica de su sector.</li>
              <li>Alineación de objetivos de desempeño (KPIs) con competencias conductuales.</li>
              <li>Matriz de Talento y Potencial (Nine-Box) para cuadros de sucesión.</li>
              <li>Guía para entrevistas de retroalimentación constructiva y planes de desarrollo.</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* VALUE PROPOSITION BOX */}
      <div
        style={{
          marginTop: 48,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '32px 28px',
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Typography.Title level={4} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
              ¿Por qué confiar en la Dirección de Selección y Gestión de Talento UAGRM?
            </Typography.Title>
            <Typography.Paragraph style={{ margin: '0 0 16px 0', color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
              Contamos con el respaldo académico y metodológico de la Universidad Autónoma Gabriel René Moreno.
              Nuestros procesos garantizan absoluta confidencialidad, rigor técnico y costos accesibles
              orientados al fortalecimiento del sector productivo y empresarial de la región.
            </Typography.Paragraph>
            <Space wrap size={[20, 8]}>
              <span style={{ fontSize: 13, color: '#0f766e', fontWeight: 600 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} /> Rigor metodológico y científico
              </span>
              <span style={{ fontSize: 13, color: '#0f766e', fontWeight: 600 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} /> Confidencialidad total de datos
              </span>
              <span style={{ fontSize: 13, color: '#0f766e', fontWeight: 600 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} /> Acompañamiento personalizado
              </span>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Link to="/servicios/solicitud">
              <Button type="primary" size="large" style={{ fontWeight: 700, height: 44, padding: '0 24px' }}>
                Solicitar una Propuesta
              </Button>
            </Link>
            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
              Respuesta en menos de 48 horas hábiles
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
