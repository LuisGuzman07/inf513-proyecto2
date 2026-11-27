import {
  CalendarOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Alert,
  App,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { pilotClient } from './api';
import { useAppearance } from './appearance';

type ActiveCompany = {
  id: string;
  name: string;
};

type DonationRecord = {
  id: string;
  company_id: string;
  company_name: string | null;
  user_id: number;
  user_name: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'refunded';
  description: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  confirmed_at: string | null;
  created_at: string | null;
};

type PaymentMethodRecord = {
  id: string;
  label: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  company_id: string | null;
};

type PaymentPlanRecord = {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  frequency: string;
  installments: number;
  completed_installments: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  next_due_date: string | null;
  company?: { id: string; name: string } | null;
};

const STATUS_META: Record<
  DonationRecord['status'],
  { label: string; color: string }
> = {
  pending: { label: 'Pendiente', color: 'gold' },
  confirmed: { label: 'Confirmado', color: 'green' },
  rejected: { label: 'Rechazado', color: 'red' },
  cancelled: { label: 'Cancelado', color: 'default' },
  refunded: { label: 'Reembolsado', color: 'purple' },
};

function CardPaymentForm({
  donation,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  donation: DonationRecord;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { message } = App.useApp();
  const { preferences } = useAppearance();
  const [paying, setPaying] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const isDark = preferences.color_mode === 'dark';

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setPaying(true);
    setCardError(null);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        setCardError(
          result.error.message ?? 'No se pudo procesar la tarjeta.'
        );
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await pilotClient.post(`/api/empresa/donativos/${donation.id}/confirmar`);
        void message.success(
          `Donativo de BOB ${donation.amount.toFixed(2)} confirmado.`
        );
        onSuccess();
      } else {
        setCardError('El pago quedó en espera de confirmación.');
      }
    } catch {
      setCardError('Ocurrió un error al confirmar el pago con el servidor.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 520 }}>
      <Alert
        type="info"
        showIcon
        title={`Completa el pago de BOB ${donation.amount.toFixed(2)}`}
        description={`Empresa: ${donation.company_name ?? '—'} · Moneda fijada automáticamente en BOB.`}
      />

      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          Datos de tarjeta (Número, Fecha MM/AA y CVC)
        </Typography.Text>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            border: isDark ? '1px solid #475569' : '1px solid #d9d9d9',
            background: isDark ? '#0f172a' : '#ffffff',
          }}
        >
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: isDark ? '#f8fafc' : '#1f2937',
                  '::placeholder': {
                    color: isDark ? '#94a3b8' : '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {cardError ? <Alert type="error" showIcon title={cardError} /> : null}

      <Space>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={paying}
          disabled={!stripe}
          onClick={() => void handleConfirm()}
        >
          Pagar BOB {donation.amount.toFixed(2)}
        </Button>
        <Button disabled={paying} onClick={onCancel}>
          Cambiar monto
        </Button>
      </Space>
    </Space>
  );
}

