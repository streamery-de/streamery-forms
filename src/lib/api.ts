/**
 * API utility functions for Streamery Forms
 */

declare const streameryForms: {
  apiUrl: string;
};

const API_BASE_URL = streameryForms?.apiUrl || '';
const API_NAMESPACE = 'streamery-forms/v1';

/**
 * Get the full API URL for an endpoint.
 *
 * The endpoint may carry its own query string (e.g. "providers/get?is_active=true"),
 * and the base URL may *already* be a query string: on a site with plain
 * permalinks, rest_url() returns "https://example.com/index.php?rest_route=/"
 * rather than "https://example.com/wp-json/".
 *
 * Concatenating the two naively produced a second "?" in that case, so
 * WordPress parsed the whole thing -- filters included -- as the route name and
 * answered 404 rest_no_route. Every request that passes a filter (the provider
 * list, entry filtering, ...) silently returned nothing on those sites.
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const separatorIndex = cleanEndpoint.indexOf('?');
  const path = separatorIndex === -1 ? cleanEndpoint : cleanEndpoint.slice(0, separatorIndex);
  const query = separatorIndex === -1 ? '' : cleanEndpoint.slice(separatorIndex + 1);

  const url = `${API_BASE_URL}${API_NAMESPACE}/${path}`;

  if (!query) {
    return url;
  }

  // Append with "&" when the base already opened a query string.
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

/**
 * Make an API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  // Get WordPress REST API nonce
  const nonce = (window as any).wpApiSettings?.nonce || (window as any).streameryForms?.nonce || '';
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add nonce header if available
  if (nonce) {
    (defaultHeaders as Record<string, string>)['X-WP-Nonce'] = nonce;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`,
    }));
    
    // WordPress REST API error format: { code, message, data: { status } }
    // WP_Error objects are returned as: { code: string, message: string, data: { status: number } }
    const errorMessage = error.message || error.code || `HTTP error! status: ${response.status}`;
    const apiError = new Error(errorMessage);
    (apiError as any).response = response;
    (apiError as any).errorData = error;
    (apiError as any).status = response.status;
    throw apiError;
  }

  return response.json();
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  per_page?: number;
}

export interface ApiError {
  code: string;
  message: string;
  data?: {
    status?: number;
  };
}

