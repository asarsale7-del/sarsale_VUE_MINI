<template>
  <div class="greeting-card">
    <h3>Hello, {{ name }}!</h3>
    <p>This greeting is being passed from the parent component as a prop.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GreetingCard',
  props: {
    name: {
      type: String,
      required: true
    }
  }
});
</script>

<style scoped>
.greeting-card {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 10px;
  padding: 18px;
  margin-top: 12px;
}

h3 {
  margin-top: 0;
  margin-bottom: 8px;
}
</style>
