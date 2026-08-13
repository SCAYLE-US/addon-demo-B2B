<template>
  <Breadcrumbs
    title="Welcome Brian!"
    :breadcrumbs="breadcrumbs"
  />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
    <router-link
      v-for="tile in tiles"
      :key="tile.to"
      :to="tile.to"
      class="group aspect-square flex flex-col items-center justify-center gap-4 rounded-2xl bg-white border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-transparent"
    >
      <div
        class="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        :style="{ background: tile.gradient }"
      >
        <component
          :is="tile.icon"
          class="w-10 h-10 text-white"
        />
      </div>
      <div class="text-center px-4">
        <div class="text-lg font-semibold">{{ tile.label }}</div>
        <div class="text-xs text-gray-500 mt-1">{{ tile.description }}</div>
      </div>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';
import IconUsers from '~icons/panel/users';
import IconStore from '~icons/panel/store';
import IconDataTable from '~icons/panel/data-table';

export default defineComponent({
    name: 'DashboardPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'Dashboard' },
        ];

        const tiles = [
            {
                to: '/users',
                label: 'Manage Users/Accounts',
                description: 'View and manage customer accounts',
                icon: markRaw(IconUsers),
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            },
            {
                to: '/companies',
                label: 'Manage Business Accounts',
                description: 'B2B accounts and details',
                icon: markRaw(IconStore),
                gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            },
            {
                to: '/price-lists',
                label: 'Price Lists',
                description: 'Product pricing and variants',
                icon: markRaw(IconDataTable),
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            },
        ];

        return { breadcrumbs, tiles };
    },
});
</script>
