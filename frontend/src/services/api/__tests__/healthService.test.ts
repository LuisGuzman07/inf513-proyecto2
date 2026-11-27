import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealth, healthClient } from '../healthService';

const success = { api: 'ok', status: 'ok', database: 'ok' };

afterEach(() => vi.restoreAllMocks());

describe('real health service contract', () => {
  it('calls the real endpoint with cancellation and a bounded timeout', async () => {
    const request = vi.spyOn(healthClient, 'get').mockResolvedValue({
      status: 200,
      data: { ...success, internal: 'must not be returned' },
    });
    const signal = new AbortController().signal;
    await expect(getHealth(signal)).resolves.toEqual(success);
    expect(request).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({ signal })
    );
    expect(healthClient.defaults.timeout).toBe(8000);
    const options = request.mock.calls[0][1];
    expect(options?.validateStatus?.(200)).toBe(true);
    expect(options?.validateStatus?.(503)).toBe(true);
    expect(options?.validateStatus?.(500)).toBe(false);
  });

  it('distinguishes an available API from unavailable PostgreSQL', async () => {
    const degraded = { api: 'ok', database: 'unavailable', status: 'degraded' };
    vi.spyOn(healthClient, 'get').mockResolvedValue({
      status: 503,
      data: degraded,
    });
    await expect(getHealth()).resolves.toEqual(degraded);
  });

  it.each([
    [200, '<html>Vite fallback</html>'],
    [200, { ...success, database: 'unavailable' }],
    [503, success],
  ])('rejects invalid or inconsistent responses (%s)', async (status, data) => {
    vi.spyOn(healthClient, 'get').mockResolvedValue({ status, data });
    await expect(getHealth()).rejects.toThrow(
      'No se pudo verificar la conexión con la API.'
    );
  });

  it('never exposes a server error or network details', async () => {
    vi.spyOn(healthClient, 'get').mockRejectedValue(
      new Error('password=private SQLSTATE internal-path')
    );
    await expect(getHealth()).rejects.toThrow(
      'No se pudo verificar la conexión con la API.'
    );
  });
});
