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
        <ul
          v-if="customerGroups.length"
          class="divide-y mb-4"
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
          class="alert alert-info mb-4"
        >
          This customer does not belong to any groups.
        </div>

        <div
          v-if="editingGroups"
          class="border-t pt-4"
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
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        Legacy Custom Data
      </div>
      <div class="card-body">
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
          No legacy custom data.
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

const CUSTOMER_GROUPS_STORAGE_KEY = 'addon-demo-b2b:user-customer-groups';

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
        };
    },
});
</script>
