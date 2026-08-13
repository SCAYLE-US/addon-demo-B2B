<template>
  <Breadcrumbs
    title="Manage Business Accounts"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Business Accounts
    </div>
    <div class="card-body">
      <div class="flex flex-wrap items-end gap-2 mb-4">
        <label class="label flex-1">
          <span class="label-text">New Business Account</span>
          <input
            v-model="newValue"
            type="text"
            class="form-control"
            placeholder="Enter a business account name"
            @keydown.enter="addValue"
          />
        </label>
        <button
          class="btn"
          :disabled="!newValue.trim()"
          @click="addValue"
        >
          Add Value
        </button>
      </div>

      <ul
        v-if="accounts.length"
        class="divide-y"
      >
        <li
          v-for="(account, index) in accounts"
          :key="index"
          class="py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          @click="goToDetail(index)"
        >
          <span>{{ account.name }}</span>
          <button
            class="btn btn-sm"
            @click.stop="removeValue(index)"
          >
            Remove
          </button>
        </li>
      </ul>

      <div
        v-else
        class="alert alert-info"
      >
        No business accounts yet. Add one above.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import {
    type BusinessAccount,
    generateBusinessAccountId,
    readBusinessAccounts,
    writeBusinessAccounts,
} from '@/store/businessAccounts';

export default defineComponent({
    name: 'UserCompaniesPage',

    components: { Breadcrumbs },

    setup() {
        const router = useRouter();
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Business Accounts' },
        ];

        const accounts = ref<BusinessAccount[]>([]);
        const newValue = ref('');

        const refresh = () => {
            const loaded = readBusinessAccounts();
            writeBusinessAccounts(loaded); // Persist migrations if any.
            accounts.value = loaded;
        };

        const addValue = () => {
            const trimmed = newValue.value.trim();
            if (!trimmed) return;
            const current = readBusinessAccounts();
            writeBusinessAccounts([...current, { id: generateBusinessAccountId(current), name: trimmed }]);
            newValue.value = '';
            refresh();
        };

        const removeValue = (index: number) => {
            const current = readBusinessAccounts();
            const target = current[index];
            if (!target) return;
            if (!window.confirm(`Are you sure you want to remove "${target.name}"?`)) return;
            writeBusinessAccounts(current.filter((_, i) => i !== index));
            refresh();
        };

        const goToDetail = (index: number) => {
            router.push({ name: 'business-account-detail', params: { index: String(index) } });
        };

        onMounted(refresh);

        return { breadcrumbs, accounts, newValue, addValue, removeValue, goToDetail };
    },
});
</script>
