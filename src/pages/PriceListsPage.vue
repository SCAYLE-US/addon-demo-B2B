<template>
  <div class="flex items-start justify-between">
    <Breadcrumbs
      title="Price Lists"
      :breadcrumbs="breadcrumbs"
    />
    <button
      class="btn btn-sm flex items-center gap-1"
      :disabled="loading"
      @click="refresh"
    >
      <IconRefresh class="w-4 h-4" />
      {{ loading ? 'Refreshing…' : 'Refresh' }}
    </button>
  </div>

  <div class="card">
    <div class="card-header">
      Price Lists
    </div>
    <div class="card-body">
      <div
        v-if="loading"
        class="alert alert-info"
      >
        Loading products…
      </div>

      <div
        v-else-if="error"
        class="alert alert-error"
      >
        <div>{{ error }}</div>
        <pre
          v-if="errorBody"
          class="mt-2 whitespace-pre-wrap text-xs"
        >{{ errorBody }}</pre>
      </div>

      <div
        v-else-if="!products.length"
        class="alert alert-info"
      >
        No products returned.
      </div>

      <template v-else>
        <div class="flex flex-wrap gap-3 mb-4">
          <label class="label">
            <span class="label-text">Country</span>
            <select
              v-model="filters.countryCode"
              class="form-control"
            >
              <option value="">All</option>
              <option
                v-for="opt in filterOptions.countryCode"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="label">
            <span class="label-text">Currency</span>
            <select
              v-model="filters.currencyCode"
              class="form-control"
            >
              <option value="">All</option>
              <option
                v-for="opt in filterOptions.currencyCode"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="label">
            <span class="label-text">Group Key</span>
            <select
              v-model="filters.groupKey"
              class="form-control"
            >
              <option value="">All</option>
              <option
                v-for="opt in filterOptions.groupKey"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="label">
            <span class="label-text">Merchant Ref Key</span>
            <select
              v-model="filters.merchantReferenceKey"
              class="form-control"
            >
              <option value="">All</option>
              <option
                v-for="opt in filterOptions.merchantReferenceKey"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="label">
            <span class="label-text">Promotion Key</span>
            <select
              v-model="filters.promotionKey"
              class="form-control"
            >
              <option value="">All</option>
              <option
                v-for="opt in filterOptions.promotionKey"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>

        <div
          v-if="!filteredProducts.length"
          class="alert alert-info"
        >
          No prices match the selected filters.
        </div>

        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b bg-gray-50">
                <th class="py-2 pr-4">Variant</th>
                <th class="py-2 pr-4">Price</th>
                <th class="py-2 pr-4">Old Price</th>
                <th class="py-2 pr-4">RRP</th>
                <th class="py-2 pr-4">Tax</th>
                <th class="py-2 pr-4">Country</th>
                <th class="py-2 pr-4">Currency</th>
                <th class="py-2 pr-4">Group Key</th>
                <th class="py-2 pr-4">Promotion Key</th>
                <th class="py-2 pr-4">Valid From</th>
                <th class="py-2 pr-4">Valid To</th>
                <th class="py-2">Merchant Ref Key</th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="product in filteredProducts"
                :key="product.id"
              >
                <tr class="bg-gray-100">
                  <td
                    colspan="12"
                    class="py-2 pr-4 font-semibold"
                  >
                    {{ productName(product) }}
                  </td>
                </tr>
                <template
                  v-for="variant in product.variants ?? []"
                  :key="variant.id"
                >
                  <tr
                    v-for="(price, priceIndex) in variant.prices ?? []"
                    :key="`${variant.id}-${price.key ?? priceIndex}`"
                    class="border-b"
                  >
                    <td class="py-2 pr-4">
                      <span v-if="priceIndex === 0">Variant {{ variant.id }}</span>
                    </td>
                    <td class="py-2 pr-4">{{ formatCurrency(price.price, price.currencyCode) }}</td>
                    <td class="py-2 pr-4">{{ formatCurrency(price.oldPrice, price.currencyCode) }}</td>
                    <td class="py-2 pr-4">{{ formatCurrency(price.recommendedRetailPrice, price.currencyCode) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.tax) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.countryCode) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.currencyCode) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.groupKey) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.promotionKey) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.validFrom) }}</td>
                    <td class="py-2 pr-4">{{ formatValue(price.validTo) }}</td>
                    <td class="py-2">{{ formatValue(price.merchantReferenceKey) }}</td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import IconRefresh from '~icons/panel/refresh';
import { adminApi, ApiError } from '@/api';

const NULL_SENTINEL = '__null__';
type PriceFilterField = 'countryCode' | 'currencyCode' | 'groupKey' | 'merchantReferenceKey' | 'promotionKey';
const FILTER_FIELDS: PriceFilterField[] = ['countryCode', 'currencyCode', 'groupKey', 'merchantReferenceKey', 'promotionKey'];
const STATE_STORAGE_KEY = 'addon-demo-b2b:price-lists-state';

type Price = {
    key?: string;
    price?: number | null;
    oldPrice?: number | null;
    recommendedRetailPrice?: number | null;
    tax?: number | null;
    countryCode?: string | null;
    currencyCode?: string | null;
    groupKey?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
    merchantReferenceKey?: string | null;
    promotionKey?: string | null;
};

