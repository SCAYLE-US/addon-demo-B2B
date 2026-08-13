<template>
  <Breadcrumbs
    :title="pageTitle"
    :breadcrumbs="breadcrumbs"
  />

  <div class="mb-4">
    <router-link
      to="/companies"
      class="btn btn-sm"
    >
      &larr; Back to Business Accounts
    </router-link>
  </div>

  <div
    v-if="!account"
    class="card"
  >
    <div class="card-body">
      <div class="alert alert-error">
        Business account not found.
      </div>
    </div>
  </div>

  <div
    v-else
    class="card"
  >
    <div class="card-header">
      Details
    </div>
    <div class="card-body">
      <div class="grid grid-cols-1 gap-4 max-w-lg">
        <div>
          <div class="label-text">ID</div>
          <div class="font-mono">{{ account.id }}</div>
        </div>
        <label class="label">
          <span class="label-text">Name</span>
          <input
            v-model="draft.name"
            type="text"
            class="form-control"
            placeholder="Business account name"
          />
        </label>
        <label class="label">
          <span class="label-text">Address</span>
          <input
            v-model="draft.address"
            type="text"
            class="form-control"
            placeholder="Street, City, State, ZIP"
          />
        </label>
        <label class="label">
          <span class="label-text">Phone</span>
          <input
            v-model="draft.phone"
            type="text"
            class="form-control"
            placeholder="Phone number"
          />
        </label>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <button
          class="btn"
          :disabled="!draft.name.trim() || saving"
          @click="save"
        >
          {{ saving ? 'Saved!' : 'Save' }}
        </button>
        <span
          v-if="dirty"
          class="text-xs text-gray-500"
        >
          Unsaved changes
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import {
    type BusinessAccount,
    readBusinessAccounts,
    writeBusinessAccounts,
} from '@/store/businessAccounts';

const emptyDraft = () => ({ name: '', address: '', phone: '' });

export default defineComponent({
    name: 'BusinessAccountDetailPage',

    components: { Breadcrumbs },

    setup() {
        const route = useRoute();
        const index = Number(route.params.index);

        const account = ref<BusinessAccount | null>(null);
        const draft = reactive(emptyDraft());
        const saving = ref(false);

        const pageTitle = computed(() => account.value?.name || 'Business Account');

        const breadcrumbs = computed(() => [
            { title: 'B2B' },
            { title: 'Business Accounts' },
            { title: pageTitle.value },
        ]);

        const load = () => {
            const list = readBusinessAccounts();
            const found = Number.isFinite(index) ? list[index] : undefined;
            if (!found) {
                account.value = null;
                return;
            }
            account.value = found;
            draft.name = found.name;
            draft.address = found.address ?? '';
            draft.phone = found.phone ?? '';
        };

        const dirty = computed(() => {
            if (!account.value) return false;
            return (
                draft.name !== account.value.name ||
                (draft.address ?? '') !== (account.value.address ?? '') ||
                (draft.phone ?? '') !== (account.value.phone ?? '')
            );
        });

        const save = () => {
            const trimmedName = draft.name.trim();
            if (!trimmedName) return;
            const list = readBusinessAccounts();
            const current = list[index];
            if (!current) return;
            const updated: BusinessAccount = {
                id: current.id,
                name: trimmedName,
                address: draft.address.trim() || undefined,
                phone: draft.phone.trim() || undefined,
            };
            list[index] = updated;
            writeBusinessAccounts(list);
            account.value = updated;
            saving.value = true;
            setTimeout(() => {
                saving.value = false;
            }, 1200);
        };

        onMounted(load);

        return { breadcrumbs, pageTitle, account, draft, dirty, saving, save };
    },
});
</script>
