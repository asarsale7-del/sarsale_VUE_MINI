<template>
  <form @submit.prevent="$emit('membership-submitted', { ...form })" @input="$emit('membership-change', { ...form })" class="membership-form">
    <div class="row">
      <div class="field">
        <label>Student Name</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="field">
        <label>Student ID</label>
        <input v-model="form.studentId" type="text" required />
      </div>

      <div class="field">
        <label>Email</label>
        <input v-model="form.email" type="email" required />
      </div>
    </div>

    <div class="field">
      <label>Club</label>
      <select v-model="form.club" required>
        <option value="">Select Club</option>
        <option value="Programming Club">Programming Club</option>
        <option value="Multimedia Club">Multimedia Club</option>
        <option value="Robotics Club">Robotics Club</option>
        <option value="Cybersecurity Club">Cybersecurity Club</option>
        <option value="Web Development Club">Web Development Club</option>
      </select>
    </div>

    <div class="field">
      <label>Membership Type</label>
      <select v-model="form.membershipType" required>
        <option value="">Select Membership Type</option>
        <option value="Regular Member">Regular Member</option>
        <option value="Officer">Officer</option>
        <option value="Volunteer">Volunteer</option>
      </select>
    </div>

    <div class="field">
      <label>Confirmation</label>
      <label><input v-model="form.confirmation" type="checkbox" /> I confirm that I want to join this club</label>
    </div>

    <div class="field">
      <label>Reason for Joining</label>
      <textarea v-model="form.reason" rows="3" required></textarea>
    </div>

    <div class="field">
      <button type="submit">Submit Membership</button>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MembershipForm',
  data(): { form: Record<string, any> } {
    return {
      form: {
        name: '',
        studentId: '',
        email: '',
        club: '',
        membershipType: '',
        confirmation: false,
        reason: ''
      }
    };
  }
});
</script>

<style scoped>
.membership-form {
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
