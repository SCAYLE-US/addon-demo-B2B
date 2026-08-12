import type { AddOnCustomProps } from '@scayle/add-on-utils';

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
    readonly NUXT_ADMIN_API_HOST?: string;
    readonly NUXT_ADMIN_API_TOKEN?: string;
    readonly NUXT_STOREFRONT_SAPI_HOST?: string;
    readonly NUXT_STOREFRONT_SAPI_TOKEN?: string;
}

declare const __DEV_SERVER_ORIGIN__: string;

// TODO: Could this be added to the add-on-utils and added automatically?
// How does vue-router do it?
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $addOn: AddOnCustomProps
    }
}
