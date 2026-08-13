<template>
  <Breadcrumbs
    title="Saved Carts"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Saved Carts
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        Coming soon — this feature is not yet available.
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
