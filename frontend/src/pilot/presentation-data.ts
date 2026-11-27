import { fields } from './validation';

export const formSections = [
  {
    id: 'datos-personales',
    title: 'Datos personales',
    description: 'Tu información de identificación.',
    fields: ['full_name', 'birth_date', 'university_registration', 'sex'],
  },
  {
    id: 'informacion-academica',
    title: 'Información académica',
    description: 'Indicá tu formación y el PPA respaldado por tu histórico.',
    fields: ['career', 'faculty', 'declared_ppa'],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    description: 'Datos para contactar con vos durante el proceso.',
    fields: ['contact_email', 'contact_phone'],
  },
  {
    id: 'intereses-movilidad',
    title: 'Intereses y movilidad',
    description: 'Tu área de interés y disponibilidad para trasladarte.',
    fields: ['interest_area'],
  },
] as const satisfies readonly {
  id: string;
  title: string;
  description: string;
  fields: readonly (typeof fields)[number][0][];
}[];

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
export function formatRecordDate(value?: string | null): string {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : dateFormatter.format(date);
}
