const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('token') || localStorage.getItem('volunteerToken');

  const headers = {
    ...options.headers,
  };

  // Only add Content-Type: application/json if not sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && !(config.body instanceof FormData) && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type');
    
    // Handle binary responses (PDF, ZIP, CSV)
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/zip') || contentType.includes('text/csv'))) {
      if (!res.ok) {
        throw new Error(`Download failed with status ${res.status}`);
      }
      return await res.blob();
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),
  upload: (endpoint, formData, options) => apiRequest(endpoint, { method: 'POST', body: formData, ...options }),
};
