<template>
  <section class="student-display" aria-live="polite">
    <h2>Student Information</h2>

    <div v-if="student" class="details">
      <p><strong>Name:</strong> {{ student.name }}</p>
      <p><strong>Student ID:</strong> {{ student.studentId }}</p>
      <p><strong>Course:</strong> {{ student.course }}</p>
      <p><strong>Year Level:</strong> {{ student.yearLevel }}</p>
      <p><strong>Email:</strong> {{ student.email }}</p>
    </div>
    <p v-else class="empty-state">Submitted student information will appear here.</p>
  </section>
</template>

<script setup>
defineProps({
  student: {
    type: Object,
    default: null
  }
});
</script>

<style scoped>
.student-display {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #ccc;
}

h2 {
  margin: 0 0 12px;
  font-size: 20px;
}

.details {
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.details p {
  margin: 8px 0;
}

.details strong {
  color: #333;
}

.empty-state {
  color: #666;
}

</style>