type Variant = {
    id: number | string;
    referenceKey?: string;
    prices?: Price[];
};

type Product = {
    id: number | string;
    referenceKey?: string;
    name?: Record<string, string> | string;
    variants?: Variant[];
};

type ProductsPayload = { entities?: Product[] } | Product[];

type PersistedState = {
    products: Product[];
    filters: Record<PriceFilterField, string>;
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
        // Quota exceeded or storage unavailable — silently ignore.
    }
};

export default defineComponent({
    name: 'PriceListsPage',

    components: { Breadcrumbs, IconRefresh },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Price Lists' },
        ];

        const products = ref<Product[]>([]);
        const loading = ref(false);
        const error = ref<string | null>(null);
        const errorBody = ref<string | null>(null);

        const filters = reactive<Record<PriceFilterField, string>>({
            countryCode: '',
            currencyCode: '',
            groupKey: '',
            merchantReferenceKey: 'default',
            promotionKey: NULL_SENTINEL,
        });

        const allPrices = computed<Price[]>(() =>
            products.value.flatMap((p) => (p.variants ?? []).flatMap((v) => v.prices ?? [])),
        );

        const filterOptions = computed(() => {
            const options: Record<PriceFilterField, Array<{ value: string; label: string }>> = {
                countryCode: [],
                currencyCode: [],
                groupKey: [],
                merchantReferenceKey: [],
                promotionKey: [],
            };
            for (const field of FILTER_FIELDS) {
                const seen = new Set<string>();
                for (const price of allPrices.value) {
                    const raw = price[field];
                    const value = raw === null || raw === undefined || raw === '' ? NULL_SENTINEL : String(raw);
                    if (seen.has(value)) continue;
                    seen.add(value);
                    options[field].push({
                        value,
                        label: value === NULL_SENTINEL ? '(none)' : value,
                    });
                }
                options[field].sort((a, b) => {
                    if (a.value === NULL_SENTINEL) return 1;
                    if (b.value === NULL_SENTINEL) return -1;
                    return a.label.localeCompare(b.label);
                });
            }
            return options;
        });

        const priceMatchesFilters = (price: Price): boolean => {
            for (const field of FILTER_FIELDS) {
                const selected = filters[field];
                if (!selected) continue;
                const raw = price[field];
                const normalized = raw === null || raw === undefined || raw === '' ? NULL_SENTINEL : String(raw);
                if (normalized !== selected) return false;
            }
            return true;
        };

        const filteredProducts = computed<Product[]>(() =>
            products.value
                .map((product) => {
                    const variants = (product.variants ?? [])
                        .map((variant) => ({
                            ...variant,
                            prices: (variant.prices ?? []).filter(priceMatchesFilters),
                        }))
                        .filter((v) => (v.prices ?? []).length > 0);
                    return { ...product, variants };
                })
                .filter((product) => (product.variants ?? []).length > 0),
        );

        const productName = (product: Product): string => {
            const name = product.name;
            if (!name) return product.referenceKey || String(product.id);
            if (typeof name === 'string') return name;
            const values = Object.values(name);
            return values[0] || product.referenceKey || String(product.id);
        };

        const formatValue = (value: unknown): string => {
            if (value === null || value === undefined || value === '') return '—';
            return String(value);
        };

        const formatCurrency = (cents: number | null | undefined, currencyCode: string | null | undefined): string => {
            if (cents === null || cents === undefined) return '—';
            const amount = cents / 100;
            if (currencyCode) {
                try {
                    return new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: currencyCode,
                    }).format(amount);
                } catch {
                    // fall through to plain formatting if the code isn't valid
                }
            }
            return amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        };

        const load = async () => {
            loading.value = true;
            error.value = null;
            errorBody.value = null;
            try {
                const payload = await adminApi().get<ProductsPayload>('products', {
                    query: { with: 'variants.prices' },
                });
                products.value = Array.isArray(payload) ? payload : (payload.entities ?? []);
                writeState({ products: products.value, filters: { ...filters } });
            } catch (e) {
                products.value = [];
                if (e instanceof ApiError) {
                    error.value = e.message;
                    errorBody.value = typeof e.body === 'string' ? e.body : JSON.stringify(e.body, null, 2);
                } else if (e instanceof Error) {
                    error.value = e.message;
                } else {
                    error.value = 'Unknown error';
                }
            } finally {
                loading.value = false;
            }
        };

        watch(
            filters,
            () => {
                if (products.value.length) {
                    writeState({ products: products.value, filters: { ...filters } });
                }
            },
            { deep: true },
        );

        onMounted(() => {
            const cached = readState();
            if (cached && cached.products?.length) {
                products.value = cached.products;
                for (const field of FILTER_FIELDS) {
                    if (cached.filters && field in cached.filters) {
                        filters[field] = cached.filters[field];
                    }
                }
                return;
            }
            load();
        });

        return {
            breadcrumbs,
            products,
            loading,
            error,
            errorBody,
            filters,
            filterOptions,
            filteredProducts,
            productName,
            formatValue,
            formatCurrency,
            refresh: load,
        };
    },
});
</script>