export function CompanyDonationsPage() {
  const { message } = App.useApp();
  const [companies, setCompanies] = useState<ActiveCompany[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
  const [plans, setPlans] = useState<PaymentPlanRecord[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    donation: DonationRecord;
    clientSecret: string;
  } | null>(null);
  const [form] = Form.useForm();

  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [methodForm] = Form.useForm();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm] = Form.useForm();

  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (!stripeKey) return null;
    return loadStripe(stripeKey);
  }, [stripeKey]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [donRes, metRes, planRes] = await Promise.all([
        pilotClient.get('/api/empresa/donativos'),
        pilotClient.get('/api/empresa/metodos-pago'),
        pilotClient.get('/api/empresa/planes-pago'),
      ]);
      const data = donRes.data.data as {
        companies: ActiveCompany[];
        donations: DonationRecord[];
        stripe_configured: boolean;
        stripe_key: string | null;
      };
      setCompanies(data.companies);
      setDonations(data.donations);
      setStripeConfigured(data.stripe_configured);
      setStripeKey(data.stripe_key);
      setMethods((metRes.data?.data as PaymentMethodRecord[]) ?? []);
      setPlans((planRes.data?.data as PaymentPlanRecord[]) ?? []);
      if (data.companies.length > 0 && !form.getFieldValue('company_id')) {
        form.setFieldsValue({
          company_id: data.companies[0].id,
          amount: 100,
          description: 'Donativo institucional UAGRM',
        });
      }
    } catch {
      setError('No se pudo cargar el módulo de donativos empresariales.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStartPayment = async (values: {
    company_id: string;
    amount: number;
    description?: string;
  }) => {
    setCreatingIntent(true);
    try {
      const res = await pilotClient.post('/api/empresa/donativos', values);
      const data = res.data?.data as {
        donation: DonationRecord;
        client_secret: string;
      };
      if (data?.client_secret) {
        setPendingPayment({
          donation: data.donation,
          clientSecret: data.client_secret,
        });
        return;
      }
      void message.error('Stripe no devolvió la autorización de pago.');
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo iniciar el donativo con Stripe.';
      void message.error(apiMsg);
    } finally {
      setCreatingIntent(false);
    }
  };

  const handleSaveMethod = async (values: {
    label: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    company_id?: string;
  }) => {
    try {
      const res = await pilotClient.post('/api/empresa/metodos-pago', values);
      void message.success(res.data?.message ?? 'Método registrado.');
      setMethodModalOpen(false);
      methodForm.resetFields();
      await loadData();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo registrar el método de pago.';
      void message.error(apiMsg);
    }
  };

  const handleSavePlan = async (values: {
    name: string;
    amount: number;
    frequency: string;
    installments: number;
    company_id?: string;
  }) => {
    try {
      const res = await pilotClient.post('/api/empresa/planes-pago', values);
      void message.success(res.data?.message ?? 'Plan creado.');
      setPlanModalOpen(false);
      planForm.resetFields();
      await loadData();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo crear el plan de pago.';
      void message.error(apiMsg);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
          align="center"
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              <DollarOutlined /> Donativos y pagos empresariales (BOB)
            </Typography.Title>
            <Typography.Text type="secondary">
              Gestiona donativos únicos con Stripe, métodos de pago registrados y planes de aporte.
            </Typography.Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void loadData()}
          >
            Actualizar
          </Button>
        </Space>
      </Card>

      {!stripeConfigured ? (
        <Alert
          type="info"
          showIcon
          title="Stripe pendiente de configuración"
          description="Configura STRIPE_KEY, STRIPE_SECRET y STRIPE_WEBHOOK_SECRET en el archivo .env del backend."
        />
      ) : null}

      {error ? <Alert type="error" showIcon title={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'donations',
              label: 'Donativo único (Stripe BOB)',
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {!loading && companies.length === 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      title="Sin empresa activa vinculada"
                      description="Solo los responsables vinculados a una empresa activa pueden realizar donativos en nombre de su organización."
                    />
                  ) : (
                    <>
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={(vals) => void handleStartPayment(vals)}
                        style={{ maxWidth: 520 }}
                      >
                        <Form.Item
                          name="company_id"
                          label="Empresa"
                          rules={[
                            { required: true, message: 'Selecciona una empresa.' },
                          ]}
                        >
                          <Select
                            disabled={pendingPayment !== null}
                            options={companies.map((c) => ({
                              value: c.id,
                              label: c.name,
                            }))}
                          />
                        </Form.Item>

                        <Space wrap size="small" style={{ marginBottom: 12 }}>
                          {[50, 100, 250, 500].map((preset) => (
                            <Button
                              key={preset}
                              size="small"
                              disabled={pendingPayment !== null}
                              onClick={() => form.setFieldValue('amount', preset)}
                            >
                              BOB {preset}
                            </Button>
                          ))}
                        </Space>

                        <Form.Item
                          name="amount"
                          label="Importe (BOB)"
                          rules={[
                            {
                              required: true,
                              message: 'Ingresa un importe en BOB.',
                            },
                            {
                              type: 'number',
                              min: 5,
                              max: 500000,
                              message:
                                'El importe debe estar entre BOB 5 y BOB 500,000.',
                            },
                          ]}
                        >
                          <InputNumber
                            disabled={pendingPayment !== null}
                            min={5}
                            max={500000}
                            precision={2}
                            addonAfter="BOB"
                            style={{ width: 220 }}
                          />
                        </Form.Item>

                        <Form.Item name="description" label="Concepto (opcional)">
                          <Input
                            disabled={pendingPayment !== null}
                            maxLength={200}
                            placeholder="Donativo institucional UAGRM"
                          />
                        </Form.Item>

                        {pendingPayment === null ? (
                          <Button
                            type="primary"
                            htmlType="submit"
                            icon={<CreditCardOutlined />}
                            loading={creatingIntent}
                            disabled={!stripeConfigured || companies.length === 0}
                          >
                            Ingresar datos de tarjeta
                          </Button>
                        ) : null}
                      </Form>

                      {pendingPayment && stripePromise ? (
                        <>
                          <Divider />
                          <Elements
                            stripe={stripePromise}
                            options={{
                              clientSecret: pendingPayment.clientSecret,
                              locale: 'es',
                            }}
                          >
                            <CardPaymentForm
                              donation={pendingPayment.donation}
                              clientSecret={pendingPayment.clientSecret}
                              onSuccess={() => {
                                setPendingPayment(null);
                                void loadData();
                              }}
                              onCancel={() => {
                                setPendingPayment(null);
                                void loadData();
                              }}
                            />
                          </Elements>
                        </>
                      ) : null}
                    </>
                  )}

                  <Divider>Historial de donativos de mis empresas</Divider>
                  <Table<DonationRecord>
                    rowKey="id"
                    loading={loading}
                    dataSource={donations}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: 'Fecha',
                        dataIndex: 'created_at',
                        key: 'created_at',
                        render: (v: string | null) =>
                          v ? new Date(v).toLocaleString('es-BO') : '—',
                      },
                      {
                        title: 'Empresa',
                        dataIndex: 'company_name',
                        key: 'company_name',
                        render: (v) => v ?? '—',
                      },
                      {
                        title: 'Responsable',
                        dataIndex: 'user_name',
                        key: 'user_name',
                        render: (v) => v ?? '—',
                      },
                      {
                        title: 'Monto',
                        key: 'amount',
                        render: (_, r) => `${r.currency} ${r.amount.toFixed(2)}`,
                      },
                      {
                        title: 'Estado',
                        dataIndex: 'status',
                        key: 'status',
                        render: (st: DonationRecord['status']) => {
                          const meta = STATUS_META[st] ?? {
                            label: st,
                            color: 'default',
                          };
                          return <Tag color={meta.color}>{meta.label}</Tag>;
                        },
                      },
                      {
                        title: 'Confirmación',
                        dataIndex: 'confirmed_at',
                        key: 'confirmed_at',
                        render: (v: string | null) =>
                          v ? new Date(v).toLocaleString('es-BO') : '—',
                      },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: 'methods',
              label: 'Métodos de pago',
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      methodForm.setFieldsValue({
                        brand: 'Visa',
                        company_id: companies[0]?.id,
                      });
                      setMethodModalOpen(true);
                    }}
                  >
                    Registrar método de pago
                  </Button>
                  <Table<PaymentMethodRecord>
                    rowKey="id"
                    loading={loading}
                    dataSource={methods}
                    pagination={false}
                    columns={[
                      { title: 'Etiqueta', dataIndex: 'label', key: 'label' },
                      { title: 'Marca', dataIndex: 'brand', key: 'brand' },
                      {
                        title: 'Terminación',
                        dataIndex: 'last4',
                        key: 'last4',
                        render: (v: string) => `•••• ${v}`,
                      },
                      {
                        title: 'Vencimiento',
                        key: 'exp',
                        render: (_, r) =>
                          `${String(r.exp_month).padStart(2, '0')}/${r.exp_year}`,
                      },
                      {
                        title: 'Predeterminado',
                        key: 'is_default',
                        render: (_, r) =>
                          r.is_default ? (
                            <Tag color="green">Predeterminado</Tag>
                          ) : (
                            <Button
                              size="small"
                              icon={<StarOutlined />}
                              onClick={() =>
                                void pilotClient
                                  .patch(
                                    `/api/empresa/metodos-pago/${r.id}/predeterminado`
                                  )
                                  .then(() => {
                                    void message.success(
                                      'Método predeterminado actualizado.'
                                    );
                                    void loadData();
                                  })
                              }
                            >
                              Usar por defecto
                            </Button>
                          ),
                      },
                      {
                        title: 'Acciones',
                        key: 'actions',
                        render: (_, r) => (
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              void pilotClient
                                .delete(`/api/empresa/metodos-pago/${r.id}`)
                                .then(() => {
                                  void message.success(
                                    'Método de pago eliminado.'
                                  );
                                  void loadData();
                                })
                            }
                          >
                            Eliminar
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: 'plans',
              label: 'Planes de pago',
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={() => {
                      planForm.setFieldsValue({
                        frequency: 'mensual',
                        installments: 6,
                        amount: 100,
                        company_id: companies[0]?.id,
                      });
                      setPlanModalOpen(true);
                    }}
                  >
                    Crear plan de aporte
                  </Button>
                  <Table<PaymentPlanRecord>
                    rowKey="id"
                    loading={loading}
                    dataSource={plans}
                    pagination={false}
                    columns={[
                      { title: 'Plan', dataIndex: 'name', key: 'name' },
                      {
                        title: 'Empresa',
                        key: 'company',
                        render: (_, r) => r.company?.name ?? 'Personal',
                      },
                      {
                        title: 'Monto (BOB)',
                        key: 'amount',
                        render: (_, r) =>
                          `BOB ${Number(r.amount).toFixed(2)} (${r.frequency})`,
                      },
                      {
                        title: 'Cuotas',
                        key: 'installments',
                        render: (_, r) =>
                          `${r.completed_installments} / ${r.installments}`,
                      },
                      {
                        title: 'Estado',
                        dataIndex: 'status',
                        key: 'status',
                        render: (st: string) => (
                          <Tag
                            color={
                              st === 'active'
                                ? 'green'
                                : st === 'paused'
                                  ? 'gold'
                                  : 'default'
                            }
                          >
                            {st}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Acciones',
                        key: 'actions',
                        render: (_, r) => (
                          <Select
                            size="small"
                            value={r.status}
                            style={{ width: 130 }}
                            onChange={(nextStatus) =>
                              void pilotClient
                                .patch(`/api/empresa/planes-pago/${r.id}`, {
                                  status: nextStatus,
                                })
                                .then(() => {
                                  void message.success(
                                    'Estado del plan actualizado.'
                                  );
                                  void loadData();
                                })
                            }
                            options={[
                              { value: 'active', label: 'Activo' },
                              { value: 'paused', label: 'Pausado' },
                              { value: 'completed', label: 'Completado' },
                              { value: 'cancelled', label: 'Cancelado' },
                            ]}
                          />
                        ),
                      },
                    ]}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Registrar método de pago"
        open={methodModalOpen}
        onCancel={() => setMethodModalOpen(false)}
        onOk={() => methodForm.submit()}
      >
        <Form
          form={methodForm}
          layout="vertical"
          onFinish={(vals) => void handleSaveMethod(vals)}
        >
          <Form.Item
            name="label"
            label="Nombre descriptivo"
            rules={[{ required: true, message: 'Ingresa una etiqueta.' }]}
          >
            <Input placeholder="ej. Tarjeta corporativa BNB" />
          </Form.Item>
          <Form.Item name="brand" label="Marca" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'Visa', label: 'Visa' },
                { value: 'Mastercard', label: 'Mastercard' },
                { value: 'American Express', label: 'American Express' },
                { value: 'Otro', label: 'Otro' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="last4"
            label="Últimos 4 dígitos"
            rules={[
              { required: true, message: 'Ingresa los últimos 4 dígitos.' },
              { pattern: /^\d{4}$/, message: 'Deben ser 4 dígitos.' },
            ]}
          >
            <Input maxLength={4} placeholder="4242" />
          </Form.Item>
          <Space>
            <Form.Item
              name="exp_month"
              label="Mes (MM)"
              rules={[{ required: true, message: 'Ingresa el mes.' }]}
            >
              <InputNumber min={1} max={12} />
            </Form.Item>
            <Form.Item
              name="exp_year"
              label="Año (AAAA)"
              rules={[{ required: true, message: 'Ingresa el año.' }]}
            >
              <InputNumber min={2026} max={2045} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="Crear plan de aporte empresarial"
        open={planModalOpen}
        onCancel={() => setPlanModalOpen(false)}
        onOk={() => planForm.submit()}
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={(vals) => void handleSavePlan(vals)}
        >
          <Form.Item
            name="name"
            label="Nombre del plan"
            rules={[{ required: true, message: 'Ingresa el nombre del plan.' }]}
          >
            <Input placeholder="ej. Aporte semestral FCEE" />
          </Form.Item>
          {companies.length > 0 ? (
            <Form.Item name="company_id" label="Empresa">
              <Select
                allowClear
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="amount"
            label="Monto por cuota (BOB)"
            rules={[{ required: true, message: 'Ingresa el monto.' }]}
          >
            <InputNumber min={5} max={500000} precision={2} addonAfter="BOB" />
          </Form.Item>
          <Space>
            <Form.Item
              name="frequency"
              label="Frecuencia"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 150 }}
                options={[
                  { value: 'unico', label: 'Único' },
                  { value: 'mensual', label: 'Mensual' },
                  { value: 'trimestral', label: 'Trimestral' },
                  { value: 'anual', label: 'Anual' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="installments"
              label="Cuotas"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={60} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
