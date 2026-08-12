<template>
  <Breadcrumbs
    title="Manage Customer Groups"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Customer Groups
    </div>
    <div class="card-body">
      <div class="flex flex-wrap items-end gap-2 mb-4">
        <label class="label flex-1">
          <span class="label-text">New Customer Group</span>
          <input
            v-model="newValue"
            type="text"
            class="form-control"
            placeholder="Enter a customer group name"
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
        v-if="values.length"
        class="divide-y"
      >
        <li
          v-for="(value, index) in values"
          :key="index"
          class="py-2 flex items-center justify-between"
        >
          <span>{{ value }}</span>
          <button
            class="btn btn-sm"
            @click="removeValue(index)"
          >
            Remove
          </button>
        </li>
      </ul>

      <div
        v-else
        class="alert alert-info"
      >
        No values yet. Add one above.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import { readStoredValues, writeStoredValues } from '@/utils';

const STORAGE_KEY = 'addon-demo-b2b:user-customer-groups';

export default defineComponent({
    name: 'UserCustomerGroupsPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Users' },
            { title: 'Customer Groups' },
        ];

        const values = ref<string[]>([]);
        const newValue = ref('');

        const refresh = () => {
            values.value = readStoredValues(STORAGE_KEY);
        };

        const addValue = () => {
            const trimmed = newValue.value.trim();
            if (!trimmed) return;
            const current = readStoredValues(STORAGE_KEY);
            writeStoredValues(STORAGE_KEY, [...current, trimmed]);
            newValue.value = '';
            refresh();
        };

        const removeValue = (index: number) => {
            const current = readStoredValues(STORAGE_KEY);
            const target = current[index];
            if (target === undefined) return;
            if (!window.confirm(`Are you sure you want to remove "${target}"?`)) return;
            writeStoredValues(STORAGE_KEY, current.filter((_, i) => i !== index));
            refresh();
        };

        onMounted(refresh);

        return { breadcrumbs, values, newValue, addValue, removeValue };
    },
});
</script>
