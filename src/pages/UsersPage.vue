<template>
  <div class="flex items-start justify-between">
    <Breadcrumbs
      title="Manage Users/Accounts"
      :breadcrumbs="breadcrumbs"
    />
    <button
      class="btn btn-sm flex items-center gap-1"
      :disabled="refreshing"
      @click="refresh"
    >
      <IconRefresh class="w-4 h-4" />
      {{ refreshing ? 'Refreshing…' : 'Refresh' }}
    </button>
  </div>

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

      <div
        v-if="customers.length && customDataColumns.length"
        class="flex flex-wrap gap-3 mb-4"
      >
        <label
          v-for="column in customDataColumns"
          :key="column"
          class="label"
        >
          <span class="label-text">{{ column }}</span>
          <select
            v-model="filters[column]"
            class="form-control"
          >
            <option value="">All</option>
            <option
              v-for="opt in filterOptions[column] ?? []"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="overflow-x-auto">
        <table
          v-if="filteredCustomers.length"
          class="w-full text-left border-collapse text-sm"
        >
          <thead>
            <tr class="border-b bg-gray-50">
              <th class="py-2 pr-4">ID</th>
              <th class="py-2 pr-4">Email</th>
              <th class="py-2 pr-4">First Name</th>
              <th
                :class="customDataColumns.length ? 'py-2 pr-4' : 'py-2'"
              >
                Last Name
              </th>
              <th
                v-for="(column, i) in customDataColumns"
                :key="column"
                :class="i === customDataColumns.length - 1 ? 'py-2' : 'py-2 pr-4'"
              >
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="border-b cursor-pointer hover:bg-gray-50"
              @click="goToCustomer(customer.id)"
            >
              <td class="py-2 pr-4">{{ customer.id }}</td>
              <td class="py-2 pr-4">{{ customer.email }}</td>
              <td class="py-2 pr-4">{{ customer.firstName }}</td>
              <td :class="customDataColumns.length ? 'py-2 pr-4' : 'py-2'">
                {{ customer.lastName }}
              </td>
              <td
                v-for="(column, i) in customDataColumns"
                :key="column"
                :class="i === customDataColumns.length - 1 ? 'py-2' : 'py-2 pr-4'"
              >
                {{ formatCustomValue(customer.legacyCustomData?.[column]) }}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-else-if="customers.length"
          class="alert alert-info"
        >
          No customers match the selected filters.
        </div>

        <div
          v-else-if="!loading && !error && requested"
          class="alert alert-info"
        >
          No customers returned.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import IconRefresh from '~icons/panel/refresh';
import { adminApi, ApiError } from '@/api';

const STATE_STORAGE_KEY = 'addon-demo-b2b:users-page-state';
const CUSTOM_DATA_STORAGE_KEY = 'addon-demo-b2b:user-custom-data';
const NULL_SENTINEL = '__null__';

type CustomDataItem = { name: string };

