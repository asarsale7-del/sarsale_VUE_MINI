<template>
  <div :class="{ 'student-card': true, passed: passed }">
    <h3>{{ name }}</h3>
    <p>{{ course }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StudentCard',
  props: {
    name: {
      type: String,
      required: true
    },
    course: {
      type: String,
      required: true
    },
    passed: {
      type: Boolean,
      default: false
    }
  }
});
</script>

<style scoped>
.student-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #f9f9f9;
}

.passed {
  color: green;
  font-weight: bold;
}
</style>