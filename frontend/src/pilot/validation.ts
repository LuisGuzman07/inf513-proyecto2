import type { Draft, DraftInput } from './types';

export const fields = [
  ['full_name', 'Nombre completo', 200],
  ['birth_date', 'Fecha de nacimiento', 10],
  ['university_registration', 'Registro universitario', 64],
  ['sex', 'Sexo declarado', 64],
  ['contact_email', 'Correo de contacto', 254],
  ['contact_phone', 'Teléfono de contacto', 50],
  ['faculty', 'Facultad declarada', 200],
  ['career', 'Carrera declarada', 200],
  ['interest_area', 'Área de interés declarada', 200],
  ['declared_ppa', 'PPA declarado', 64],
] as const;
export function normalizeDraft(input: DraftInput): Draft {
  const text = Object.fromEntries(
    fields.map(([key]) => [key, input[key]?.trim() || null])
  );
  return {
    ...text,
    full_name: input.full_name?.trim() || null,
    faculty_catalog_id: input.faculty_catalog_id?.trim() || null,
    career_catalog_id: input.career_catalog_id?.trim() || null,
    career_manual: input.career_manual ?? false,
    mobility: {
      province: input.mobility?.province ?? null,
      department: input.mobility?.department ?? null,
      country: input.mobility?.country ?? null,
    },
  } as Draft;
}
export function validateDraft(input: DraftInput): Record<string, string> {
  const draft = normalizeDraft(input);
  const errors: Record<string, string> = {};
  for (const [key, , max] of fields) {
    if ((draft[key]?.length ?? 0) > max)
      errors[key] = `Máximo ${max} caracteres.`;
  }
  if (draft.contact_email && !/^.+@[^@\s]+$/.test(draft.contact_email))
    errors.contact_email = 'Ingresá un correo de contacto válido.';
  if (draft.birth_date) {
    const value = draft.birth_date;
    const date = new Date(`${value}T00:00:00Z`);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value ||
      value > today
    )
      errors.birth_date = 'Usá una fecha válida no futura (AAAA-MM-DD).';
  }
  return errors;
}
