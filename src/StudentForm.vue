<template>
  <form class="student-form" @submit.prevent="submitStudent">
    <h2>Student Details</h2>

    <label>
      Student Name:
      <input v-model="form.name" type="text" required />
    </label>

    <label>
      Student ID:
      <input v-model="form.studentId" type="text" required />
    </label>

    <label>
      Course:
      <select v-model="form.course" required>
        <option disabled value="">Select a course:</option>
        <option>BSIT Bachelor of Science in Information Technology</option>
        <option>BSCS Bachelor of Science in Computer Science</option>
        <option>BSIS Bachelor of Science in Information Science</option>
      </select>
    </label>

    <fieldset>
      <legend>Year Level</legend>
      <label v-for="year in yearLevels" :key="year" class="radio-option">
        <input v-model="form.yearLevel" type="radio" name="year-level" :value="year" required />
        {{ year }}
      </label>
    </fieldset>

    <label>
      Email:
      <input v-model="form.email" type="email" required />
    </label>

    <button type="submit">Submit Student</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['student-submitted']);
const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const form = ref({
  name: '',
  studentId: '',
  course: '',
  yearLevel: '',
  email: ''
});

function submitStudent() {
  emit('student-submitted', { ...form.value });
}
</script>

<style scoped>
.student-form {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ccc;
}

h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

label,
legend {
  color: #333;
  font-size: 0.9rem;
  font-weight: 700;
}

input:not([type='radio']),
select {
  display: block;
  width: 100%;
  margin-top: 4px;
  border: 1px solid #aaa;
  padding: 7px;
}

input:focus,
select:focus {
  outline: 1px solid #666;
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  border: 0;
  margin: 0;
  padding: 0;
}

legend {
  width: 100%;
  margin-bottom: 2px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 400;
}

button {
  border: 0;
  padding: 8px 12px;
  color: #ffffff;
  background: #333;
  cursor: pointer;
  font-weight: 700;
}

button:hover {
  background: #555;
}
</style>
