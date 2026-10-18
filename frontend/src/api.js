import keycloak from './keycloak';

const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      keycloak.login();
      throw new Error('Sesja wygasła');
    }
    headers.Authorization = `Bearer ${keycloak.token}`;
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Błąd ${res.status}`;
    try {
      message = (await res.json()).message || message;
    } catch {
      /* brak treści JSON */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== '' && v != null && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  categories: () => request('/categories'),
  equipment: (filters = {}) => request(`/equipment${qs(filters)}`),
  equipmentById: (id) => request(`/equipment/${id}`),
  availability: (id, start, end) => request(`/equipment/${id}/availability${qs({ start, end })}`),
  reviews: (id) => request(`/equipment/${id}/reviews`),
  addReview: (id, data) => request(`/equipment/${id}/reviews`, { method: 'POST', body: data }),

  reserve: (data) => request('/reservations', { method: 'POST', body: data }),
  myReservations: () => request('/reservations/my'),
  cancelReservation: (id) => request(`/reservations/${id}/cancel`, { method: 'POST' }),

  admin: {
    stats: () => request('/admin/stats'),
    equipment: () => request('/admin/equipment'),
    saveEquipment: (id, data) =>
      request(id ? `/admin/equipment/${id}` : '/admin/equipment', { method: id ? 'PUT' : 'POST', body: data }),
    deleteEquipment: (id) => request(`/admin/equipment/${id}`, { method: 'DELETE' }),
    saveCategory: (id, data) =>
      request(id ? `/admin/categories/${id}` : '/admin/categories', { method: id ? 'PUT' : 'POST', body: data }),
    deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
    reservations: () => request('/admin/reservations'),
    setStatus: (id, status) => request(`/admin/reservations/${id}/status`, { method: 'PATCH', body: { status } }),
  },
};
