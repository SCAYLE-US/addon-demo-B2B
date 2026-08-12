<template>
  <Breadcrumbs
    title="Manage Users/Accounts"
    :breadcrumbs="breadcrumbs"
  />

  <nav class="flex gap-4 border-b mb-4">
    <router-link
      v-for="item in subNav"
      :key="item.to"
      :to="item.to"
      class="py-2 px-1 border-b-2 border-transparent hover:text-primary hover:border-primary"
    >
      {{ item.label }}
    </router-link>
  </nav>

  <div class="card">
    <div class="card-header">
      Admin API — Customers
    </div>
    <div class="card-body">
      <div class="flex flex-wrap items-end gap-2 mb-4">
        <label class="label">
          <span class="label-text">Shop</span>
          <select
            v-model="shopKey"
            class="form-control"
            :disabled="shopsLoading || !shops.length"
            @change="onShopChange"
          >
            <option value="">
              {{ shopsLoading ? 'Loading shops…' : 'Select a shop' }}
            </option>
            <option
              v-for="shop in shops"
              :key="shop.key"
              :value="shop.key"
            >
              {{ shop.name }}
            </option>
          </select>
        </label>

        <label class="label">
          <span class="label-text">Country Code</span>
          <select
            v-model="countryCode"
            class="form-control"
            :disabled="!shopKey || countriesLoading || !countries.length"
          >
            <option value="">
              {{ countriesLoading ? 'Loading countries…' : 'Select a country' }}
            </option>
            <option
              v-for="country in countries"
              :key="country.countryCode"
              :value="country.countryCode"
            >
              {{ country.countryCode }}
            </option>
          </select>
        </label>

        <button
          class="btn"
          :disabled="loading || !shopKey || !countryCode"
          @click="loadCustomers"
        >
          {{ loading ? 'Loading…' : 'Get Customers' }}
        </button>
      </div>

      <div
        v-if="error"
        class="alert alert-error"
      >
        <div>{{ error }}</div>
        <pre
          v-if="errorBody"
          class="mt-2 whitespace-pre-wrap text-xs"
        >{{ errorBody }}</pre>
      </div>

      <table
        v-if="customers.length"
        class="w-full text-left border-collapse"
      >
        <thead>
          <tr class="border-b">
            <th class="py-2 pr-4">ID</th>
            <th class="py-2 pr-4">Email</th>
            <th class="py-2 pr-4">First Name</th>
            <th class="py-2">Last Name</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="customer in customers"
            :key="customer.id"
            class="border-b cursor-pointer hover:bg-gray-50"
            @click="goToCustomer(customer.id)"
          >
            <td class="py-2 pr-4">{{ customer.id }}</td>
            <td class="py-2 pr-4">{{ customer.email }}</td>
            <td class="py-2 pr-4">{{ customer.firstName }}</td>
            <td class="py-2">{{ customer.lastName }}</td>
          </tr>
        </tbody>
      </table>

      <div
        v-else-if="!loading && !error && requested"
        class="alert alert-info"
      >
        No customers returned.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import { adminApi, ApiError } from '@/api';

const STATE_STORAGE_KEY = 'addon-demo-b2b:users-page-state';

type ShopRow = { key: string; name: string };
type CountryRow = { countryCode: string };

type CustomerRow = {
    id: string | number;
    email: string;
    firstName: string;
    lastName: string;
};

type PersistedState = {
    shops: ShopRow[];
    countries: CountryRow[];
    shopKey: string;
    countryCode: string;
    customers: CustomerRow[];
    requested: boolean;
};

const readState = (): PersistedState | null => {
    try {
        const raw = sessionStorage.getItem(STATE_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as PersistedState) : null;
    } catch {
        return null;
    }
};

const writeState = (state: PersistedState) => {
    try {
        sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Quota exceeded — ignore.
    }
};

type EntitiesPayload<T> = { entities?: T[]; data?: T[] } | T[];

const toList = <T,>(payload: EntitiesPayload<T>): T[] => {
    if (Array.isArray(payload)) return payload;
    return payload.entities ?? payload.data ?? [];
};

const formatError = (e: unknown, errorRef: { value: string | null }, bodyRef: { value: string | null }) => {
    if (e instanceof ApiError) {
        errorRef.value = e.message;
        bodyRef.value = typeof e.body === 'string' ? e.body : JSON.stringify(e.body, null, 2);
    } else if (e instanceof Error) {
        errorRef.value = e.message;
    } else {
        errorRef.value = 'Unknown error';
    }
};

