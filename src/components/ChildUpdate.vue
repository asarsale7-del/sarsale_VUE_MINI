<template>
  <form @input="$emit('child-change', { ...form })" class="child-form">
    <div class="row">
      <div class="field">
        <label>Name</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="field">
        <label>Email</label>
        <input v-model="form.email" type="email" required />
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label>Phone</label>
        <input v-model="form.phone" type="tel" required />
      </div>

      <div class="field">
        <label>Department</label>
        <select v-model="form.department" required>
          <option value="">Select</option>
          <option value="IT">IT</option>
          <option value="Accountancy">Accountancy</option>
          <option value="Nursing">Nursing</option>
          <option value="Education">Education</option>
          <option value="Hospitality Management">Hospitality Management</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label>Status</label>
      <input v-model="form.status" type="text" required />
    </div>

    <div class="field">
      <label>Notes</label>
      <textarea v-model="form.notes" rows="3" required></textarea>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ChildUpdateForm',
  data() {
    return {
      form: {
        name: '',
        email: '',
        phone: '',
        department: '',
        status: '',
        notes: ''
      }
    };
  }
});
</script>

<style scoped>
.child-form {
  display: grid;
  gap: 16px;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input,
textarea,
select {
  border: 1px solid #ccc;
  padding: 8px;
}

@media (max-width: 700px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
