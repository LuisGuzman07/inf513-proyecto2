import { QueryClient } from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { httpStatus, pilotApi } from './api';
import type { PilotUser, RegisterInput } from './types';

type Status =
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'disabled'
  | 'network-error'
  | 'logout-error';
type Snapshot = { user: PilotUser | null; status: Status; generation: number };
export class PilotSession {
  readonly client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  snapshot: Snapshot = { user: null, status: 'loading', generation: 0 };
  private listeners = new Set<() => void>();
  private requests = new Set<AbortController>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  private publish(snapshot: Snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
  key(...parts: (string | number)[]) {
    return [
      'pilot',
      this.snapshot.user?.id,
      this.snapshot.generation,
      ...parts,
    ] as const;
  }
  invalidate(status: Status) {
    this.requests.forEach((controller) => controller.abort());
    this.requests.clear();
    void this.client.cancelQueries();
    this.client.clear();
    this.publish({
      user: null,
      status,
      generation: this.snapshot.generation + 1,
    });
  }
  authenticate(user: PilotUser) {
    this.invalidate(user.pilot_enabled ? 'authenticated' : 'disabled');
    if (user.pilot_enabled) this.publish({ ...this.snapshot, user });
  }
  async run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    const generation = this.snapshot.generation;
    const user = this.snapshot.user;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    this.requests.add(controller);
    try {
      if (controller.signal.aborted) throw new CanceledError();
      const result = await operation(controller.signal);
      if (controller.signal.aborted || generation !== this.snapshot.generation)
        throw new CanceledError();
      return result;
    } catch (error) {
      if (generation !== this.snapshot.generation || controller.signal.aborted)
        throw new CanceledError();
      const status = httpStatus(error);
      if (status === 401) this.invalidate('anonymous');
      if (status === 403) {
        if (operation === pilotApi.me || !user) {
          this.invalidate('disabled');
        } else {
          let current: PilotUser;
          try {
            current = await pilotApi.me(controller.signal);
          } catch (verificationError) {
            if (
              generation !== this.snapshot.generation ||
              controller.signal.aborted
            )
              throw new CanceledError();
            const verificationStatus = httpStatus(verificationError);
            this.invalidate(
              verificationStatus === 401
                ? 'anonymous'
                : verificationStatus === 403
                  ? 'disabled'
                  : 'network-error'
            );
            throw error;
          }
          if (
            generation !== this.snapshot.generation ||
            controller.signal.aborted
          )
            throw new CanceledError();
          if (!current.pilot_enabled) this.invalidate('disabled');
          else if (current.id !== user.id) this.invalidate('anonymous');
          else if (
            current.is_graduate !== user.is_graduate ||
            current.can_review_talent !== user.can_review_talent ||
            current.person_id !== user.person_id
          )
            this.authenticate(current);
          else this.publish({ ...this.snapshot, user: current });
        }
      }
      throw error;
    } finally {
      signal?.removeEventListener('abort', abort);
      this.requests.delete(controller);
    }
  }
  async boot() {
    this.invalidate('loading');
    const generation = this.snapshot.generation;
    try {
      this.authenticate(await this.run(pilotApi.me));
    } catch (error) {
      if (
        generation === this.snapshot.generation &&
        httpStatus(error) !== 401 &&
        httpStatus(error) !== 403
      )
        this.invalidate('network-error');
    }
  }
  async login(email: string, password: string) {
    this.invalidate('anonymous');
    const generation = this.snapshot.generation;
    try {
      this.authenticate(
        await this.run((signal) => pilotApi.login(email, password, signal))
      );
    } catch (error) {
      if (generation === this.snapshot.generation) this.invalidate('anonymous');
      throw error;
    }
  }
  async register(input: RegisterInput) {
    this.invalidate('anonymous');
    const generation = this.snapshot.generation;
    try {
      this.authenticate(
        await this.run((signal) => pilotApi.register(input, signal))
      );
    } catch (error) {
      if (generation === this.snapshot.generation) this.invalidate('anonymous');
      throw error;
    }
  }
  async logout() {
    this.invalidate('loading');
    const generation = this.snapshot.generation;
    try {
      await this.run(pilotApi.logout);
      this.invalidate('anonymous');
    } catch (error) {
      if (generation === this.snapshot.generation)
        this.invalidate('logout-error');
      else if (httpStatus(error) === 401) this.invalidate('anonymous');
    }
  }
}
