import { Col, Flex, Row, theme, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useMediaQuery } from 'react-responsive';
import './styles.css';

export interface AuthenticationFrameProps {
  brand?: ReactNode;
  welcome: ReactNode;
  introduction: ReactNode;
  title: string;
  description?: ReactNode;
  controls?: ReactNode;
  fullPage?: boolean;
  children: ReactNode;
}

export function AuthenticationFrame({
  brand,
  welcome,
  introduction,
  title,
  description,
  controls,
  fullPage = true,
  children,
}: AuthenticationFrameProps) {
  const { token } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  return (
    <Row
      className="template-auth-frame"
      style={{ minHeight: isMobile ? 'auto' : fullPage ? '100vh' : '100%' }}
    >
      {controls ? (
        <div className="template-auth-controls">{controls}</div>
      ) : null}
      <Col xs={24} lg={12}>
        <Flex
          vertical
          align="center"
          justify="center"
          className="text-center template-auth-introduction"
          style={{ background: token.colorPrimary }}
        >
          {brand}
          <Typography.Title level={2} className="text-white">
            {welcome}
          </Typography.Title>
          <Typography.Text className="text-white template-auth-description">
            {introduction}
          </Typography.Text>
        </Flex>
      </Col>
      <Col xs={24} lg={12}>
        <Flex
          vertical
          align={isMobile ? 'center' : 'flex-start'}
          justify="center"
          gap="middle"
          className="template-auth-form-panel"
          style={{ background: token.colorBgContainer }}
        >
          <Typography.Title className="m-0">{title}</Typography.Title>
          {description}
          {children}
        </Flex>
      </Col>
    </Row>
  );
}
