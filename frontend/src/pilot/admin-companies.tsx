import {
  BankOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { pilotClient } from './api';
import { usePilotSession } from './context';
import { hasAnyPermission } from './permissions';

type CompanyMember = {
  id: string;
  user_id: number;
  name: string | null;
  email: string | null;
  role: string;
  status: 'active' | 'inactive';
  linked_at: string | null;
};

type CompanyItem = {
  id: string;
  name: string;
  legal_name: string | null;
  contact_email: string;
  status: 'active' | 'inactive';
  service_requests_count: number;
  members: CompanyMember[];
  created_at: string | null;
};

export function AdminCompaniesPage() {
  const { user } = usePilotSession();
  const { message } = App.useApp();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyItem | null>(null);
  const [form] = Form.useForm();

  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(
    null
  );
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const canAccess = hasAnyPermission(user, [
    'servicios.gestionar',
    'admin.usuarios.gestionar',
  ]);

  const load = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    setError(null);
    try {
      const res = await pilotClient.get('/api/personal/empresas', {
        params: { q: search.trim() || undefined },
      });
      const list = (res.data?.data as CompanyItem[]) ?? [];
      setCompanies(list);
      if (selectedCompany) {
        const updated = list.find((c) => c.id === selectedCompany.id) ?? null;
        setSelectedCompany(updated);
      }
    } catch {
      setError('No se pudo cargar el listado de empresas.');
    } finally {
      setLoading(false);
    }
  }, [canAccess, search, selectedCompany]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, search]);

  const openModal = (company?: CompanyItem) => {
    setEditing(company ?? null);
    form.setFieldsValue({
      name: company?.name ?? '',
      legal_name: company?.legal_name ?? '',
      contact_email: company?.contact_email ?? '',
      status: company?.status ?? 'active',
    });
    setModalOpen(true);
  };

  const handleSave = async (values: {
    name: string;
    legal_name?: string;
    contact_email: string;
    status: 'active' | 'inactive';
  }) => {
    try {
      if (editing) {
        const res = await pilotClient.patch(
          `/api/personal/empresas/${editing.id}`,
          values
        );
        void message.success(res.data?.message ?? 'Empresa actualizada.');
      } else {
        const res = await pilotClient.post('/api/personal/empresas', values);
        void message.success(res.data?.message ?? 'Empresa registrada.');
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo guardar la empresa.';
      void message.error(apiMsg);
    }
  };

  const handleLinkUser = async () => {
    if (!selectedCompany || !linkEmail.trim()) return;
    setLinking(true);
    try {
      const res = await pilotClient.post(
        `/api/personal/empresas/${selectedCompany.id}/vincular`,
        { email: linkEmail.trim() }
      );
      void message.success(res.data?.message ?? 'Usuario vinculado.');
      setLinkEmail('');
      setSelectedCompany(res.data?.data as CompanyItem);
      await load();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo vincular el usuario.';
      void message.error(apiMsg);
    } finally {
      setLinking(false);
    }
  };

  const handleToggleMember = async (memberId: string) => {
    if (!selectedCompany) return;
    try {
      const res = await pilotClient.patch(
        `/api/personal/empresas/${selectedCompany.id}/usuarios/${memberId}`
      );
      void message.success(res.data?.message ?? 'Vinculación actualizada.');
      setSelectedCompany(res.data?.data as CompanyItem);
      await load();
    } catch {
      void message.error('No se pudo actualizar la vinculación.');
    }
  };

  if (!canAccess) {
    return (
      <Alert
        type="warning"
        showIcon
        title="No tienes permiso para consultar las empresas registradas."
      />
    );
  }

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
              <BankOutlined /> Empresas registradas
            </Typography.Title>
            <Typography.Text type="secondary">
              Gestiona organizaciones activas y vincula sus responsables empresariales.
            </Typography.Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Buscar empresa o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              Nueva empresa
            </Button>
          </Space>
        </Space>
      </Card>

      {error ? <Alert type="error" showIcon title={error} /> : null}

      <Card>
        <Table<CompanyItem>
          rowKey="id"
          loading={loading}
          dataSource={companies}
          pagination={{ pageSize: 15 }}
          columns={[
            {
              title: 'Empresa',
              key: 'name',
              render: (_, r) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{r.name}</Typography.Text>
                  <Typography.Text type="secondary">
                    {r.legal_name ?? r.contact_email}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: 'Correo de contacto',
              dataIndex: 'contact_email',
              key: 'contact_email',
            },
            {
              title: 'Responsables',
              key: 'members',
              render: (_, r) => (
                <Tag color="blue">
                  {r.members.filter((m) => m.status === 'active').length} activos
                </Tag>
              ),
            },
            {
              title: 'Solicitudes',
              dataIndex: 'service_requests_count',
              key: 'service_requests_count',
            },
            {
              title: 'Estado',
              dataIndex: 'status',
              key: 'status',
              render: (st: CompanyItem['status']) => (
                <Tag color={st === 'active' ? 'green' : 'default'}>
                  {st === 'active' ? 'Activa' : 'Inactiva'}
                </Tag>
              ),
            },
            {
              title: 'Acciones',
              key: 'actions',
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openModal(r)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => setSelectedCompany(r)}
                  >
                    Responsables
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? `Editar empresa: ${editing.name}` : 'Nueva empresa'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(vals) => void handleSave(vals)}
        >
          <Form.Item
            name="name"
            label="Nombre comercial"
            rules={[{ required: true, message: 'Ingresa el nombre.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="legal_name" label="Razón social (opcional)">
            <Input />
          </Form.Item>
          <Form.Item
            name="contact_email"
            label="Correo de contacto"
            rules={[
              { required: true, message: 'Ingresa el correo.' },
              { type: 'email', message: 'Correo inválido.' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Estado">
            <Select
              options={[
                { value: 'active', label: 'Activa' },
                { value: 'inactive', label: 'Inactiva' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          selectedCompany
            ? `Responsables de ${selectedCompany.name}`
            : 'Responsables'
        }
        open={selectedCompany !== null}
        onClose={() => setSelectedCompany(null)}
        width={480}
      >
        {selectedCompany ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Correo del usuario registrado"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
              />
              <Button
                type="primary"
                loading={linking}
                onClick={() => void handleLinkUser()}
              >
                Vincular
              </Button>
            </Space.Compact>

            <List
              bordered
              dataSource={selectedCompany.members}
              locale={{ emptyText: 'Sin usuarios vinculados todavía.' }}
              renderItem={(m) => (
                <List.Item
                  actions={[
                    <Switch
                      key="toggle"
                      checked={m.status === 'active'}
                      checkedChildren="Activo"
                      unCheckedChildren="Inactivo"
                      onChange={() => void handleToggleMember(m.id)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={m.name ?? 'Usuario'}
                    description={m.email ?? ''}
                  />
                </List.Item>
              )}
            />
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
