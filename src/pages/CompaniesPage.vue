<template>
  <Breadcrumbs
    title="Manage Companies"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Companies
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        Add and manage B2B company accounts, contacts, and billing details.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';

export default defineComponent({
    name: 'CompaniesPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Companies' },
        ];

        return { breadcrumbs };
    },
});
</script>
