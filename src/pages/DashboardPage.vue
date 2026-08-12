<template>
  <Breadcrumbs
    title="Dashboard"
    :breadcrumbs="breadcrumbs"
  />

  <div class="flex flex-col gap-5">
    <Statistics />
    <TopStatistics />

    <div class="card">
      <div class="card-header">
        Storefront API — Products
      </div>
      <div class="card-body">
        <div class="flex items-center gap-2 mb-4">
          <label class="label">
            <span class="label-text">Shop ID</span>
            <input
              v-model="shopId"
              type="text"
              class="form-control"
              placeholder="e.g. 1001"
            />
          </label>
          <button
            class="btn"
            :disabled="loading || !shopId"
            @click="loadProducts"
          >
            {{ loading ? 'Loading…' : 'Get All Products' }}
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
          v-if="products.length"
          class="w-full text-left border-collapse"
        >
          <thead>
            <tr class="border-b">
              <th class="py-2 pr-4">ID</th>
              <th class="py-2">Name</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in products"
              :key="product.id"
              class="border-b"
            >
              <td class="py-2 pr-4">{{ product.id }}</td>
              <td class="py-2">{{ product.name }}</td>
            </tr>
          </tbody>
        </table>

        <div
          v-else-if="!loading && !error && requested"
          class="alert alert-info"
        >
          No products returned.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import useAddonProperties from '@/composables/useAddonProperties';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import Statistics from '@/components/Statistics/Statistics.vue';
import TopStatistics from '@/components/TopStatistics/TopStatistics.vue';
import { storefrontApi, ApiError } from '@/api';

type ProductRow = { id: string | number; name: string };

// Storefront API returns products in various shapes across tenants;
// pick the most common ones and coalesce.
type ProductPayload = {
    entities?: Array<Record<string, unknown>>;
    data?: Array<Record<string, unknown>>;
} | Array<Record<string, unknown>>;

const pickName = (product: Record<string, unknown>): string => {
    const attrs = product.attributes as Record<string, { values?: { label?: string } | Array<{ label?: string }> }> | undefined;
    const nameAttr = attrs?.name?.values;
    if (Array.isArray(nameAttr)) return nameAttr[0]?.label ?? '';
    if (nameAttr && typeof nameAttr === 'object') return nameAttr.label ?? '';
    return (product.name as string) ?? '';
};

const toRows = (payload: ProductPayload): ProductRow[] => {
    const list = Array.isArray(payload)
        ? payload
        : payload.entities ?? payload.data ?? [];
    return list.map((p) => ({
        id: (p.id as string | number) ?? '',
        name: pickName(p),
    }));
};

export default defineComponent({
    name: 'DashboardPage',

    components: { TopStatistics, Statistics, Breadcrumbs },

    setup() {
        const currentUserName = useAddonProperties()?.currentUser?.name;
        const breadcrumbs = [
            { title: 'Listings' },
            { title: 'Dashboard' },
        ];

        const products = ref<ProductRow[]>([]);
        const loading = ref(false);
        const requested = ref(false);
        const error = ref<string | null>(null);
        const errorBody = ref<string | null>(null);
        const shopId = ref('');

        const loadProducts = async () => {
            if (!shopId.value) return;
            loading.value = true;
            error.value = null;
            errorBody.value = null;
            requested.value = true;
            try {
                const payload = await storefrontApi().get<ProductPayload>('products', {
                    query: { shopId: shopId.value.trim() },
                });
                products.value = toRows(payload);
            } catch (e) {
                products.value = [];
                if (e instanceof ApiError) {
                    error.value = e.message;
                    errorBody.value = typeof e.body === 'string'
                        ? e.body
                        : JSON.stringify(e.body, null, 2);
                } else if (e instanceof Error) {
                    error.value = e.message;
                } else {
                    error.value = 'Unknown error';
                }
            } finally {
                loading.value = false;
            }
        };

        return {
            breadcrumbs,
            currentUserName,
            products,
            loading,
            error,
            errorBody,
            requested,
            shopId,
            loadProducts,
        };
    },
});
</script>
