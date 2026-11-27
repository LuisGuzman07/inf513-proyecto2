import { SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Empty,
  Input,
  List,
  Popover,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pilotClient } from './api';

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

type SearchGroup = {
  key: string;
  label: string;
  items: SearchItem[];
};

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      void pilotClient
        .get('/api/buscar', {
          params: { q: trimmed },
          signal: controller.signal,
        })
        .then((res) => {
          setGroups((res.data?.data?.groups as SearchGroup[]) ?? []);
          setOpen(true);
        })
        .catch((err) => {
          if (err?.name !== 'CanceledError') {
            setError('No se pudo completar la búsqueda.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [term]);

  const content = (
    <div style={{ width: 340, maxHeight: 400, overflowY: 'auto' }}>
      {loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Spin size="small" /> Buscando…
        </div>
      ) : error ? (
        <Alert type="error" showIcon title={error} />
      ) : term.trim().length < 2 ? (
        <Typography.Text type="secondary">
          Escribe al menos 2 caracteres para buscar.
        </Typography.Text>
      ) : groups.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Sin resultados autorizados"
        />
      ) : (
        groups.map((group) => (
          <div key={group.key} style={{ marginBottom: 12 }}>
            <Tag color="blue" style={{ marginBottom: 6 }}>
              {group.label}
            </Tag>
            <List
              size="small"
              dataSource={group.items}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '6px 8px' }}
                  onClick={() => {
                    setOpen(false);
                    navigate(item.url);
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Typography.Text strong>{item.title}</Typography.Text>
                    }
                    description={
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.subtitle}
                      </Typography.Text>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ))
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open && term.trim().length >= 2}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Input
        allowClear
        size="middle"
        aria-label="Búsqueda global"
        prefix={<SearchOutlined />}
        placeholder="Buscar en el sistema…"
        value={term}
        onFocus={() => {
          if (term.trim().length >= 2) setOpen(true);
        }}
        onChange={(e) => {
          setTerm(e.target.value);
          if (e.target.value.trim().length >= 2) setOpen(true);
        }}
        style={{ maxWidth: 240, minWidth: 160 }}
      />
    </Popover>
  );
}
