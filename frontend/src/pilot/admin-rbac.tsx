import {
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminRbacApi,
  type AdminPermission,
  type AdminRole,
  type AdminUser,
} from './admin-api';
import { usePilotSession } from './context';
import { hasPermission } from './permissions';

export function AdminUsersPage() {
  const { user: currentUser, session } = usePilotSession();
  const { message } = App.useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const canManageUsers = hasPermission(currentUser, 'admin.usuarios.gestionar');
  const canViewRoles = hasPermission(currentUser, 'admin.roles.gestionar');

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminRbacApi.listUsers({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
      });
      setUsers(res.data);
      setTotal(res.meta.total);
    } catch {
      setError('No se pudo cargar el listado de usuarios.');
    } finally {
      setLoading(false);
    }
  }, [canManageUsers, page, search, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!canViewRoles) return;
    void adminRbacApi
      .listRoles()
      .then(setRoles)
      .catch(() => {});
  }, [canViewRoles]);

  const openUserDetail = async (userId: number) => {
    try {
      const detail = await adminRbacApi.showUser(userId);
      setSelectedUser(detail);
      setSelectedRoleIds(detail.roles.map((r) => r.id));
      setDrawerOpen(true);
    } catch {
      void message.error('No se pudo cargar el detalle de la cuenta.');
    }
  };

  const handleToggleStatus = async (record: AdminUser, nextActive: boolean) => {
    try {
      const res = await adminRbacApi.updateUserStatus(record.id, nextActive);
      void message.success(res.message);
      await loadUsers();
      if (selectedUser?.id === record.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, is_active: nextActive } : prev
        );
      }
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo actualizar el estado de la cuenta.';
      void message.error(apiMsg);
    }
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;
    setSavingRoles(true);
    try {
      const res = await adminRbacApi.syncUserRoles(
        selectedUser.id,
        selectedRoleIds
      );
      setSelectedUser(res.data);
      void message.success(res.message);
      await loadUsers();
      if (selectedUser.id === currentUser?.id) {
        void session.boot();
      }
    } catch {
      void message.error('No se pudieron actualizar los roles del usuario.');
    } finally {
      setSavingRoles(false);
    }
  };

  if (!canManageUsers) {
    return (
      <Alert
        type="warning"
        showIcon
        title="No tienes permiso para administrar usuarios."
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space
          wrap
          style={{ width: '100%', justifyContent: 'space-between' }}
          align="center"
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Administración de usuarios
            </Typography.Title>
            <Typography.Text type="secondary">
              Consulta cuentas, activa o desactiva accesos y asigna roles.
            </Typography.Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Buscar por nombre o correo"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              style={{ width: 260 }}
            />
            <Select
              value={statusFilter}
              onChange={(val) => {
                setPage(1);
                setStatusFilter(val);
              }}
              style={{ width: 160 }}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'active', label: 'Activos' },
                { value: 'inactive', label: 'Inactivos' },
              ]}
            />
          </Space>
        </Space>
      </Card>

      {error ? <Alert type="error" showIcon title={error} /> : null}

      <Card>
        <Table<AdminUser>
          rowKey="id"
          loading={loading}
          dataSource={users}
          pagination={{
            current: page,
            pageSize: 25,
            total,
            onChange: setPage,
          }}
          columns={[
            {
              title: 'Usuario',
              key: 'name',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{record.name}</Typography.Text>
                  <Typography.Text type="secondary">
                    {record.email}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: 'Roles asignados',
              key: 'roles',
              render: (_, record) =>
                record.roles.length > 0 ? (
                  <Space wrap size={4}>
                    {record.roles.map((r) => (
                      <Tag key={r.id} color={r.is_active ? 'blue' : 'default'}>
                        {r.name}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">Sin roles</Typography.Text>
                ),
            },
            {
              title: 'Empresas vinculadas',
              key: 'companies',
              render: (_, record) =>
                record.companies.length > 0 ? (
                  <Space wrap size={4}>
                    {record.companies.map((c) => (
                      <Tag
                        key={c.id}
                        color={c.status === 'active' ? 'green' : 'default'}
                      >
                        {c.name}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
            {
              title: 'Estado',
              key: 'is_active',
              render: (_, record) => (
                <Switch
                  checked={record.is_active}
                  disabled={record.id === currentUser?.id}
                  checkedChildren="Activo"
                  unCheckedChildren="Inactivo"
                  onChange={(checked) => void handleToggleStatus(record, checked)}
                />
              ),
            },
            {
              title: 'Acciones',
              key: 'actions',
              render: (_, record) => (
                <Button
                  size="small"
                  icon={<UserOutlined />}
                  onClick={() => void openUserDetail(record.id)}
                >
                  Detalle y roles
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={selectedUser ? `Cuenta: ${selectedUser.name}` : 'Detalle'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
      >
        {selectedUser ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Correo">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={selectedUser.is_active ? 'green' : 'red'}>
                  {selectedUser.is_active ? 'Activa' : 'Desactivada'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Empresas">
                {selectedUser.companies.length > 0
                  ? selectedUser.companies
                      .map((c) => `${c.name} (${c.status})`)
                      .join(', ')
                  : 'Ninguna'}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '8px 0' }}>Asignación de roles</Divider>
            <Checkbox.Group
              value={selectedRoleIds}
              onChange={(vals) => setSelectedRoleIds(vals as number[])}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {roles.map((role) => (
                  <Checkbox
                    key={role.id}
                    value={role.id}
                    disabled={!role.is_active}
                  >
                    <strong>{role.name}</strong>{' '}
                    <Typography.Text type="secondary">
                      ({role.slug})
                    </Typography.Text>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            <Button
              type="primary"
              loading={savingRoles}
              onClick={() => void handleSaveUserRoles()}
            >
              Guardar roles asignados
            </Button>

            <Divider style={{ margin: '8px 0' }}>Permisos efectivos</Divider>
            <Space wrap size={[4, 8]}>
              {(selectedUser.effective_permissions ?? []).map((slug) => (
                <Tag key={slug} color="geekblue">
                  {slug}
                </Tag>
              ))}
              {(selectedUser.effective_permissions ?? []).length === 0 ? (
                <Typography.Text type="secondary">
                  Sin permisos efectivos.
                </Typography.Text>
              ) : null}
            </Space>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}

export function AdminRolesPage() {
  const { user: currentUser } = usePilotSession();
  const { message } = App.useApp();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [roleForm] = Form.useForm();

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<AdminPermission | null>(null);
  const [permForm] = Form.useForm();

  const canManageRoles = hasPermission(currentUser, 'admin.roles.gestionar');
  const canManagePerms = hasPermission(currentUser, 'admin.permisos.gestionar');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        canManageRoles ? adminRbacApi.listRoles() : Promise.resolve([]),
        canManagePerms ? adminRbacApi.listPermissions() : Promise.resolve([]),
      ]);
      setRoles(r);
      setPermissions(p);
    } catch {
      void message.error('No se pudieron cargar los roles y permisos.');
    } finally {
      setLoading(false);
    }
  }, [canManagePerms, canManageRoles, message]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const permissionsByModule = useMemo(() => {
    const groups: Record<string, AdminPermission[]> = {};
    for (const p of permissions) {
      groups[p.module] = groups[p.module] ?? [];
      groups[p.module].push(p);
    }
    return groups;
  }, [permissions]);

  const openRoleModal = (role?: AdminRole) => {
    setEditingRole(role ?? null);
    roleForm.setFieldsValue({
      slug: role?.slug ?? '',
      name: role?.name ?? '',
      description: role?.description ?? '',
      is_active: role?.is_active ?? true,
      permission_ids: role?.permissions.map((p) => p.id) ?? [],
    });
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (values: {
    slug: string;
    name: string;
    description?: string;
    is_active: boolean;
    permission_ids: number[];
  }) => {
    try {
      if (editingRole) {
        const res = await adminRbacApi.updateRole(editingRole.id, {
          name: values.name,
          description: values.description ?? null,
          is_active: values.is_active,
          permission_ids: values.permission_ids ?? [],
        });
        void message.success(res.message);
      } else {
        const res = await adminRbacApi.createRole(values);
        void message.success(res.message);
      }
      setRoleModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo guardar el rol.';
      void message.error(apiMsg);
    }
  };

  const openPermModal = (perm?: AdminPermission) => {
    setEditingPerm(perm ?? null);
    permForm.setFieldsValue({
      slug: perm?.slug ?? '',
      name: perm?.name ?? '',
      module: perm?.module ?? '',
      description: perm?.description ?? '',
      is_active: perm?.is_active ?? true,
    });
    setPermModalOpen(true);
  };

  const handleSavePerm = async (values: {
    slug: string;
    name: string;
    module: string;
    description?: string;
    is_active: boolean;
  }) => {
    try {
      if (editingPerm) {
        const res = await adminRbacApi.updatePermission(editingPerm.id, {
          name: values.name,
          module: values.module,
          description: values.description ?? null,
          is_active: values.is_active,
        });
        void message.success(res.message);
      } else {
        const res = await adminRbacApi.createPermission(values);
        void message.success(res.message);
      }
      setPermModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo guardar el permiso.';
      void message.error(apiMsg);
    }
  };

  if (!canManageRoles && !canManagePerms) {
    return (
      <Alert
        type="warning"
        showIcon
        title="No tienes permiso para administrar roles o permisos."
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Roles y permisos del sistema
        </Typography.Title>
        <Typography.Text type="secondary">
          Configura los roles funcionales y los permisos por módulo.
        </Typography.Text>
      </Card>

      <Card>
        <Tabs
          items={[
            ...(canManageRoles
              ? [
                  {
                    key: 'roles',
                    label: 'Roles',
                    children: (
                      <Space
                        direction="vertical"
                        size="middle"
                        style={{ width: '100%' }}
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => openRoleModal()}
                        >
                          Nuevo rol
                        </Button>
                        <Table<AdminRole>
                          rowKey="id"
                          loading={loading}
                          dataSource={roles}
                          pagination={false}
                          columns={[
                            {
                              title: 'Rol',
                              key: 'name',
                              render: (_, r) => (
                                <Space direction="vertical" size={0}>
                                  <Typography.Text strong>
                                    {r.name}
                                  </Typography.Text>
                                  <Typography.Text type="secondary">
                                    {r.slug}
                                  </Typography.Text>
                                </Space>
                              ),
                            },
                            {
                              title: 'Permisos',
                              key: 'permissions',
                              render: (_, r) => (
                                <Tag color="blue">
                                  {r.permissions.length} permisos
                                </Tag>
                              ),
                            },
                            {
                              title: 'Usuarios',
                              dataIndex: 'users_count',
                              key: 'users_count',
                            },
                            {
                              title: 'Estado',
                              key: 'is_active',
                              render: (_, r) => (
                                <Tag color={r.is_active ? 'green' : 'default'}>
                                  {r.is_active ? 'Activo' : 'Inactivo'}
                                </Tag>
                              ),
                            },
                            {
                              title: 'Acciones',
                              key: 'actions',
                              render: (_, r) => (
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => openRoleModal(r)}
                                >
                                  Editar
                                </Button>
                              ),
                            },
                          ]}
                        />
                      </Space>
                    ),
                  },
                ]
              : []),
            ...(canManagePerms
              ? [
                  {
                    key: 'permissions',
                    label: 'Permisos',
                    children: (
                      <Space
                        direction="vertical"
                        size="middle"
                        style={{ width: '100%' }}
                      >
                        <Button
                          type="primary"
                          icon={<SafetyCertificateOutlined />}
                          onClick={() => openPermModal()}
                        >
                          Nuevo permiso
                        </Button>
                        <Table<AdminPermission>
                          rowKey="id"
                          loading={loading}
                          dataSource={permissions}
                          pagination={{ pageSize: 20 }}
                          columns={[
                            {
                              title: 'Módulo',
                              dataIndex: 'module',
                              key: 'module',
                            },
                            {
                              title: 'Permiso',
                              key: 'name',
                              render: (_, p) => (
                                <Space direction="vertical" size={0}>
                                  <Typography.Text strong>
                                    {p.name}
                                  </Typography.Text>
                                  <Typography.Text type="secondary">
                                    {p.slug}
                                  </Typography.Text>
                                </Space>
                              ),
                            },
                            {
                              title: 'Estado',
                              key: 'is_active',
                              render: (_, p) => (
                                <Tag color={p.is_active ? 'green' : 'default'}>
                                  {p.is_active ? 'Activo' : 'Inactivo'}
                                </Tag>
                              ),
                            },
                            {
                              title: 'Acciones',
                              key: 'actions',
                              render: (_, p) => (
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => openPermModal(p)}
                                >
                                  Editar
                                </Button>
                              ),
                            },
                          ]}
                        />
                      </Space>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Modal
        title={editingRole ? `Editar rol: ${editingRole.name}` : 'Nuevo rol'}
        open={roleModalOpen}
        onCancel={() => setRoleModalOpen(false)}
        onOk={() => roleForm.submit()}
        width={640}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={(vals) => void handleSaveRole(vals)}
        >
          {!editingRole ? (
            <Form.Item
              name="slug"
              label="Identificador (slug)"
              rules={[
                { required: true, message: 'Ingresa un identificador.' },
                {
                  pattern: /^[a-z0-9_]+$/,
                  message: 'Solo minúsculas, números y guion bajo.',
                },
              ]}
            >
              <Input placeholder="ej. coordinador_academico" />
            </Form.Item>
          ) : null}
          <Form.Item
            name="name"
            label="Nombre del rol"
            rules={[{ required: true, message: 'Ingresa el nombre del rol.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="permission_ids" label="Permisos asignados">
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <Typography.Text strong>{module}</Typography.Text>
                    <div style={{ paddingLeft: 12, marginTop: 4 }}>
                      <Space direction="vertical">
                        {perms.map((p) => (
                          <Checkbox key={p.id} value={p.id}>
                            {p.name}{' '}
                            <Typography.Text type="secondary">
                              ({p.slug})
                            </Typography.Text>
                          </Checkbox>
                        ))}
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingPerm ? `Editar permiso: ${editingPerm.slug}` : 'Nuevo permiso'
        }
        open={permModalOpen}
        onCancel={() => setPermModalOpen(false)}
        onOk={() => permForm.submit()}
      >
        <Form
          form={permForm}
          layout="vertical"
          onFinish={(vals) => void handleSavePerm(vals)}
        >
          {!editingPerm ? (
            <Form.Item
              name="slug"
              label="Identificador (slug)"
              rules={[
                { required: true, message: 'Ingresa el slug del permiso.' },
                {
                  pattern: /^[a-z0-9_.]+$/,
                  message: 'Solo minúsculas, números, punto y guion bajo.',
                },
              ]}
            >
              <Input placeholder="ej. admin.reportes.exportar" />
            </Form.Item>
          ) : null}
          <Form.Item
            name="module"
            label="Módulo"
            rules={[{ required: true, message: 'Ingresa el módulo.' }]}
          >
            <Input placeholder="ej. Administración" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Nombre descriptivo"
            rules={[{ required: true, message: 'Ingresa el nombre.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
