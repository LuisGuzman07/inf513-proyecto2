import { pilotClient } from './api';
import type {
  AssignmentSummary,
  EvaluationAssignment,
  ExerciseAnswer,
  InstrumentDetail,
  InstrumentSummary,
  StaffEvaluationAssignment,
} from './evaluations-types';
const staff = '/api/personal';
const own = '/api/talento/evaluaciones';
const idPath = (id: string) => encodeURIComponent(id);
export const evaluationsApi = {
  async instruments(signal: AbortSignal): Promise<InstrumentSummary[]> {
    return (await pilotClient.get(staff + '/instrumentos', { signal })).data
      .data;
  },
  async instrument(id: string, signal: AbortSignal): Promise<InstrumentDetail> {
    return (
      await pilotClient.get(staff + '/instrumentos/' + idPath(id), { signal })
    ).data.data;
  },
  async mine(signal: AbortSignal): Promise<AssignmentSummary[]> {
    return (await pilotClient.get(own, { signal })).data.data;
  },
  async autoAssignLogro(signal?: AbortSignal): Promise<{ data: EvaluationAssignment; already_assigned: boolean; can_retake: boolean }> {
    return (await pilotClient.post(own + '/autoasignar-logro', {}, { signal })).data;
  },
  async assignment(
    id: string,
    signal: AbortSignal
  ): Promise<EvaluationAssignment> {
    return (await pilotClient.get(own + '/' + idPath(id), { signal })).data
      .data;
  },
  async staffList(
    registration: string,
    signal: AbortSignal
  ): Promise<StaffEvaluationAssignment[]> {
    return (
      await pilotClient.get(
        staff + '/inscripciones/' + idPath(registration) + '/evaluaciones',
        { signal }
      )
    ).data.data;
  },
  async staffDetail(
    id: string,
    signal: AbortSignal
  ): Promise<StaffEvaluationAssignment> {
    return (
      await pilotClient.get(staff + '/evaluaciones/' + idPath(id), { signal })
    ).data.data;
  },
  async assign(
    registration: string,
    version: number,
    instrument_version_id: string,
    signal: AbortSignal
  ): Promise<StaffEvaluationAssignment> {
    return (
      await pilotClient.post(
        staff + '/inscripciones/' + idPath(registration) + '/evaluaciones',
        { version, instrument_version_id },
        { signal }
      )
    ).data.data;
  },
  async save(
    id: string,
    version: number,
    answers: Record<string, ExerciseAnswer | null>,
    signal: AbortSignal
  ): Promise<EvaluationAssignment> {
    return (
      await pilotClient.patch(
        own + '/' + idPath(id) + '/respuestas',
        { version, answers },
        { signal }
      )
    ).data.data;
  },
  async submit(
    id: string,
    version: number,
    confirm_unanswered: boolean,
    signal: AbortSignal
  ): Promise<EvaluationAssignment> {
    return (
      await pilotClient.post(
        own + '/' + idPath(id) + '/enviar',
        { version, confirm_unanswered },
        { signal }
      )
    ).data.data;
  },
  async image(url: string, signal: AbortSignal): Promise<Blob> {
    const target = new URL(url, window.location.origin);
    if (
      target.origin !== window.location.origin ||
      !target.pathname.startsWith('/api/') ||
      target.search ||
      target.hash
    )
      throw new Error('Medio privado no disponible.');
    return (
      await pilotClient.get(target.pathname, { signal, responseType: 'blob' })
    ).data;
  },
};
