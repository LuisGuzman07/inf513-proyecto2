import axios from 'axios';

export type HealthStatus = {
  api: 'ok';
  database: 'ok' | 'unavailable';
  status: 'ok' | 'degraded';
};

// El cliente de plantilla convierte solicitudes a mocks y elimina baseURL.
// Reutilizar Axios, sin tokens, redirecciones ni interceptores demo.
export const healthClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

function isHealthStatus(data: unknown, status: number): data is HealthStatus {
  if (!data || typeof data !== 'object') return false;
  const value = data as Record<string, unknown>;
  return (
    value.api === 'ok' &&
    ((status === 200 && value.status === 'ok' && value.database === 'ok') ||
      (status === 503 &&
        value.status === 'degraded' &&
        value.database === 'unavailable'))
  );
}

export async function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  try {
    const response = await healthClient.get<unknown>('/api/health', {
      signal,
      validateStatus: (status) => status === 200 || status === 503,
    });
    if (!isHealthStatus(response.data, response.status)) {
      throw new Error('Invalid health response');
    }
    return {
      api: response.data.api,
      database: response.data.database,
      status: response.data.status,
    };
  } catch {
    throw new Error('No se pudo verificar la conexión con la API.');
  }
}
