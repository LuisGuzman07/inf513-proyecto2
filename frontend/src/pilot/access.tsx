import { Typography } from 'antd';
import type { ReactNode } from 'react';
import { Card } from '../components/shared/card/card';
import { Container } from '../components/shared/container/container';
import { academicTitle } from './workflow';
import { institutionalAssets } from './identity';
import './figma-public.css';
export { AuthenticationFrame } from '../pages/authentication/authentication-frame';
export type { AuthenticationFrameProps } from '../pages/authentication/authentication-frame';
export function AccessFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Container className="pilot-figma-access">
      <Card className="pilot-figma-access-card">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Paragraph>{description}</Typography.Paragraph>
        <div className="pilot-figma-access-fields">{children}</div>
      </Card>
      <aside
        className="pilot-figma-access-aside"
        aria-label="Información institucional"
      >
        <div className="pilot-figma-access-identity">
          <img {...institutionalAssets.banner} />
          <Typography.Text>Administración de Empresas</Typography.Text>
        </div>
        <Typography.Title level={2}>{academicTitle}</Typography.Title>
        <Typography.Paragraph>
          El registro público sólo crea una cuenta de titular. Guardá tu
          inscripción y documentos privados y consultá las observaciones desde
          tu portal.
        </Typography.Paragraph>
      </aside>
    </Container>
  );
}
