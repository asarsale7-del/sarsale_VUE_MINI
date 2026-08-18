<template>
  <div class="membership-display">
    <h3>Membership Details</h3>
    <div v-if="member">
      <p><strong>Name:</strong> {{ member.name }}</p>
      <p><strong>Student ID:</strong> {{ member.studentId }}</p>
      <p><strong>Email:</strong> {{ member.email }}</p>
      <p><strong>Club:</strong> {{ member.club }}</p>
      <p><strong>Membership Type:</strong> {{ member.membershipType }}</p>
      <p><strong>Confirmation:</strong> {{ member.confirmation ? 'Yes' : 'No' }}</p>
      <p><strong>Reason:</strong> {{ member.reason }}</p>
    </div>
    <div v-else>
      <p>No membership data yet.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MembershipDisplay',
  props: {
    member: {
      type: Object,
      required: false,
      default: null
    }
  }
});
</script>

<style scoped>
.membership-display {
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
