<template>
  <Breadcrumbs
    :title="pageTitle"
    :breadcrumbs="breadcrumbs"
  />

  <div class="mb-4">
    <router-link
      to="/users"
      class="btn btn-sm"
    >
      &larr; Back to Users
    </router-link>
  </div>

  <div
    v-if="loading"
    class="card"
  >
    <div class="card-body">
      <div class="alert alert-info">Loading customer…</div>
    </div>
  </div>

  <div
    v-else-if="error"
    class="card"
  >
    <div class="card-body">
      <div class="alert alert-error">
        <div>{{ error }}</div>
        <pre
          v-if="errorBody"
          class="mt-2 whitespace-pre-wrap text-xs"
        >{{ errorBody }}</pre>
      </div>
    </div>
  </div>

  <template v-else-if="customer">
    <div class="card mb-4">
      <div class="card-header">
        Basic Information
      </div>
      <div class="card-body">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt class="font-medium">ID</dt>
          <dd>{{ customer.id }}</dd>

          <dt class="font-medium">First Name</dt>
          <dd>{{ customer.firstName || '—' }}</dd>

          <dt class="font-medium">Last Name</dt>
          <dd>{{ customer.lastName || '—' }}</dd>

          <dt class="font-medium">Email</dt>
          <dd>{{ customer.email || '—' }}</dd>

          <dt class="font-medium">Gender</dt>
          <dd>{{ customer.gender || '—' }}</dd>

          <dt class="font-medium">Type</dt>
          <dd>{{ customer.type || '—' }}</dd>

          <dt class="font-medium">Has Password</dt>
          <dd>{{ customer.hasPassword ? 'Yes' : 'No' }}</dd>

          <dt class="font-medium">Active</dt>
          <dd>{{ customer.status?.isActive ? 'Yes' : 'No' }}</dd>

          <dt class="font-medium">Guest</dt>
          <dd>{{ customer.status?.isGuestCustomer ? 'Yes' : 'No' }}</dd>

          <dt class="font-medium">Created</dt>
          <dd>{{ customer.createdAt || '—' }}</dd>

          <dt class="font-medium">Updated</dt>
          <dd>{{ customer.updatedAt || '—' }}</dd>
        </dl>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header flex items-center justify-between">
        <span>Customer Groups</span>
        <button
          class="btn btn-sm"
          @click="toggleGroupsEdit"
        >
          {{ editingGroups ? 'Done' : 'Edit' }}
        </button>
      </div>
      <div class="card-body">
        <div
          v-if="editingGroups"
          class="border-b pb-4 mb-4"
        >
          <div class="flex flex-wrap items-end gap-2">
            <label class="label flex-1">
              <span class="label-text">Add Customer Group</span>
              <select
                v-model="selectedGroup"
                class="form-control"
                :disabled="!availableGroups.length || addingGroup"
              >
                <option value="">
                  {{ availableGroups.length ? 'Select a group' : 'No groups in local storage' }}
                </option>
                <option
                  v-for="group in availableGroups"
                  :key="group"
                  :value="group"
                >
                  {{ group }}
                </option>
              </select>
            </label>
            <button
              class="btn"
              :disabled="!selectedGroup || addingGroup"
              @click="addGroup"
            >
              {{ addingGroup ? 'Adding…' : 'Add' }}
            </button>
          </div>

          <div
            v-if="groupError"
            class="alert alert-error mt-2"
          >
            <div>{{ groupError }}</div>
            <pre
              v-if="groupErrorBody"
              class="mt-2 whitespace-pre-wrap text-xs"
            >{{ groupErrorBody }}</pre>
          </div>
        </div>

        <ul
          v-if="customerGroups.length"
          class="divide-y"
        >
          <li
            v-for="(group, i) in customerGroups"
            :key="i"
            class="py-2 flex items-center justify-between"
          >
            <span>{{ group.display }}</span>
            <button
              v-if="editingGroups"
              class="btn btn-sm"
              :disabled="removingGroup === group.identifier"
              @click="removeGroup(group.identifier)"
            >
              {{ removingGroup === group.identifier ? 'Removing…' : 'Remove' }}
            </button>
          </li>
        </ul>
        <div
          v-else
          class="alert alert-info"
        >
          This customer does not belong to any groups.
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between">
        <span>Custom Customer Attributes</span>
        <button
          class="btn btn-sm"
          @click="toggleLegacyEdit"
        >
          {{ editingLegacy ? 'Done' : 'Edit' }}
        </button>
      </div>
      <div class="card-body">
        <div
          v-if="editingLegacy"
          class="border-b pb-4 mb-4"
        >
          <div class="flex flex-wrap items-end gap-2">
            <label class="label flex-1">
              <span class="label-text">Add Custom Data Item</span>
              <select
                v-model="selectedLegacyName"
                class="form-control"
                :disabled="!availableLegacyNames.length"
              >
                <option value="">
                  {{ availableLegacyNames.length ? 'Select an item' : 'No custom data in local storage' }}
                </option>
                <option
                  v-for="name in availableLegacyNames"
                  :key="name"
                  :value="name"
                  :disabled="pendingLegacyNames.includes(name)"
                >
                  {{ name }}{{ pendingLegacyNames.includes(name) ? ' (added)' : '' }}
                </option>
              </select>
            </label>
            <button
              class="btn"
              :disabled="!selectedLegacyName"
              @click="addPendingLegacy"
            >
              Add
            </button>
          </div>

          <div
            v-if="pendingLegacyItems.length"
            class="mt-4"
          >
            <div class="text-gray-500 text-sm mb-2">Pending additions:</div>
            <ul class="divide-y">
              <li
                v-for="(item, i) in pendingLegacyItems"
                :key="i"
                class="py-2 grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
              >
                <span class="font-medium">{{ item.name }}</span>
                <select
                  v-model="item.value"
                  class="form-control"
                  :disabled="!availableValuesFor(item.name).length"
                >
                  <option value="">
                    {{ availableValuesFor(item.name).length ? 'Select a value' : 'No values defined' }}
                  </option>
                  <option
                    v-for="v in availableValuesFor(item.name)"
                    :key="v"
                    :value="v"
                  >
                    {{ v }}
                  </option>
                </select>
                <button
                  class="btn btn-sm"
                  @click="removePendingLegacy(i)"
                >
                  Remove
                </button>
              </li>
            </ul>

            <div class="mt-4 flex justify-end">
              <button
                class="btn"
                :disabled="!canSaveLegacy || savingLegacy"
                @click="saveLegacy"
              >
                {{ savingLegacy ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <div
            v-if="legacyError"
            class="alert alert-error mt-2"
          >
            <div>{{ legacyError }}</div>
            <pre
              v-if="legacyErrorBody"
              class="mt-2 whitespace-pre-wrap text-xs"
            >{{ legacyErrorBody }}</pre>
          </div>
        </div>

        <dl
          v-if="legacyCustomDataEntries.length"
          class="grid grid-cols-2 gap-x-4 gap-y-2"
        >
          <template
            v-for="[key, value] in legacyCustomDataEntries"
            :key="key"
          >
            <dt class="font-medium">{{ key }}</dt>
            <dd>{{ formatValue(value) }}</dd>
          </template>
        </dl>
        <div
          v-else
          class="alert alert-info"
        >
          No custom customer attributes.
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">
        Approvals
      </div>
      <div class="card-body opacity-50 pointer-events-none select-none">
        <div class="text-xs text-gray-500 italic mb-2">
          Preview — no approval data yet.
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b bg-gray-50">
                <th class="py-2 pr-4">Cart</th>
                <th class="py-2 pr-4">Received</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in previewApprovals"
                :key="row.id"
                class="border-b"
              >
                <td class="py-2 pr-4">
                  <div class="font-medium">{{ row.cartName }}</div>
                  <div class="text-xs text-gray-500">{{ row.cartId }}</div>
                </td>
                <td class="py-2 pr-4">{{ row.receivedAt }}</td>
                <td class="py-2 pr-4">
                  <span
                    class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                    :class="statusClasses(row.status)"
                  >
                    {{ row.status }}
                  </span>
                </td>
                <td class="py-2">{{ row.notes }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import { adminApi, ApiError } from '@/api';
import { readStoredValues } from '@/utils';
import { readBusinessAccounts, type BusinessAccount } from '@/store/businessAccounts';

const B2B_ACCOUNT_ID_FIELD = 'b2b_account_id';

const CUSTOMER_GROUPS_STORAGE_KEY = 'addon-demo-b2b:user-customer-groups';
const CUSTOM_DATA_STORAGE_KEY = 'addon-demo-b2b:user-custom-data';

type CustomDataItem = {
    name: string;
    availableValues: Record<string, unknown>;
};

const readCustomDataItems = (): CustomDataItem[] => {
    try {
        const raw = localStorage.getItem(CUSTOM_DATA_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((entry): CustomDataItem | null => {
                if (typeof entry === 'string') return { name: entry, availableValues: {} };
                if (entry && typeof entry === 'object') {
                    return {
                        name: String((entry as { name?: unknown }).name ?? ''),
                        availableValues:
                            (entry as { availableValues?: Record<string, unknown> }).availableValues ?? {},
                    };
                }
                return null;
            })
            .filter((v): v is CustomDataItem => !!v && !!v.name);
    } catch {
        return [];
    }
};

type CustomerDetail = {
    id: number | string;
    firstName?: string;
    lastName?: string;
    email?: string;
    gender?: string;
    type?: string;
    hasPassword?: boolean;
    createdAt?: string;
    updatedAt?: string;
    status?: { isActive?: boolean; isGuestCustomer?: boolean };
    legacyCustomData?: Record<string, unknown>;
    groups?: Array<{ name?: string; key?: string; id?: number | string } | string>;
};

export default defineComponent({
    name: 'CustomerDetailPage',

    components: { Breadcrumbs },

    setup() {
        const route = useRoute();
        const shopKey = String(route.params.shopKey ?? '');
        const countryCode = String(route.params.countryCode ?? '');
        const id = String(route.params.id ?? '');

        const customer = ref<CustomerDetail | null>(null);
        const loading = ref(false);
        const error = ref<string | null>(null);
        const errorBody = ref<string | null>(null);

        const editingGroups = ref(false);
        const availableGroups = ref<string[]>([]);
        const selectedGroup = ref('');
        const addingGroup = ref(false);
        const removingGroup = ref<string | null>(null);
        const groupError = ref<string | null>(null);
        const groupErrorBody = ref<string | null>(null);

        const editingLegacy = ref(false);
        const customDataItems = ref<CustomDataItem[]>([]);
        const businessAccounts = ref<BusinessAccount[]>([]);
        const selectedLegacyName = ref('');
        const pendingLegacyItems = ref<Array<{ name: string; value: string }>>([]);
        const savingLegacy = ref(false);
        const legacyError = ref<string | null>(null);
        const legacyErrorBody = ref<string | null>(null);

        const pageTitle = computed(() => {
            if (!customer.value) return 'Customer Detail';
            const name = [customer.value.firstName, customer.value.lastName].filter(Boolean).join(' ');
            return name || customer.value.email || `Customer ${customer.value.id}`;
        });

        const breadcrumbs = computed(() => [
            { title: 'B2B' },
            { title: 'Users' },
            { title: pageTitle.value },
        ]);

        const legacyCustomDataEntries = computed(() =>
            Object.entries(customer.value?.legacyCustomData ?? {}),
        );

        const customerGroups = computed(() => {
            const raw = customer.value?.groups ?? [];
            return raw.map((g) => {
                if (typeof g === 'string') return { display: g, identifier: g };
                const display = g.name || g.key || (g.id !== undefined ? String(g.id) : JSON.stringify(g));
                const identifier = g.key || g.name || (g.id !== undefined ? String(g.id) : display);
                return { display, identifier };
            });
        });

        const formatValue = (value: unknown): string => {
            if (value === null || value === undefined) return '—';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        };

        const load = async () => {
            loading.value = true;
            error.value = null;
            errorBody.value = null;
            try {
                const path = `shops/${encodeURIComponent(shopKey)}/countries/${encodeURIComponent(countryCode)}/customers/${encodeURIComponent(id)}`;
                customer.value = await adminApi().get<CustomerDetail>(path, {
                    query: { with: 'legacyCustomData' },
                });
            } catch (e) {
                customer.value = null;
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

        const toggleGroupsEdit = () => {
            editingGroups.value = !editingGroups.value;
            groupError.value = null;
            groupErrorBody.value = null;
            selectedGroup.value = '';
            if (editingGroups.value) {
                availableGroups.value = readStoredValues(CUSTOMER_GROUPS_STORAGE_KEY);
            }
        };

        const setGroupError = (e: unknown) => {
            if (e instanceof ApiError) {
                groupError.value = e.message;
                groupErrorBody.value = typeof e.body === 'string' ? e.body : JSON.stringify(e.body, null, 2);
            } else if (e instanceof Error) {
                groupError.value = e.message;
            } else {
                groupError.value = 'Unknown error';
            }
        };

        const groupsBasePath = () =>
            `shops/${encodeURIComponent(shopKey)}/countries/${encodeURIComponent(countryCode)}/customers/${encodeURIComponent(id)}/customer-groups`;

        const addGroup = async () => {
            if (!selectedGroup.value) return;
            addingGroup.value = true;
            groupError.value = null;
            groupErrorBody.value = null;
            try {
                await adminApi().post(groupsBasePath(), {
                    body: { groups: [selectedGroup.value] },
                });
                selectedGroup.value = '';
                await load();
            } catch (e) {
                setGroupError(e);
            } finally {
                addingGroup.value = false;
            }
        };

        const removeGroup = async (identifier: string) => {
            if (!identifier) return;
            removingGroup.value = identifier;
            groupError.value = null;
            groupErrorBody.value = null;
            try {
                await adminApi().delete(`${groupsBasePath()}/${encodeURIComponent(identifier)}`);
                await load();
            } catch (e) {
                setGroupError(e);
            } finally {
                removingGroup.value = null;
            }
        };

        const availableLegacyNames = computed(() => customDataItems.value.map((i) => i.name));
        const pendingLegacyNames = computed(() => pendingLegacyItems.value.map((p) => p.name));

        const availableValuesFor = (name: string): string[] => {
            if (name === B2B_ACCOUNT_ID_FIELD) {
                return businessAccounts.value.map((a) => a.name);
            }
            const item = customDataItems.value.find((i) => i.name === name);
            return item ? Object.keys(item.availableValues ?? {}) : [];
        };

        const toggleLegacyEdit = () => {
            editingLegacy.value = !editingLegacy.value;
            legacyError.value = null;
            legacyErrorBody.value = null;
            if (editingLegacy.value) {
                customDataItems.value = readCustomDataItems();
                businessAccounts.value = readBusinessAccounts();
            } else {
                pendingLegacyItems.value = [];
                selectedLegacyName.value = '';
            }
        };

        const addPendingLegacy = () => {
            const name = selectedLegacyName.value;
            if (!name) return;
            if (pendingLegacyItems.value.some((p) => p.name === name)) return;
            pendingLegacyItems.value.push({ name, value: '' });
            selectedLegacyName.value = '';
        };

        const removePendingLegacy = (index: number) => {
            pendingLegacyItems.value.splice(index, 1);
        };

        const canSaveLegacy = computed(
            () => pendingLegacyItems.value.length > 0 && pendingLegacyItems.value.every((p) => !!p.value),
        );

        const saveLegacy = async () => {
            if (!canSaveLegacy.value) return;
            savingLegacy.value = true;
            legacyError.value = null;
            legacyErrorBody.value = null;
            try {
                const body: Record<string, string> = {};
                pendingLegacyItems.value.forEach((p) => {
                    body[p.name] = p.value;
                });
                const path = `shops/${encodeURIComponent(shopKey)}/countries/${encodeURIComponent(countryCode)}/customers/${encodeURIComponent(id)}/legacy-custom-data`;
                await adminApi().put(path, { body });
                pendingLegacyItems.value = [];
                selectedLegacyName.value = '';
                await load();
            } catch (e) {
                if (e instanceof ApiError) {
                    legacyError.value = e.message;
                    legacyErrorBody.value = typeof e.body === 'string' ? e.body : JSON.stringify(e.body, null, 2);
                } else if (e instanceof Error) {
                    legacyError.value = e.message;
                } else {
                    legacyError.value = 'Unknown error';
                }
            } finally {
                savingLegacy.value = false;
            }
        };

        const previewApprovals = [
            {
                id: 1,
                cartName: 'Q4 Restock Order',
                cartId: 'cart_a91f',
                receivedAt: '2026-08-11 09:42',
                status: 'Pending',
                notes: 'Awaiting manager sign-off',
            },
            {
                id: 2,
                cartName: 'Trade Show Samples',
                cartId: 'cart_b204',
                receivedAt: '2026-08-09 15:18',
                status: 'Approved',
                notes: 'Ship by end of week',
            },
            {
                id: 3,
                cartName: 'Retail Reorder — East',
                cartId: 'cart_c7de',
                receivedAt: '2026-08-08 11:05',
                status: 'Rejected',
                notes: 'Over quarterly budget',
            },
        ];

        const statusClasses = (status: string) => {
            switch (status) {
                case 'Approved':
                    return 'bg-green-100 text-green-800';
                case 'Rejected':
                    return 'bg-red-100 text-red-800';
                case 'Pending':
                default:
                    return 'bg-yellow-100 text-yellow-800';
            }
        };

        onMounted(load);

        return {
            breadcrumbs,
            pageTitle,
            customer,
            loading,
            error,
            errorBody,
            legacyCustomDataEntries,
            customerGroups,
            formatValue,
            editingGroups,
            availableGroups,
            selectedGroup,
            addingGroup,
            removingGroup,
            groupError,
            groupErrorBody,
            toggleGroupsEdit,
            addGroup,
            removeGroup,
            editingLegacy,
            selectedLegacyName,
            pendingLegacyItems,
            availableLegacyNames,
            pendingLegacyNames,
            availableValuesFor,
            toggleLegacyEdit,
            addPendingLegacy,
            removePendingLegacy,
            canSaveLegacy,
            savingLegacy,
            legacyError,
            legacyErrorBody,
            saveLegacy,
            previewApprovals,
            statusClasses,
        };
    },
});
</script>
