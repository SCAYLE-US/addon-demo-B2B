export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
};

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

export type ApiClient = {
    request<T = unknown>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T>;
    get<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
    post<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
    put<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
    patch<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
    delete<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
};

const joinUrl = (host: string, path: string) => {
    const base = host.endsWith('/') ? host : host + '/';
    const rel = path.startsWith('/') ? path.slice(1) : path;
    return base + rel;
};

const appendQuery = (url: string, query?: RequestOptions['query']) => {
    if (!query) return url;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        params.append(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
};

export function createApiClient({
    host,
    defaultHeaders = {},
}: {
    host: string;
    defaultHeaders?: Record<string, string>;
}): ApiClient {
    if (!host) {
        throw new Error('API client requires a host');
    }

    const request = async <T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> => {
        const url = appendQuery(joinUrl(host, path), options.query);
        const headers: Record<string, string> = {
            Accept: 'application/json',
            ...defaultHeaders,
            ...options.headers,
        };

        let body: BodyInit | undefined;
        if (options.body !== undefined && method !== 'GET') {
            body = JSON.stringify(options.body);
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }

        const response = await fetch(url, { method, headers, body, signal: options.signal });

        const raw = await response.text();
        let parsed: unknown = raw;
        if (raw && response.headers.get('content-type')?.includes('application/json')) {
            try {
                parsed = JSON.parse(raw);
            } catch {
                // leave as raw text
            }
        }

        if (!response.ok) {
            throw new ApiError(`${method} ${path} failed with ${response.status}`, response.status, parsed);
        }

        return parsed as T;
    };

    return {
        request,
        get: (path, options) => request('GET', path, options),
        post: (path, options) => request('POST', path, options),
        put: (path, options) => request('PUT', path, options),
        patch: (path, options) => request('PATCH', path, options),
        delete: (path, options) => request('DELETE', path, options),
    };
}
