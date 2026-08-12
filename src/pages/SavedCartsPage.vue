<template>
  <Breadcrumbs
    title="Manage Saved Carts"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Saved Carts
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        View, edit, and restore saved carts for B2B customers.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';

export default defineComponent({
    name: 'SavedCartsPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Saved Carts' },
        ];

        return { breadcrumbs };
    },
});
</script>
