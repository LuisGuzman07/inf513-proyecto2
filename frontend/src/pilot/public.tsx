import {
  Alert,
  Button,
  Col,
  Collapse,
  Flex,
  Form,
  Input,
  Row,
  Typography,
} from 'antd';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { errorText, fieldErrors } from './api';
import { usePilotSession } from './context';
import { SessionStatus } from './layout';
import { academicTitle } from './workflow';
import { useSessionHome } from './services-access';
import type { RegisterInput } from './types';
import { AccessFrame } from './access';
import { institutionalAssets } from './identity';
import './figma-public.css';

export function PublicHome() {
  const { user } = usePilotSession();
  const entry = useSessionHome(user);
  return (
    <Container className="pilot-figma-public">
      <div className="pilot-figma-public-hero">
        <img
          {...institutionalAssets.building}
          className="pilot-figma-public-photo"
        />
        <div className="pilot-figma-public-copy">
          <Typography.Title level={1}>{academicTitle}</Typography.Title>
          <Typography.Paragraph>
            Registrá tu inscripción, completá tus datos y adjuntá tus documentos
            en un expediente privado. Guardá un borrador y continuá antes de
            enviarlo a revisión.
          </Typography.Paragraph>
          <Flex gap={12} wrap className="pilot-figma-public-actions">
            {user ? (
              entry.pending ? (
                <Button type="primary" size="large" loading disabled>
                  Continuar mi trámite
                </Button>
              ) : entry.failed ? (
                <Alert
                  type="error"
                  showIcon
                  title="No se pudo verificar el acceso de tu cuenta."
                  action={<Button onClick={entry.retry}>Reintentar</Button>}
                />
              ) : (
                <Link to={entry.home ?? '/'}>
                  <Button type="primary" size="large">
                    Continuar mi trámite
                  </Button>
                </Link>
              )
            ) : (
              <>
                <Link to="/ingresar">
                  <Button type="primary" size="large">
                    Ingresar
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button size="large" ghost>
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </Flex>
        </div>
      </div>
      <Row gutter={[18, 18]} className="pilot-figma-public-paths">
        <Col xs={24} md={12}>
          <Card className="pilot-figma-public-path">
            <span className="pilot-figma-public-letter" aria-hidden="true">
              A
            </span>
            <div>
              <Typography.Title level={2}>
                Talento universitario UAGRM
              </Typography.Title>
              <span className="pilot-figma-public-status">
                Disponible ahora
              </span>
              <Typography.Paragraph>
                Datos y documentos guardados como borrador. Enviá tu inscripción
                a revisión, consultá su estado y corregí las observaciones del
                personal desde tu portal.
              </Typography.Paragraph>
              <Typography.Paragraph>
                El envío no constituye admisión ni publicación.
              </Typography.Paragraph>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="pilot-figma-public-path">
            <span className="pilot-figma-public-letter" aria-hidden="true">
              B
            </span>
            <div>
              <Typography.Title level={2}>
                Servicios para empresas
              </Typography.Title>
              <span className="pilot-figma-public-status">
                Soluciones corporativas de talento humano
              </span>
              <Typography.Paragraph>
                Brindamos consultoría especializada a organizaciones:
                <strong> Descripción de Funciones</strong>,
                <strong> Diagnóstico de Clima Laboral</strong> y
                <strong> Evaluación del Desempeño</strong>, además de acceso directo a nuestro Banco de Candidatos evaluados.
              </Typography.Paragraph>
              <Flex gap={12} wrap>
                <Link to="/servicios-empresariales">
                  <Button type="primary">Ver servicios empresariales</Button>
                </Link>
                <Link to="/servicios/solicitud">
                  <Button>Solicitar servicio</Button>
                </Link>
              </Flex>
            </div>
          </Card>
        </Col>
      </Row>
      <Card className="pilot-figma-public-privacy">
        <div>
          <Typography.Title level={2}>
            Privacidad y revisión humana
          </Typography.Title>
          <Typography.Paragraph>
            Los documentos, contactos y resultados internos no se publican. El
            personal revisa la información enviada. Las condiciones
            institucionales de consentimiento y conservación siguen pendientes
            de definición.
          </Typography.Paragraph>
        </div>
        <img {...institutionalAssets.career} />
      </Card>
    </Container>
  );
}
export function RegisterPage() {
  const { session, user, status } = usePilotSession();
  const [form] = Form.useForm<RegisterInput>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const entry = useSessionHome(user);
  if (status === 'authenticated' && user) {
    if (entry.pending) return <SessionStatus />;
    if (entry.failed)
      return (
        <AccessFrame
          title="Crear mi cuenta"
          description="No se pudo verificar el acceso de tu cuenta a los servicios."
        >
          <Alert
            type="error"
            showIcon
            title="No se pudo verificar el acceso."
            action={<Button onClick={entry.retry}>Reintentar</Button>}
          />
        </AccessFrame>
      );
    if (entry.home) return <Navigate to={entry.home} replace />;
  }
  if (status !== 'anonymous') return <SessionStatus />;
  async function submit(values: RegisterInput) {
    setPending(true);
    setFailure(null);
    try {
      await session.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
    } catch (error) {
      setFailure(error);
      const errors = fieldErrors(error);
      form.setFields(
        (['name', 'email', 'password', 'password_confirmation'] as const).map(
          (name) => ({ name, errors: errors[name] ?? [] })
        )
      );
    } finally {
      form.resetFields(['password', 'password_confirmation']);
      setPending(false);
    }
  }
  return (
    <AccessFrame
      title="Crear mi cuenta"
      description="Registrate para completar y gestionar tu inscripción como titulado."
    >
      {failure ? (
        <Alert type="error" showIcon title={errorText(failure)} />
      ) : null}
      <Form form={form} layout="vertical" onFinish={submit} disabled={pending}>
        <Form.Item
          name="name"
          label="Nombre de la cuenta"
          rules={[
            { required: true, whitespace: true, message: 'Ingresá tu nombre.' },
          ]}
        >
          <Input maxLength={200} autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Correo de la cuenta"
          rules={[
            {
              required: true,
              type: 'email',
              message: 'Ingresá un correo válido.',
            },
          ]}
        >
          <Input maxLength={254} autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Contraseña"
          rules={[{ required: true, message: 'Ingresá una contraseña.' }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="password_confirmation"
          label="Confirmar contraseña"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirmá tu contraseña.' },
            ({ getFieldValue }) => ({
              validator: (_, value: string) =>
                value === getFieldValue('password')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Las contraseñas no coinciden.')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button htmlType="submit" type="primary" loading={pending} block>
          Crear cuenta
        </Button>
      </Form>
      <Collapse
        size="small"
        items={[
          {
            key: 'account',
            label: 'Sobre esta cuenta',
            children: (
              <Typography.Paragraph>
                La cuenta permite gestionar tu inscripción; no verifica tu
                identidad ni titulación. Las condiciones de conservación y uso
                real están pendientes de definición.
              </Typography.Paragraph>
            ),
          },
        ]}
      />
      <Link to="/ingresar">Ya tengo una cuenta</Link>
    </AccessFrame>
  );
}
