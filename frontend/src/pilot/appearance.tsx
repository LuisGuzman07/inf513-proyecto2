import {
  BgColorsOutlined,
  EyeOutlined,
  FontSizeOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Popover,
  Segmented,
  Space,
  Switch,
  theme as antdTheme,
  Typography,
  type ThemeConfig,
} from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { pilotClient } from './api';
import { usePilotSession } from './context';
import { institutionalTheme } from './design';
import type { UiPreferences } from './types';
import './appearance.css';

const STORAGE_KEY = 'pilot_ui_preferences_v1';

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  theme_variant: 'adultos',
  color_mode: 'light',
  font_scale: 'normal',
  high_contrast: false,
};

const FONT_SIZE_MAP: Record<UiPreferences['font_scale'], number> = {
  small: 14,
  normal: 16,
  large: 18,
  xlarge: 20,
};

const THEME_PRESETS: Record<
  UiPreferences['theme_variant'],
  {
    primary: string;
    info: string;
    borderRadius: number;
    controlHeight: number;
    fontFamily: string;
  }
> = {
  adultos: {
    primary: '#a31c24',
    info: '#123764',
    borderRadius: 8,
    controlHeight: 40,
    fontFamily:
      "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  jovenes: {
    primary: '#2563eb',
    info: '#0284c7',
    borderRadius: 12,
    controlHeight: 42,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  ninos: {
    primary: '#0ea5e9',
    info: '#f59e0b',
    borderRadius: 16,
    controlHeight: 46,
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  },
};

export function resolveEffectiveColorMode(
  mode: UiPreferences['color_mode']
): 'light' | 'dark' {
  if (mode === 'auto') {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7 ? 'dark' : 'light';
  }
  return mode;
}

export function buildAppearanceTheme(prefs: UiPreferences): ThemeConfig {
  const preset = THEME_PRESETS[prefs.theme_variant] ?? THEME_PRESETS.adultos;
  const fontSize = FONT_SIZE_MAP[prefs.font_scale] ?? 16;
  const isDark = resolveEffectiveColorMode(prefs.color_mode) === 'dark';

  return {
    ...institutionalTheme,
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      ...institutionalTheme.token,
      colorPrimary: prefs.high_contrast
        ? isDark
          ? '#60a5fa'
          : '#0f172a'
        : preset.primary,
      colorLink: prefs.high_contrast
        ? isDark
          ? '#93c5fd'
          : '#0f172a'
        : preset.primary,
      colorInfo: preset.info,
      fontSize,
      fontSizeHeading1: Math.round(fontSize * 2),
      fontSizeHeading2: Math.round(fontSize * 1.5),
      fontSizeHeading3: Math.round(fontSize * 1.25),
      borderRadius: preset.borderRadius,
      controlHeight: preset.controlHeight,
      fontFamily: preset.fontFamily,
      ...(isDark
        ? {
            colorBgLayout: '#0f172a',
            colorBgContainer: '#1e293b',
            colorBgElevated: '#1e293b',
            colorText: '#f8fafc',
            colorTextSecondary: '#cbd5e1',
            colorTextDescription: '#cbd5e1',
            colorTextTertiary: '#94a3b8',
            colorInfoBg: '#172554',
            colorInfoBorder: '#1d4ed8',
            colorSuccessBg: '#052e16',
            colorSuccessBorder: '#15803d',
            colorSuccessText: '#86efac',
            colorWarningBg: '#422006',
            colorWarningBorder: '#a16207',
            colorWarningText: '#fde047',
            colorErrorBg: '#450a0a',
            colorErrorBorder: '#b91c1c',
            colorErrorText: '#fca5a5',
            colorBorder: prefs.high_contrast ? '#f8fafc' : '#334155',
            colorBorderSecondary: '#334155',
          }
        : prefs.high_contrast
          ? {
              colorBgLayout: '#ffffff',
              colorBgContainer: '#ffffff',
              colorText: '#000000',
              colorTextSecondary: '#111827',
              colorBorder: '#000000',
            }
          : {}),
    },
    ...(isDark
      ? {
          components: {
            ...institutionalTheme.components,
            Table: {
              ...institutionalTheme.components?.Table,
              headerBg: '#1e293b',
              headerColor: '#e2e8f0',
              rowHoverBg: '#334155',
            },
            Tag: {
              ...institutionalTheme.components?.Tag,
              colorSuccess: '#86efac',
              colorWarning: '#fde047',
              colorError: '#fca5a5',
            },
          },
        }
      : {}),
  };
}

function readLocalPreferences(): UiPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UI_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      theme_variant:
        parsed.theme_variant === 'ninos' ||
        parsed.theme_variant === 'jovenes' ||
        parsed.theme_variant === 'adultos'
          ? parsed.theme_variant
          : 'adultos',
      color_mode:
        parsed.color_mode === 'dark' || parsed.color_mode === 'auto'
          ? parsed.color_mode
          : 'light',
      font_scale:
        parsed.font_scale === 'small' ||
        parsed.font_scale === 'normal' ||
        parsed.font_scale === 'large' ||
        parsed.font_scale === 'xlarge'
          ? parsed.font_scale
          : 'normal',
      high_contrast: Boolean(parsed.high_contrast),
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

