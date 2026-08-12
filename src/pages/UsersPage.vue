<template>
  <Breadcrumbs
    title="Manage Users"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Users
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        Manage user accounts, roles, and permissions for the B2B tenant.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';

export default defineComponent({
    name: 'UsersPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Users' },
        ];

        return { breadcrumbs };
    },
});
</script>
