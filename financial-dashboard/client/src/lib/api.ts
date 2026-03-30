const API_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const authApi = {
  register: (email: string, password: string, name?: string, companyName?: string) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, companyName }),
    }),
  login: (email: string, password: string) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => fetchWithAuth('/auth/me'),
};

export const accountsApi = {
  getAll: () => fetchWithAuth('/accounts'),
  getById: (id: string) => fetchWithAuth(`/accounts/${id}`),
  create: (data: { name: string; type: string; currency?: string; initialBalance?: number; description?: string }) =>
    fetchWithAuth('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; type?: string; currency?: string; description?: string; isActive?: boolean }) =>
    fetchWithAuth(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/accounts/${id}`, { method: 'DELETE' }),
};

export const transactionsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchWithAuth(`/transactions${query}`);
  },
  getById: (id: string) => fetchWithAuth(`/transactions/${id}`),
  create: (data: {
    accountId: string;
    categoryId?: string;
    description: string;
    amount: number;
    currency?: string;
    transactionDate: string;
    transactionType: string;
    tags?: string[];
  }) =>
    fetchWithAuth('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/transactions/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  getAll: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return fetchWithAuth(`/categories${query}`);
  },
  create: (data: { name: string; type: string; color?: string; icon?: string }) =>
    fetchWithAuth('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; color?: string; icon?: string }) =>
    fetchWithAuth(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/categories/${id}`, { method: 'DELETE' }),
};

export const collaborationApi = {
  // Dashboard management
  getDashboards: () => fetchWithAuth('/collaboration/dashboards'),
  createDashboard: (data: { name: string; description?: string; memberEmails: string[] }) =>
    fetchWithAuth('/collaboration/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Invitations
  inviteCollaborator: (dashboardId: string, email: string, role: string = 'viewer') =>
    fetchWithAuth(`/collaboration/dashboards/${dashboardId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  acceptInvitation: (dashboardId: string) =>
    fetchWithAuth(`/collaboration/invitations/${dashboardId}/accept`, {
      method: 'POST',
    }),
  declineInvitation: (dashboardId: string) =>
    fetchWithAuth(`/collaboration/invitations/${dashboardId}/decline`, {
      method: 'POST',
    }),
  markNotificationAsRead: (notificationId: string) =>
    fetchWithAuth(`/collaboration/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),

  // Notifications
  getNotifications: () => fetchWithAuth('/collaboration/notifications'),

  // Shared dashboard data
  getSharedDashboardData: (dashboardId: string) =>
    fetchWithAuth(`/collaboration/dashboards/${dashboardId}/data`),
};

export const budgetsApi = {
  getAll: () => fetchWithAuth('/budgets'),
  create: (data: {
    categoryId?: string;
    name: string;
    amount: number;
    period: string;
    startDate: string;
    endDate?: string;
    alertThreshold?: number;
  }) =>
    fetchWithAuth('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/budgets/${id}`, { method: 'DELETE' }),
};

export const investmentsApi = {
  getAll: () => fetchWithAuth('/investments'),
  create: (data: {
    accountId?: string;
    symbol: string;
    name: string;
    assetType: string;
    quantity: number;
    avgCostBasis?: number;
    currentPrice?: number;
    currency?: string;
    purchaseDate?: string;
  }) =>
    fetchWithAuth('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/investments/${id}`, { method: 'DELETE' }),
};

export const analyticsApi = {
  getSummary: () => fetchWithAuth('/analytics/summary'),
  getSpendingByCategory: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params}` : '';
    return fetchWithAuth(`/analytics/spending-by-category${query}`);
  },
  getMonthly: (months?: number) =>
    fetchWithAuth(`/analytics/monthly${months ? `?months=${months}` : ''}`),
  getAccountBalances: () => fetchWithAuth('/analytics/account-balances'),
};

export const chatApi = {
  getSessions: () => fetchWithAuth('/chat/sessions'),
  getSession: (id: string) => fetchWithAuth(`/chat/sessions/${id}`),
  createSession: (title?: string) =>
    fetchWithAuth('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  sendMessage: (sessionId: string, content: string) =>
    fetchWithAuth(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deleteSession: (id: string) =>
    fetchWithAuth(`/chat/sessions/${id}`, { method: 'DELETE' }),
};

export const filesApi = {
  getAll: () => fetchWithAuth('/files'),
  getById: (id: string) => fetchWithAuth(`/files/${id}`),
  delete: (id: string) => fetchWithAuth(`/files/${id}`, { method: 'DELETE' }),
};
