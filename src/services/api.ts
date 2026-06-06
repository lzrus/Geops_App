/**
 * API Client Service
 * Handles all HTTP requests to the backend server
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Generic fetch wrapper
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Categories API
export const categoriesAPI = {
  getAll: () => fetchAPI('/categories'),
  create: (data: any) => fetchAPI('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

// Products API
export const productsAPI = {
  getAll: () => fetchAPI('/products'),
  create: (data: any) => fetchAPI('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Sales API
export const salesAPI = {
  getAll: () => fetchAPI('/sales'),
  create: (data: any) => fetchAPI('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/sales/${id}`, {
    method: 'DELETE',
  }),
};

// Expenses API
export const expensesAPI = {
  getAll: () => fetchAPI('/expenses'),
  create: (data: any) => fetchAPI('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

// Stock Entries API
export const stockEntriesAPI = {
  getAll: () => fetchAPI('/stock-entries'),
  create: (data: any) => fetchAPI('/stock-entries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => fetchAPI('/sessions'),
  create: (data: any) => fetchAPI('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  close: (id: string, data: any) => fetchAPI(`/sessions/${id}/close`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
