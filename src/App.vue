<template>
  <main class="app-shell">
    <h1>Student Information System</h1>
    <StudentForm @student-submitted="handleStudentSubmitted" />
    <StudentDisplay :student="submittedStudent" />
  </main>
</template>

<script setup>
import { ref } from 'vue';
import StudentDisplay from './StudentDisplay.vue';
import StudentForm from './StudentForm.vue';

const submittedStudent = ref(null);

function handleStudentSubmitted(student) {
  submittedStudent.value = student;
}
</script>

<style>
:root {
  font-family: Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(100% - 32px, 600px);
  margin: 30px auto;
}

h1 {
  font-size: 24px;
}
</style>
