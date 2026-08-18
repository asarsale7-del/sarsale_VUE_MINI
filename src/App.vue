<template>
  <div>
    <h1>Forms Activity</h1>

    <h2>Welcome Form</h2>
    <form @submit.prevent="handleWelcomeSubmit">
      <input v-model="welcomeForm.name" type="text" placeholder="Student Name" required />
      <input v-model.number="welcomeForm.studentId" type="number" min="1" max="100" placeholder="Student ID" required />
      <input v-model="welcomeForm.address" type="text" placeholder="Address" required />
      <input v-model="welcomeForm.course" type="text" placeholder="Course" required />
      <select v-model="welcomeForm.year" required>
        <option value="">Year</option>
        <option value="1st Year">1st Year</option>
        <option value="2nd Year">2nd Year</option>
        <option value="3rd Year">3rd Year</option>
        <option value="4th Year">4th Year</option>
      </select>
      <button type="submit">Submit</button>
    </form>

    <p>Name: {{ welcomeForm.name }}</p>
    <p>ID: {{ welcomeForm.studentId }}</p>
    <p>Address: {{ welcomeForm.address }}</p>
    <p>Course: {{ welcomeForm.course }}</p>
    <p>Year: {{ welcomeForm.year }}</p>
    <p>{{ welcomeMessage }}</p>

    <h2>Registration Form</h2>
    <form @submit.prevent="handleRegistrationSubmit">
      <input v-model="userForm.fName" type="text" placeholder="First Name" required />
      <input v-model="userForm.lName" type="text" placeholder="Last Name" required />
      <input v-model="userForm.mI" type="text" maxlength="1" placeholder="Middle Initial" required />
      <input v-model="userForm.birthDate" type="text" placeholder="Birthdate" required />
      <textarea v-model="userForm.address" placeholder="Address" required></textarea>
      <input v-model="userForm.email" type="email" placeholder="Email" required />
      <select v-model="userForm.course" required>
        <option value="">Course</option>
        <option value="BSIT">BSIT</option>
        <option value="BSHM">BSHM</option>
        <option value="BSA">BSA</option>
        <option value="BSBA">BSBA</option>
        <option value="BSE">BSE</option>
      </select>
      <textarea v-model="userForm.description" placeholder="Short description" required></textarea>
      <label><input v-model="userForm.isStudent" type="checkbox" /> Student</label>
      <button type="submit">Register</button>
    </form>
    <p>{{ registrationMessage }}</p>
    
    <h2>Club Membership</h2>
    <membership-form @membership-submitted="handleMembershipSubmitted" />
    <membership-display :member="submittedMember" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MembershipForm from './MembershipForm.vue';
import MembershipDisplay from './MembershipDisplay.vue';

export default defineComponent({
  name: 'App',
  components: {
    MembershipForm,
    MembershipDisplay,
  },
  data() {
    return {
      welcomeForm: {
        name: '',
        studentId: null,
        address: '',
        course: '',
        year: ''
      },
      welcomeMessage: '',
      userForm: {
        fName: '',
        lName: '',
        mI: '',
        address: '',
        email: '',
        birthDate: '',
        description: '',
        course: '',
        isStudent: false
      },
      registrationMessage: ''
      ,
      submittedMember: null
    };
  },
  methods: {
    handleWelcomeSubmit() {
      console.log('Welcome form submitted:', this.welcomeForm);
      this.welcomeMessage = 'Welcome ' + this.welcomeForm.name + '!';
    },
    handleRegistrationSubmit() {
      console.log('User registration submitted:', this.userForm);
      this.registrationMessage = 'Registration successful for ' + this.userForm.fName + ' ' + this.userForm.lName + '.';
    }
    ,
    handleMembershipSubmitted(member: Record<string, any>) {
      console.log('Membership submitted:', member);
      this.submittedMember = member;
    }
  }
});
</script>

<style scoped>
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, sans-serif; }
input, textarea, select, button { display: block; width: 100%; margin: 6px 0; padding: 8px; }
button { width: auto; }
label { display: block; margin: 6px 0; }
</style>