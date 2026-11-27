import { pilotClient } from './api';

export type AdminPermission = {
  id: number;
  slug: string;
  name: string;
  module: string;
  description: string | null;
  is_active: boolean;
};

export type AdminRole = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_system: boolean;
  users_count: number;
  permissions: AdminPermission[];
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  roles: { id: number; slug: string; name: string; is_active: boolean }[];
  companies: { id: string; name: string; status: string }[];
  created_at: string | null;
  effective_permissions?: string[];
  direct_permissions?: {
    permission_id: number;
    slug: string;
    name: string;
    allowed: boolean;
  }[];
};

export const adminRbacApi = {
  async listUsers(params: { q?: string; status?: string; page?: number }) {
    const res = await pilotClient.get('/api/admin/usuarios', { params });
    return res.data as {
      data: AdminUser[];
      meta: { current_page: number; last_page: number; total: number };
    };
  },
  async showUser(id: number) {
    const res = await pilotClient.get(`/api/admin/usuarios/${id}`);
    return res.data.data as AdminUser;
  },
  async updateUserStatus(id: number, is_active: boolean) {
    const res = await pilotClient.patch(`/api/admin/usuarios/${id}/estado`, {
      is_active,
    });
    return res.data as { message: string; data: AdminUser };
  },
  async syncUserRoles(id: number, role_ids: number[]) {
    const res = await pilotClient.put(`/api/admin/usuarios/${id}/roles`, {
      role_ids,
    });
    return res.data as { message: string; data: AdminUser };
  },
  async listRoles() {
    const res = await pilotClient.get('/api/admin/roles');
    return res.data.data as AdminRole[];
  },
  async createRole(payload: {
    slug: string;
    name: string;
    description?: string;
    is_active?: boolean;
    permission_ids?: number[];
  }) {
    const res = await pilotClient.post('/api/admin/roles', payload);
    return res.data as { message: string; data: AdminRole };
  },
  async updateRole(
    id: number,
    payload: {
      name?: string;
      description?: string | null;
      is_active?: boolean;
      permission_ids?: number[];
    }
  ) {
    const res = await pilotClient.patch(`/api/admin/roles/${id}`, payload);
    return res.data as { message: string; data: AdminRole };
  },
  async listPermissions() {
    const res = await pilotClient.get('/api/admin/permisos');
    return res.data.data as AdminPermission[];
  },
  async createPermission(payload: {
    slug: string;
    name: string;
    module: string;
    description?: string;
    is_active?: boolean;
  }) {
    const res = await pilotClient.post('/api/admin/permisos', payload);
    return res.data as { message: string; data: AdminPermission };
  },
  async updatePermission(
    id: number,
    payload: {
      name?: string;
      module?: string;
      description?: string | null;
      is_active?: boolean;
    }
  ) {
    const res = await pilotClient.patch(`/api/admin/permisos/${id}`, payload);
    return res.data as { message: string; data: AdminPermission };
  },
  async listAuditLogs(params: {
    q?: string;
    event?: string;
    result?: string;
    resource_type?: string;
    from?: string;
    to?: string;
    page?: number;
  }) {
    const res = await pilotClient.get('/api/admin/auditoria', { params });
    return res.data as {
      data: AuditLogEntry[];
      meta: { current_page: number; last_page: number; total: number };
    };
  },
  async getDashboard() {
    const res = await pilotClient.get('/api/admin/dashboard');
    return res.data.data as AdminDashboardData;
  },
  async recordVisit(path: string) {
    const res = await pilotClient.post('/api/visitas', { path });
    return res.data.data as VisitSummary;
  },
  async getVisitSummary() {
    const res = await pilotClient.get('/api/visitas/resumen');
    return res.data.data as VisitSummary;
  },
};

export type AuditLogEntry = {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  event: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  result: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

export type AdminDashboardData = {
  total_titulares: number;
  total_expedientes: number;
  expedientes_pendientes_revision: number;
  expedientes_por_estado: Record<string, number>;
  evaluaciones_asignadas: number;
  evaluaciones_completadas: number;
  solicitudes_por_estado: Record<string, number>;
  empresas_registradas: number;
  candidatos_registrados: number;
  donativos_confirmados: number;
  donativos_monto_total: number;
  visitas_totales: number;
  visitas_hoy: number;
  visitas_ultimos_7_dias: number;
  top_paginas: { path: string; visits: number }[];
  accesos_recientes: {
    id: number;
    user_email: string | null;
    event: string;
    result: string;
    ip_address: string | null;
    created_at: string | null;
  }[];
};

export type VisitSummary = {
  total_visits: number;
  today_visits: number;
  path_visits: number | null;
};