type AppearanceContextValue = {
  preferences: UiPreferences;
  themeConfig: ThemeConfig;
  updatePreferences: (patch: Partial<UiPreferences>) => void;
  resetPreferences: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { user } = usePilotSession();
  const [preferences, setPreferences] = useState<UiPreferences>(() =>
    readLocalPreferences()
  );

  useEffect(() => {
    if (user?.ui_preferences) {
      const merged = { ...DEFAULT_UI_PREFERENCES, ...user.ui_preferences };
      setPreferences(merged);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
  }, [user?.id, user?.ui_preferences]);

  useEffect(() => {
    const root = document.documentElement;
    const effectiveMode = resolveEffectiveColorMode(preferences.color_mode);
    root.style.fontSize = `${FONT_SIZE_MAP[preferences.font_scale]}px`;
    root.dataset.themeVariant = preferences.theme_variant;
    root.dataset.colorMode = effectiveMode;
    root.dataset.highContrast = preferences.high_contrast ? 'true' : 'false';
  }, [preferences]);

  const persist = useCallback(
    (next: UiPreferences) => {
      setPreferences(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorar errores de almacenamiento
      }
      if (user) {
        void pilotClient.put('/api/preferencias-ui', next).catch(() => {});
      }
    },
    [user]
  );

  const updatePreferences = useCallback(
    (patch: Partial<UiPreferences>) => {
      persist({ ...preferences, ...patch });
    },
    [persist, preferences]
  );

  const resetPreferences = useCallback(() => {
    persist(DEFAULT_UI_PREFERENCES);
  }, [persist]);

  const themeConfig = useMemo(
    () => buildAppearanceTheme(preferences),
    [preferences]
  );

  return (
    <AppearanceContext.Provider
      value={{ preferences, themeConfig, updatePreferences, resetPreferences }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error('useAppearance debe usarse dentro de AppearanceProvider');
  }
  return ctx;
}

export function AppearanceControl() {
  const { preferences, updatePreferences, resetPreferences } = useAppearance();

  const content = (
    <Space direction="vertical" size="middle" style={{ width: 290 }}>
      <div>
        <Typography.Text strong>
          <BgColorsOutlined /> Tema visual
        </Typography.Text>
        <div style={{ marginTop: 6 }}>
          <Segmented
            block
            aria-label="Seleccionar tema visual"
            value={preferences.theme_variant}
            onChange={(v) =>
              updatePreferences({
                theme_variant: v as UiPreferences['theme_variant'],
              })
            }
            options={[
              { label: 'Niños', value: 'ninos' },
              { label: 'Jóvenes', value: 'jovenes' },
              { label: 'Adultos', value: 'adultos' },
            ]}
          />
        </div>
      </div>

      <div>
        <Typography.Text strong>
          {preferences.color_mode === 'dark' ? (
            <MoonOutlined />
          ) : (
            <SunOutlined />
          )}{' '}
          Modo de color
        </Typography.Text>
        <div style={{ marginTop: 6 }}>
          <Segmented
            block
            aria-label="Seleccionar modo día o noche"
            value={preferences.color_mode}
            onChange={(v) =>
              updatePreferences({
                color_mode: v as UiPreferences['color_mode'],
              })
            }
            options={[
              { label: 'Día', value: 'light', icon: <SunOutlined /> },
              { label: 'Noche', value: 'dark', icon: <MoonOutlined /> },
              { label: 'Auto', value: 'auto' },
            ]}
          />
        </div>
      </div>

      <div>
        <Typography.Text strong>
          <FontSizeOutlined /> Tamaño de texto
        </Typography.Text>
        <div style={{ marginTop: 6 }}>
          <Segmented
            block
            aria-label="Seleccionar tamaño de fuente"
            value={preferences.font_scale}
            onChange={(v) =>
              updatePreferences({
                font_scale: v as UiPreferences['font_scale'],
              })
            }
            options={[
              { label: 'A-', value: 'small' },
              { label: 'Normal', value: 'normal' },
              { label: 'A+', value: 'large' },
              { label: 'A++', value: 'xlarge' },
            ]}
          />
        </div>
      </div>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Text strong>
          <EyeOutlined /> Alto contraste
        </Typography.Text>
        <Switch
          aria-label="Activar o desactivar alto contraste"
          checked={preferences.high_contrast}
          onChange={(checked) => updatePreferences({ high_contrast: checked })}
        />
      </Space>

      <Divider style={{ margin: '4px 0' }} />
      <Button block size="small" onClick={resetPreferences}>
        Restablecer valores por defecto
      </Button>
    </Space>
  );

  return (
    <Popover
      content={content}
      title="Apariencia y accesibilidad"
      trigger="click"
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={
          preferences.color_mode === 'dark' ? (
            <MoonOutlined />
          ) : (
            <BgColorsOutlined />
          )
        }
        aria-label="Configurar apariencia y accesibilidad"
      >
        Apariencia
      </Button>
    </Popover>
  );
}