export default defineComponent({
    name: 'UsersPage',

    components: { Breadcrumbs },

    setup() {
        const router = useRouter();
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Users/Accounts' },
        ];

        const subNav = [
            { to: '/users/customer-groups', label: 'Manage Customer Groups' },
            { to: '/users/custom-data', label: 'Manage Custom Data' },
        ];

        const shops = ref<ShopRow[]>([]);
        const countries = ref<CountryRow[]>([]);
        const customers = ref<CustomerRow[]>([]);

        const shopKey = ref('');
        const countryCode = ref('');

        const shopsLoading = ref(false);
        const countriesLoading = ref(false);
        const loading = ref(false);
        const requested = ref(false);

        const error = ref<string | null>(null);
        const errorBody = ref<string | null>(null);

        const saveState = () => {
            writeState({
                shops: shops.value,
                countries: countries.value,
                shopKey: shopKey.value,
                countryCode: countryCode.value,
                customers: customers.value,
                requested: requested.value,
            });
        };

        const loadShops = async () => {
            shopsLoading.value = true;
            error.value = null;
            errorBody.value = null;
            try {
                const payload = await adminApi().get<EntitiesPayload<Record<string, unknown>>>('shops');
                shops.value = toList(payload).map((s) => ({
                    key: (s.key as string) ?? '',
                    name: (s.name as string) ?? '',
                }));
                saveState();
            } catch (e) {
                shops.value = [];
                formatError(e, error, errorBody);
            } finally {
                shopsLoading.value = false;
            }
        };

        const loadCountries = async (key: string) => {
            countriesLoading.value = true;
            error.value = null;
            errorBody.value = null;
            try {
                const payload = await adminApi().get<EntitiesPayload<Record<string, unknown>>>(
                    `shops/${encodeURIComponent(key)}/countries`,
                );
                countries.value = toList(payload).map((c) => ({
                    countryCode: (c.countryCode as string) ?? '',
                }));
                saveState();
            } catch (e) {
                countries.value = [];
                formatError(e, error, errorBody);
            } finally {
                countriesLoading.value = false;
            }
        };

        const onShopChange = () => {
            countryCode.value = '';
            countries.value = [];
            customers.value = [];
            requested.value = false;
            saveState();
            if (shopKey.value) {
                loadCountries(shopKey.value);
            }
        };

        const loadCustomers = async () => {
            if (!shopKey.value || !countryCode.value) return;
            loading.value = true;
            error.value = null;
            errorBody.value = null;
            requested.value = true;
            try {
                const path = `shops/${encodeURIComponent(shopKey.value)}/countries/${encodeURIComponent(countryCode.value)}/customers`;
                const payload = await adminApi().get<EntitiesPayload<Record<string, unknown>>>(path);
                customers.value = toList(payload).map((c) => ({
                    id: (c.id as string | number) ?? '',
                    email: (c.email as string) ?? '',
                    firstName: (c.firstName as string) ?? '',
                    lastName: (c.lastName as string) ?? '',
                }));
                saveState();
            } catch (e) {
                customers.value = [];
                formatError(e, error, errorBody);
            } finally {
                loading.value = false;
            }
        };

        const goToCustomer = (id: string | number) => {
            router.push({
                name: 'customer-detail',
                params: {
                    shopKey: shopKey.value,
                    countryCode: countryCode.value,
                    id: String(id),
                },
            });
        };

        onMounted(async () => {
            const cached = readState();
            if (cached) {
                shops.value = cached.shops ?? [];
                countries.value = cached.countries ?? [];
                shopKey.value = cached.shopKey ?? '';
                countryCode.value = cached.countryCode ?? '';
                customers.value = cached.customers ?? [];
                requested.value = cached.requested ?? false;
            }
            if (!shops.value.length) {
                await loadShops();
            }
            if (shopKey.value && !countries.value.length) {
                await loadCountries(shopKey.value);
            }
        });

        return {
            breadcrumbs,
            subNav,
            shops,
            countries,
            customers,
            shopKey,
            countryCode,
            shopsLoading,
            countriesLoading,
            loading,
            requested,
            error,
            errorBody,
            onShopChange,
            loadCustomers,
            goToCustomer,
        };
    },
});
</script>
