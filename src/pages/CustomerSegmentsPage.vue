<template>
  <Breadcrumbs
    title="Manage Customer Segments"
    :breadcrumbs="breadcrumbs"
  />

  <div class="card">
    <div class="card-header">
      Customer Segments
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        Define and maintain customer segments for pricing, promotions, and targeting.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs.vue';

export default defineComponent({
    name: 'CustomerSegmentsPage',

    components: { Breadcrumbs },

    setup() {
        const breadcrumbs = [
            { title: 'B2B' },
            { title: 'Customer Segments' },
        ];

        return { breadcrumbs };
    },
});
</script>
