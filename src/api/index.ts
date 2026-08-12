import { createApiClient, type ApiClient } from './client';

const adminHost = import.meta.env.DEV
    ? `${__DEV_SERVER_ORIGIN__}/proxy/admin/`
    : (import.meta.env.NUXT_STOREFRONT_API_HOST as string | undefined);
const adminToken = import.meta.env.NUXT_STOREFRONT_API_TOKEN as string | undefined;
const sapiHost = import.meta.env.DEV
    ? `${__DEV_SERVER_ORIGIN__}/proxy/sapi/`
    : (import.meta.env.NUXT_STOREFRONT_SAPI_HOST as string | undefined);
const sapiToken = import.meta.env.NUXT_STOREFRONT_SAPI_TOKEN as string | undefined;

let _adminApi: ApiClient | null = null;
let _storefrontApi: ApiClient | null = null;

export const adminApi = (): ApiClient => {
    if (!_adminApi) {
        if (!adminHost) throw new Error('NUXT_STOREFRONT_API_HOST is not set');
        _adminApi = createApiClient({
            host: adminHost,
            defaultHeaders: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
    }
    return _adminApi;
};

export const storefrontApi = (): ApiClient => {
    if (!_storefrontApi) {
        if (!sapiHost) throw new Error('NUXT_STOREFRONT_SAPI_HOST is not set');
        _storefrontApi = createApiClient({
            host: sapiHost,
            defaultHeaders: sapiToken ? { 'X-Access-Token': sapiToken } : {},
        });
    }
    return _storefrontApi;
};

export { ApiError } from './client';
export type { ApiClient, HttpMethod, RequestOptions } from './client';
