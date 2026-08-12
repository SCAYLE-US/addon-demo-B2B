<template>
  <Breadcrumbs
    title="Manage Custom Data"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Custom Data
    </div>
    <div class="card-body">
      <div class="flex flex-wrap items-end gap-2 mb-4">
        <label class="label flex-1">
          <span class="label-text">New Custom Data</span>
          <input
            v-model="newValue"
            type="text"
            class="form-control"
            placeholder="Enter a custom data name"
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
        v-if="items.length"
        class="divide-y"
      >
        <li
          v-for="(item, index) in items"
          :key="index"
          class="py-2"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ item.name }}</span>
            <div class="flex gap-2">
              <button
                class="btn btn-sm"
                @click="toggleEdit(index)"
              >
                {{ editingIndex === index ? 'Done' : 'Edit' }}
              </button>
              <button
                class="btn btn-sm"
                @click="removeValue(index)"
              >
                Remove
              </button>
            </div>
          </div>
          <div class="pl-4 mt-1 text-sm">
            <div
              v-if="valueKeys(item).length"
            >
              <span class="text-gray-500">Available values:</span>
              <ul
                :class="editingIndex === index ? 'pl-2' : 'list-disc pl-6'"
              >
                <li
                  v-for="key in valueKeys(item)"
                  :key="key"
                  :class="editingIndex === index ? 'flex items-center justify-between py-1' : ''"
                >
                  <span>{{ key }}</span>
                  <button
                    v-if="editingIndex === index"
                    class="btn btn-sm"
                    @click="removeAvailableValue(index, key)"
                  >
                    Remove
                  </button>
                </li>
              </ul>
            </div>
            <div
              v-else
              class="text-gray-500"
            >
              No available values yet.
            </div>
            <div
              v-if="editingIndex === index"
              class="flex flex-wrap items-end gap-2 mt-2"
            >
              <label class="label flex-1">
                <span class="label-text">New Value</span>
                <input
                  v-model="newAvailableValue"
                  type="text"
                  class="form-control"
                  placeholder="Enter an available value"
                  @keydown.enter="addAvailableValue(index)"
                />
              </label>
              <button
                class="btn"
                :disabled="!newAvailableValue.trim()"
                @click="addAvailableValue(index)"
              >
                Add
              </button>
            </div>
          </div>
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

const STORAGE_KEY = 'addon-demo-b2b:user-custom-data';

type CustomDataItem = {
    name: string;
    availableValues: Record<string, unknown>;
};

const readItems = (): CustomDataItem[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Migrate legacy string entries to { name, availableValues } shape
        return parsed.map((entry) => {
            if (typeof entry === 'string') {
                return { name: entry, availableValues: {} };
            }
            if (entry && typeof entry === 'object') {
                return {
                    name: String((entry as { name?: unknown }).name ?? ''),
                    availableValues:
                        (entry as { availableValues?: Record<string, unknown> }).availableValues ?? {},
                };
            }
            return { name: String(entry), availableValues: {} };
        });
    } catch {
        return [];
    }
};

const writeItems = (items: CustomDataItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export default defineComponent({
    name: 'UserCustomDataPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Users' },
            { title: 'Custom Data' },
        ];

        const items = ref<CustomDataItem[]>([]);
        const newValue = ref('');
        const editingIndex = ref<number | null>(null);
        const newAvailableValue = ref('');

        const refresh = () => {
            const loaded = readItems();
            // Persist any migrations so the on-disk shape matches
            writeItems(loaded);
            items.value = loaded;
        };

        const addValue = () => {
            const trimmed = newValue.value.trim();
            if (!trimmed) return;
            const current = readItems();
            writeItems([...current, { name: trimmed, availableValues: {} }]);
            newValue.value = '';
            refresh();
        };

        const removeValue = (index: number) => {
            const current = readItems();
            const target = current[index];
            if (!target) return;
            if (!window.confirm(`Are you sure you want to remove "${target.name}"?`)) return;
            writeItems(current.filter((_, i) => i !== index));
            if (editingIndex.value === index) {
                editingIndex.value = null;
                newAvailableValue.value = '';
            }
            refresh();
        };

        const toggleEdit = (index: number) => {
            newAvailableValue.value = '';
            editingIndex.value = editingIndex.value === index ? null : index;
        };

        const addAvailableValue = (index: number) => {
            const trimmed = newAvailableValue.value.trim();
            if (!trimmed) return;
            const current = readItems();
            const item = current[index];
            if (!item) return;
            item.availableValues = { ...(item.availableValues ?? {}), [trimmed]: true };
            writeItems(current);
            newAvailableValue.value = '';
            refresh();
        };

        const removeAvailableValue = (index: number, key: string) => {
            const current = readItems();
            const item = current[index];
            if (!item) return;
            if (!window.confirm(`Are you sure you want to remove "${key}"?`)) return;
            const { [key]: _removed, ...rest } = item.availableValues ?? {};
            item.availableValues = rest;
            writeItems(current);
            refresh();
        };

        const valueKeys = (item: CustomDataItem) => Object.keys(item.availableValues ?? {});

        onMounted(refresh);

        return {
            breadcrumbs,
            items,
            newValue,
            editingIndex,
            newAvailableValue,
            addValue,
            removeValue,
            toggleEdit,
            addAvailableValue,
            removeAvailableValue,
            valueKeys,
        };
    },
});
</script>