const readCustomDataNames = (): string[] => {
    try {
        const raw = localStorage.getItem(CUSTOM_DATA_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((entry): string => {
                if (typeof entry === 'string') return entry.trim();
                if (entry && typeof entry === 'object') return String((entry as CustomDataItem).name ?? '').trim();
                return '';
            })
            .filter(Boolean);
    } catch {
        return [];
    }
};

const stringifyCustomValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '';
    if (Array.isArray(value)) return value.map((v) => stringifyCustomValue(v)).filter(Boolean).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

type ShopRow = { key: string; name: string };
type CountryRow = { countryCode: string };

type CustomerRow = {
    id: string | number;
    email: string;
    firstName: string;
    lastName: string;
    legacyCustomData?: Record<string, unknown>;
};

type PersistedState = {
    shops: ShopRow[];
    countries: CountryRow[];
    shopKey: string;
    countryCode: string;
    customers: CustomerRow[];
    requested: boolean;
    customDataFilters?: Record<string, string>;
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

    components: { Breadcrumbs, IconRefresh },

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

        const customDataColumns = ref<string[]>([]);
        const filters = reactive<Record<string, string>>({});

        const syncFilterKeys = () => {
            const columnSet = new Set(customDataColumns.value);
            for (const key of Object.keys(filters)) {
                if (!columnSet.has(key)) delete filters[key];
            }
            for (const col of customDataColumns.value) {
                if (filters[col] === undefined) filters[col] = '';
            }
        };

        const reloadCustomDataColumns = () => {
            customDataColumns.value = readCustomDataNames();
            syncFilterKeys();
        };

        const filterOptions = computed(() => {
            const options: Record<string, Array<{ value: string; label: string }>> = {};
            for (const column of customDataColumns.value) {
                const seen = new Set<string>();
                const entries: Array<{ value: string; label: string }> = [];
                for (const customer of customers.value) {
                    const raw = customer.legacyCustomData?.[column];
                    const stringified = stringifyCustomValue(raw);
                    const key = stringified === '' ? NULL_SENTINEL : stringified;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    entries.push({ value: key, label: key === NULL_SENTINEL ? '(none)' : stringified });
                }
                entries.sort((a, b) => {
                    if (a.value === NULL_SENTINEL) return 1;
                    if (b.value === NULL_SENTINEL) return -1;
                    return a.label.localeCompare(b.label);
                });
                options[column] = entries;
            }
            return options;
        });

        const filteredCustomers = computed(() =>
            customers.value.filter((customer) => {
                for (const column of customDataColumns.value) {
                    const selected = filters[column];
                    if (!selected) continue;
                    const raw = customer.legacyCustomData?.[column];
                    const stringified = stringifyCustomValue(raw);
                    const normalized = stringified === '' ? NULL_SENTINEL : stringified;
                    if (normalized !== selected) return false;
                }
                return true;
            }),
        );

        const formatCustomValue = (value: unknown): string => {
            const str = stringifyCustomValue(value);
            return str === '' ? '—' : str;
        };

        const saveState = () => {
            writeState({
                shops: shops.value,
                countries: countries.value,
                shopKey: shopKey.value,
                countryCode: countryCode.value,
                customers: customers.value,
                requested: requested.value,
                customDataFilters: { ...filters },
            });
        };

        watch(
            filters,
            () => {
                if (customers.value.length) saveState();
            },
            { deep: true },
        );

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
            for (const key of Object.keys(filters)) filters[key] = '';
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
                const payload = await adminApi().get<EntitiesPayload<Record<string, unknown>>>(path, {
                    query: { with: 'legacyCustomData' },
                });
                customers.value = toList(payload).map((c) => ({
                    id: (c.id as string | number) ?? '',
                    email: (c.email as string) ?? '',
                    firstName: (c.firstName as string) ?? '',
                    lastName: (c.lastName as string) ?? '',
                    legacyCustomData: (c.legacyCustomData as Record<string, unknown>) ?? undefined,
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

        const refreshing = ref(false);
        const refresh = async () => {
            refreshing.value = true;
            try {
                reloadCustomDataColumns();
                await loadShops();
                if (shopKey.value) {
                    await loadCountries(shopKey.value);
                }
                if (shopKey.value && countryCode.value) {
                    await loadCustomers();
                }
            } finally {
                refreshing.value = false;
            }
        };

        onMounted(async () => {
            reloadCustomDataColumns();
            const cached = readState();
            if (cached) {
                shops.value = cached.shops ?? [];
                countries.value = cached.countries ?? [];
                shopKey.value = cached.shopKey ?? '';
                countryCode.value = cached.countryCode ?? '';
                customers.value = cached.customers ?? [];
                requested.value = cached.requested ?? false;
                if (cached.customDataFilters) {
                    for (const [k, v] of Object.entries(cached.customDataFilters)) {
                        if (k in filters) filters[k] = v;
                    }
                }
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
            refreshing,
            refresh,
            customDataColumns,
            filters,
            filterOptions,
            filteredCustomers,
            formatCustomValue,
        };
    },
});
</script>
