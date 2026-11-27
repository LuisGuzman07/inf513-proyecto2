import React, { ReactNode } from 'react';
import { Divider, Space, Typography } from 'antd';

import './styles.css';

type Props = {
  title: string;
  extra?: ReactNode;
  description?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5;
  divider?: boolean;
  preserveCase?: boolean;
  titleClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const PageHeader = ({
  title,
  extra,
  description,
  headingLevel = 4,
  divider = true,
  preserveCase = false,
  titleClassName,
  ...others
}: Props) => {
  return (
    <div {...others}>
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <Space
          wrap={headingLevel === 1}
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Typography.Title
            level={headingLevel}
            className={titleClassName}
            style={{
              padding: 0,
              margin: 0,
              textTransform: preserveCase ? 'none' : 'capitalize',
            }}
          >
            {title}
          </Typography.Title>
          {extra}
        </Space>
      </Space>
      {description ? (
        <Typography.Paragraph type="secondary" className="m-0">
          {description}
        </Typography.Paragraph>
      ) : null}
      {divider ? (
        <Divider titlePlacement="end" plain>
          <span style={{ textTransform: 'capitalize' }}>{title}</span>
        </Divider>
      ) : null}
    </div>
  );
};
