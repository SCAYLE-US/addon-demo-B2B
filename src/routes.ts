import { RouteRecordRaw } from 'vue-router';
import { GroupRouteDefinition } from './types';
import { ADD_ON_ID, BASE_URL, generateGroupName } from './utils';

// Use dynamic imports to enable code-splitting
const DashboardPage = () => import('./pages/DashboardPage.vue');
const AlertsPage = () => import('./pages/AlertsPage.vue');
const FormPage = () => import('./pages/FormPage.vue');
const TableListing = () => import('./pages/TableListing.vue');
const ProductsPage = () => import('./components/ProductsListing/ProductsPage.vue');
const TableListingDetail = () => import('./pages/TableListingDetail.vue');
const ComponentsPage = () => import('./pages/ComponentsPage.vue');
const SavedCartsPage = () => import('./pages/SavedCartsPage.vue');
const UsersPage = () => import('./pages/UsersPage.vue');
const UserCompaniesPage = () => import('./pages/UserCompaniesPage.vue');
const UserCustomerGroupsPage = () => import('./pages/UserCustomerGroupsPage.vue');
const UserCustomDataPage = () => import('./pages/UserCustomDataPage.vue');
const CustomerDetailPage = () => import('./pages/CustomerDetailPage.vue');
const PriceListsPage = () => import('./pages/PriceListsPage.vue');

export type AddOnRoute = Omit<RouteRecordRaw, "meta"> & { meta: GroupRouteDefinition };

export const routes: AddOnRoute[] = [
    {
        name: 'dashboard',
        path: '/',
        component: DashboardPage,
        meta: {
            id: 'dashboard',
            name: {
                'en': 'Dashboard',
                'de': 'Armaturenbrett'
            },
            icon: 'dashboard',
            path: BASE_URL + '/',
            sidebar: null,
            group: generateGroupName('general'),
        }
    },
    {
        path: '/table-listing',
        component: TableListing,
        redirect: { name: "products-page" },
        children: [
            {
                name: "products-page",
                path: "list",
                component: ProductsPage,
            },
            {
                name: "product-detail",
                path: ":id",
                component: TableListingDetail
            }
        ],
        meta: {
            id: 'table-listing',
            name: {
                'en': 'Table Listing',
                'de': 'Tabellenauflistung'
            },
            icon: 'data-table',
            path: BASE_URL + '/table-listing',
            sidebar: null,
            group: generateGroupName('general'),
        }
    },
    {
        path: '/form',
        component: FormPage,
        meta: {
            id: 'form',
            name: {
                'en': 'Form',
                'de': 'Form'
            },
            icon: 'search',
            path: BASE_URL + '/form',
            sidebar: null,
            group: generateGroupName('general'),
        }
    },
    {
        path: '/alerts',
        component: AlertsPage,
        meta: {
            id: 'alerts',
            name: {
                'en': 'Alerts',
                'de': 'Alerts'
            },
            icon: 'warning',
            path: BASE_URL + '/alerts',
            sidebar: null,
            group: generateGroupName('general'),
        }
    },
    {
        path: '/components',
        component: ComponentsPage,
        meta: {
            id: 'components',
            name: {
                'en': 'Components',
                'de': 'Components'
            },
            icon: 'ufo',
            path: BASE_URL + '/components',
            sidebar: null,
            group: generateGroupName('general'),
        }
    },
    {
        path: '/users',
        component: UsersPage,
        meta: {
            id: 'users',
            name: {
                'en': 'Manage Users/Account',
                'de': 'Benutzer/Konto verwalten'
            },
            icon: 'users',
            path: BASE_URL + '/users',
            sidebar: ADD_ON_ID,
            group: generateGroupName('b2b'),
        }
    },
    {
        path: '/users/customer-groups',
        component: UserCustomerGroupsPage,
        meta: {
            id: 'users-customer-groups',
            name: {
                'en': 'Manage Customer Groups',
                'de': 'Kundengruppen verwalten'
            },
            icon: 'users',
            path: BASE_URL + '/users/customer-groups',
            sidebar: null,
            group: generateGroupName('b2b'),
        }
    },
    {
        path: '/users/custom-data',
        component: UserCustomDataPage,
        meta: {
            id: 'users-custom-data',
            name: {
                'en': 'Manage Custom Data',
                'de': 'Benutzerdaten verwalten'
            },
            icon: 'data-table',
            path: BASE_URL + '/users/custom-data',
            sidebar: null,
            group: generateGroupName('b2b'),
        }
    },
    {
        name: 'customer-detail',
        path: '/customers/:shopKey/:countryCode/:id',
        component: CustomerDetailPage,
        meta: {
            id: 'customer-detail',
            name: {
                'en': 'Customer Detail',
                'de': 'Kundendetails'
            },
            icon: 'users',
            path: BASE_URL + '/customers',
            sidebar: null,
            group: generateGroupName('b2b'),
        }
    },
    {
        path: '/companies',
        component: UserCompaniesPage,
        meta: {
            id: 'companies',
            name: {
                'en': 'Manage Business Accounts',
                'de': 'Geschäftskonten verwalten'
            },
            icon: 'store',
            path: BASE_URL + '/companies',
            sidebar: ADD_ON_ID,
            group: generateGroupName('b2b'),
        }
    },
    {
        path: '/price-lists',
        component: PriceListsPage,
        meta: {
            id: 'price-lists',
            name: {
                'en': 'Price Lists',
                'de': 'Preislisten'
            },
            icon: 'data-table',
            path: BASE_URL + '/price-lists',
            sidebar: ADD_ON_ID,
            group: generateGroupName('b2b'),
        }
    },
    {
        path: '/saved-carts',
        component: SavedCartsPage,
        meta: {
            id: 'saved-carts',
            name: {
                'en': 'Manage Saved Carts',
                'de': 'Gespeicherte Warenkörbe verwalten'
            },
            icon: 'basket',
            path: BASE_URL + '/saved-carts',
            sidebar: ADD_ON_ID,
            group: generateGroupName('b2b'),
        }
    },
];
