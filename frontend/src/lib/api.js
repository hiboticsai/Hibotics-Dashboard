const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Dashboard APIs
export const dashboardApi = {
  getKPIs: (companyId) => 
    apiFetch(`/dashboard/kpis${companyId ? `?company_id=${companyId}` : ''}`),
  
  getCallTrends: (companyId, days = 30) => 
    apiFetch(`/dashboard/call-trends?days=${days}${companyId ? `&company_id=${companyId}` : ''}`),
  
  getOutcomeDistribution: (companyId) => 
    apiFetch(`/dashboard/outcome-distribution${companyId ? `?company_id=${companyId}` : ''}`)
};

// Companies APIs
export const companiesApi = {
  list: () => apiFetch('/companies'),
  
  get: (companyId) => apiFetch(`/companies/${companyId}`),
  
  getBySlug: (slug) => apiFetch(`/companies/slug/${slug}`),
  
  create: (data) => apiFetch('/companies', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (companyId, data) => apiFetch(`/companies/${companyId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (companyId) => apiFetch(`/companies/${companyId}`, {
    method: 'DELETE'
  })
};

// Agents APIs
export const agentsApi = {
  list: (companyId) => 
    apiFetch(`/agents${companyId ? `?company_id=${companyId}` : ''}`),
  
  create: (companyId, data) => apiFetch(`/agents?company_id=${companyId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (agentId, data) => apiFetch(`/agents/${agentId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (agentId) => apiFetch(`/agents/${agentId}`, {
    method: 'DELETE'
  })
};

// Calls APIs
export const callsApi = {
  list: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.append('company_id', params.companyId);
    if (params.outcome) queryParams.append('outcome', params.outcome);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    
    const query = queryParams.toString();
    return apiFetch(`/calls${query ? `?${query}` : ''}`);
  },
  
  get: (callId) => apiFetch(`/calls/${callId}`),
  
  create: (companyId, data) => apiFetch(`/calls?company_id=${companyId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Leads APIs
export const leadsApi = {
  list: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.append('company_id', params.companyId);
    if (params.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return apiFetch(`/leads${query ? `?${query}` : ''}`);
  },
  
  get: (leadId) => apiFetch(`/leads/${leadId}`),
  
  create: (companyId, data) => apiFetch(`/leads?company_id=${companyId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (leadId, data) => apiFetch(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (leadId) => apiFetch(`/leads/${leadId}`, {
    method: 'DELETE'
  })
};

// Social Accounts APIs
export const socialAccountsApi = {
  list: (companyId) => 
    apiFetch(`/social-accounts${companyId ? `?company_id=${companyId}` : ''}`),
  
  create: (companyId, data) => apiFetch(`/social-accounts?company_id=${companyId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  delete: (accountId) => apiFetch(`/social-accounts/${accountId}`, {
    method: 'DELETE'
  })
};

// Social Metrics APIs
export const socialMetricsApi = {
  list: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.append('company_id', params.companyId);
    if (params.socialAccountId) queryParams.append('social_account_id', params.socialAccountId);
    
    const query = queryParams.toString();
    return apiFetch(`/social-metrics${query ? `?${query}` : ''}`);
  }
};

// Billing APIs
export const billingApi = {
  list: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.append('company_id', params.companyId);
    if (params.paymentStatus) queryParams.append('payment_status', params.paymentStatus);
    
    const query = queryParams.toString();
    return apiFetch(`/billing${query ? `?${query}` : ''}`);
  },
  
  create: (companyId, data) => apiFetch(`/billing?company_id=${companyId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (billingId, data) => apiFetch(`/billing/${billingId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// Users APIs
export const usersApi = {
  list: (companyId) => 
    apiFetch(`/users${companyId ? `?company_id=${companyId}` : ''}`),
  
  create: (data) => apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  delete: (userId) => apiFetch(`/users/${userId}`, {
    method: 'DELETE'
  })
};

// Admin APIs
export const adminApi = {
  getStats: () => apiFetch('/admin/stats'),
  
  getCompaniesPerformance: () => apiFetch('/admin/companies-performance')
};

// Reports APIs
export const reportsApi = {
  downloadPdf: async (companyId, reportType = 'weekly') => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      `${API}/reports/generate-pdf?report_type=${reportType}${companyId ? `&company_id=${companyId}` : ''}`,
      {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hibotics_report_${reportType}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

// Seed database
export const seedDatabase = () => apiFetch('/seed', { method: 'POST' });

export default {
  dashboardApi,
  companiesApi,
  agentsApi,
  callsApi,
  leadsApi,
  socialAccountsApi,
  socialMetricsApi,
  billingApi,
  usersApi,
  adminApi,
  reportsApi,
  seedDatabase
};
