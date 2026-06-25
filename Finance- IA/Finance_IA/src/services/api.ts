/**
 * API Service Configuration
 * Centralize all backend requests here so you can easily manage
 * endpoints, headers, authentication, and error handling.
 */

// Example base URL for when your Python backend is ready
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic fetcher utility
 */
export async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example API calls
 */
export const auraApi = {
  // Test connection to Python backend
  checkHealth: () => fetcher<{ message: string }>('/'),
  
  // Example for future endpoints:
  // getPortfolio: (userId: string) => fetcher(`/api/portfolio/${userId}`),
  // analyzeRisk: (data: any) => fetcher('/api/analyze', { method: 'POST', body: JSON.stringify(data) }),
};
