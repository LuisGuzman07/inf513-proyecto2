import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AccessFrame } from './access';
import { errorText } from './api';
import { usePilotSession } from './context';
import { SessionStatus } from './layout';
import { useSessionHome } from './services-access';

export function PilotLogin() {
  const { session, status, user } = usePilotSession();
  const [form] = Form.useForm<{ email: string; password: string }>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const entry = useSessionHome(user);
  if (status === 'authenticated' && user?.pilot_enabled) {
    if (entry.pending) return <SessionStatus />;
    if (entry.failed)
      return (
        <AccessFrame
          title="Ingresar"
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
  async function submit(values: { email: string; password: string }) {
    setPending(true);
    setError('');
    try {
      await session.login(values.email.trim(), values.password);
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      form.resetFields(['password']);
      setPending(false);
    }
  }
  return (
    <AccessFrame
      title="Ingresar"
      description="Accedé a tu cuenta para continuar tu inscripción o revisar los expedientes disponibles."
    >
      {error ? <Alert type="error" showIcon title={error} /> : null}
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        disabled={pending}
        requiredMark="optional"
      >
        <Form.Item
          name="email"
          label="Correo de la cuenta"
          rules={[
            {
              required: true,
              type: 'email',
              message: 'Ingresá el correo de tu cuenta.',
            },
          ]}
        >
          <Input autoComplete="username" maxLength={254} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Contraseña"
          rules={[{ required: true, message: 'Ingresá tu contraseña.' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={pending} block>
          Ingresar
        </Button>
      </Form>
      <Link to="/registro">Crear mi cuenta</Link>
    </AccessFrame>
  );
}
