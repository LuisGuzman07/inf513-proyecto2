import {
  AuditOutlined,
  BarChartOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  adminRbacApi,
  type AdminDashboardData,
  type AuditLogEntry,
} from './admin-api';
import { usePilotSession } from './context';
import { hasPermission } from './permissions';

export function AdminDashboardPage() {
  const { user } = usePilotSession();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission(user, 'admin.dashboard.ver');

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      setData(await adminRbacApi.getDashboard());
    } catch {
      setError('No se pudieron cargar las estadísticas del sistema.');
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) {
    return (
      <Alert
        type="warning"
        showIcon
        title="No tienes permiso para ver el dashboard de estadísticas."
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
              <BarChartOutlined /> Dashboard de estadísticas
            </Typography.Title>
            <Typography.Text type="secondary">
              Indicadores en tiempo real obtenidos desde PostgreSQL.
            </Typography.Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void load()}
          >
            Actualizar
          </Button>
        </Space>
      </Card>

      {error ? <Alert type="error" showIcon title={error} /> : null}

      {data ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Titulares registrados"
                  value={data.total_titulares}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Expedientes (pendientes)"
                  value={data.total_expedientes}
                  suffix={`/ ${data.expedientes_pendientes_revision} rev.`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Evaluaciones completadas"
                  value={data.evaluaciones_completadas}
                  suffix={`/ ${data.evaluaciones_asignadas}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Visitas totales (hoy)"
                  value={data.visitas_totales}
                  suffix={`/ ${data.visitas_hoy} hoy`}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Empresas registradas"
                  value={data.empresas_registradas}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Candidatos en solicitudes"
                  value={data.candidatos_registrados}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Donativos confirmados"
                  value={data.donativos_confirmados}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="Monto acumulado donativos"
                  value={data.donativos_monto_total}
                  precision={2}
                  prefix="$"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Expedientes por estado">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {Object.entries(data.expedientes_por_estado).map(
                    ([estado, total]) => {
                      const pct = data.total_expedientes
                        ? Math.round((total / data.total_expedientes) * 100)
                        : 0;
                      return (
                        <div key={estado}>
                          <Space
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography.Text>{estado}</Typography.Text>
                            <Typography.Text strong>
                              {total} ({pct}%)
                            </Typography.Text>
                          </Space>
                          <Progress percent={pct} showInfo={false} size="small" />
                        </div>
                      );
                    }
                  )}
                </Space>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="estado"
                  dataSource={Object.entries(data.expedientes_por_estado).map(
                    ([estado, total]) => ({ estado, total })
                  )}
                  columns={[
                    { title: 'Estado', dataIndex: 'estado', key: 'estado' },
                    { title: 'Cantidad', dataIndex: 'total', key: 'total' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Solicitudes empresariales por estado">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {(() => {
                    const totalSolicitudes = Object.values(
                      data.solicitudes_por_estado
                    ).reduce((a, b) => a + b, 0);
                    return Object.entries(data.solicitudes_por_estado).map(
                      ([estado, total]) => {
                        const pct = totalSolicitudes
                          ? Math.round((total / totalSolicitudes) * 100)
                          : 0;
                        return (
                          <div key={estado}>
                            <Space
                              style={{
                                width: '100%',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography.Text>{estado}</Typography.Text>
                              <Typography.Text strong>
                                {total} ({pct}%)
                              </Typography.Text>
                            </Space>
                            <Progress
                              percent={pct}
                              showInfo={false}
                              size="small"
                              strokeColor="#123764"
                            />
                          </div>
                        );
                      }
                    );
                  })()}
                </Space>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="estado"
                  dataSource={Object.entries(data.solicitudes_por_estado).map(
                    ([estado, total]) => ({ estado, total })
                  )}
                  columns={[
                    { title: 'Estado', dataIndex: 'estado', key: 'estado' },
                    { title: 'Cantidad', dataIndex: 'total', key: 'total' },
                  ]}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={`Páginas más visitadas (7 días: ${data.visitas_ultimos_7_dias})`}
              >
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {data.top_paginas.map((p) => {
                    const max = Math.max(
                      1,
                      ...data.top_paginas.map((x) => x.visits)
                    );
                    const pct = Math.round((p.visits / max) * 100);
                    return (
                      <div key={p.path}>
                        <Space
                          style={{
                            width: '100%',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography.Text>{p.path}</Typography.Text>
                          <Typography.Text strong>{p.visits}</Typography.Text>
                        </Space>
                        <Progress
                          percent={pct}
                          showInfo={false}
                          size="small"
                          strokeColor="#a31c24"
                        />
                      </div>
                    );
                  })}
                </Space>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="path"
                  dataSource={data.top_paginas}
                  columns={[
                    { title: 'Ruta', dataIndex: 'path', key: 'path' },
                    { title: 'Visitas', dataIndex: 'visits', key: 'visits' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Accesos recientes">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  dataSource={data.accesos_recientes}
                  columns={[
                    {
                      title: 'Usuario',
                      dataIndex: 'user_email',
                      key: 'user_email',
                      render: (v) => v ?? '—',
                    },
                    { title: 'Evento', dataIndex: 'event', key: 'event' },
                    {
                      title: 'Resultado',
                      dataIndex: 'result',
                      key: 'result',
                      render: (r: string) => (
                        <Tag
                          color={
                            r === 'success'
                              ? 'green'
                              : r === 'failed'
                                ? 'red'
                                : 'orange'
                          }
                        >
                          {r}
                        </Tag>
                      ),
                    },
                    {
                      title: 'IP',
                      dataIndex: 'ip_address',
                      key: 'ip_address',
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </Space>
  );
}

export function AdminAuditPage() {
  const { user } = usePilotSession();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(null);

  const canView = hasPermission(user, 'admin.auditoria.ver');

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminRbacApi.listAuditLogs({
        q: search.trim() || undefined,
        result: resultFilter || undefined,
        resource_type: resourceFilter || undefined,
        from: dateRange?.[0] || undefined,
        to: dateRange?.[1] || undefined,
        page,
      });
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch {
      setError('No se pudo cargar la bitácora de auditoría.');
    } finally {
      setLoading(false);
    }
  }, [canView, dateRange, page, resourceFilter, resultFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) {
    return (
      <Alert
        type="warning"
        showIcon
        title="No tienes permiso para consultar la bitácora de auditoría."
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
              <AuditOutlined /> Bitácora de auditoría
            </Typography.Title>
            <Typography.Text type="secondary">
              Registro histórico inmutable de accesos y operaciones sensibles.
            </Typography.Text>
          </div>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Correo, evento, recurso o IP"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              style={{ width: 220 }}
            />
            <Select
              value={resultFilter}
              onChange={(v) => {
                setPage(1);
                setResultFilter(v);
              }}
              style={{ width: 140 }}
              options={[
                { value: '', label: 'Resultado' },
                { value: 'success', label: 'Exitoso' },
                { value: 'failed', label: 'Fallido' },
                { value: 'denied', label: 'Denegado' },
              ]}
            />
            <Select
              value={resourceFilter}
              onChange={(v) => {
                setPage(1);
                setResourceFilter(v);
              }}
              style={{ width: 140 }}
              options={[
                { value: '', label: 'Recurso' },
                { value: 'auth', label: 'auth' },
                { value: 'user', label: 'user' },
                { value: 'role', label: 'role' },
                { value: 'donation', label: 'donation' },
              ]}
            />
            <DatePicker.RangePicker
              onChange={(_, strs) => {
                setPage(1);
                setDateRange(strs[0] && strs[1] ? [strs[0], strs[1]] : null);
              }}
            />
          </Space>
        </Space>
      </Card>

      {error ? <Alert type="error" showIcon title={error} /> : null}

      <Card>
        <Table<AuditLogEntry>
          rowKey="id"
          loading={loading}
          dataSource={logs}
          pagination={{
            current: page,
            pageSize: 25,
            total,
            onChange: setPage,
          }}
          columns={[
            {
              title: 'Fecha y hora',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (v: string | null) =>
                v ? new Date(v).toLocaleString('es-BO') : '—',
            },
            {
              title: 'Usuario',
              key: 'user',
              render: (_, r) => r.user_email ?? r.user_name ?? 'Anónimo',
            },
            { title: 'Evento', dataIndex: 'event', key: 'event' },
            {
              title: 'Recurso',
              key: 'resource',
              render: (_, r) =>
                r.resource_type
                  ? `${r.resource_type}${r.resource_id ? ` #${r.resource_id}` : ''}`
                  : '—',
            },
            { title: 'IP', dataIndex: 'ip_address', key: 'ip_address' },
            {
              title: 'Resultado',
              dataIndex: 'result',
              key: 'result',
              render: (res: string) => (
                <Tag
                  color={
                    res === 'success'
                      ? 'green'
                      : res === 'failed'
                        ? 'red'
                        : 'orange'
                  }
                >
                  {res}
                </Tag>
              ),
            },
            {
              title: 'Detalle',
              key: 'detail',
              render: (_, r) => (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setDetailLog(r)}
                >
                  Ver
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={detailLog ? `Evento #${detailLog.id}: ${detailLog.event}` : ''}
        open={detailLog !== null}
        onCancel={() => setDetailLog(null)}
        footer={null}
      >
        {detailLog ? (
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {JSON.stringify(detailLog, null, 2)}
          </pre>
        ) : null}
      </Modal>
    </Space>
  );
}
