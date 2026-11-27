import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Col, Descriptions, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { getHealth } from '../services/api/healthService';

export default function TechnicalStatusPage() {
  const health = useQuery({
    queryKey: ['technical-health'],
    queryFn: ({ signal }) => getHealth(signal),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const current = health.isError ? undefined : health.data;

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Grupo 18B — Estado técnico">
            <Space vertical size="large">
              <Typography.Paragraph>
                Comprobación real React → Laravel → PostgreSQL. Esta pantalla no
                usa datos simulados ni implementa funciones de selección.
              </Typography.Paragraph>
              {health.isPending ? (
                <Alert type="info" title="Verificando conexión…" showIcon />
              ) : health.isError ? (
                <Alert
                  type="error"
                  title="No se pudo verificar la conexión con la API."
                  description="Revisá que Laravel esté iniciado y la comunicación local esté configurada."
                  showIcon
                />
              ) : current?.database === 'unavailable' ? (
                <Alert
                  type="warning"
                  title="Laravel disponible; PostgreSQL no disponible."
                  description="La API respondió, pero no pudo verificar su conexión a la base de datos."
                  showIcon
                />
              ) : (
                <Alert
                  type="success"
                  title="Conexión verificada con Laravel y PostgreSQL."
                  showIcon
                />
              )}
              <Descriptions column={1} bordered>
                <Descriptions.Item label="API Laravel">
                  {current ? 'Disponible' : 'Sin verificar'}
                </Descriptions.Item>
                <Descriptions.Item label="PostgreSQL">
                  {current?.database === 'ok'
                    ? 'Consulta SELECT 1 exitosa'
                    : current?.database === 'unavailable'
                      ? 'No disponible'
                      : 'Sin verificar'}
                </Descriptions.Item>
              </Descriptions>
              <Button
                aria-label="Volver a comprobar"
                aria-busy={health.isFetching}
                type="primary"
                loading={health.isFetching}
                onClick={() => void health.refetch()}
              >
                Volver a comprobar
              </Button>
              <Link to="/">Ver plantilla demo (solo referencia)</Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
