import type { CSSProperties } from 'react';

export const institutionalColors = {
  primary: '#880000',
  blue: '#2A3964',
  background: '#F5F6F8',
  surface: '#FFFFFF',
  text: '#202837',
  border: '#DCE1E8',
  secondary: '#526075',
  successText: '#2E6813',
  warningText: '#754800',
  infoSurface: '#EEF4FC',
  infoBorder: '#C6D5EA',
} as const;

const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const institutionalAssets = {
  university: {
    src: `${base}uagrm-logo.jpg`,
    alt: 'Escudo de la Universidad Autónoma Gabriel René Moreno',
    width: 820,
    height: 800,
  },
  banner: {
    src: `${base}uagrm-banner.png`,
    alt: 'Universidad Autónoma Gabriel René Moreno',
    width: 707,
    height: 88,
  },
  career: {
    src: `${base}adm-empresas-logo.jpg`,
    alt: 'Carrera de Administración de Empresas',
    width: 1253,
    height: 1253,
  },
  building: {
    src: `${base}adm-empresas-edificio.jpg`,
    alt: 'Edificio de la Carrera de Administración de Empresas de la UAGRM',
    width: 1280,
    height: 853,
  },
} as const;

export const institutionalVariables = {
  '--pilot-red': institutionalColors.primary,
  '--pilot-blue': institutionalColors.blue,
  '--pilot-background': institutionalColors.background,
  '--pilot-surface': institutionalColors.surface,
  '--pilot-text': institutionalColors.text,
  '--pilot-border': institutionalColors.border,
  '--pilot-secondary': institutionalColors.secondary,
} as CSSProperties;
