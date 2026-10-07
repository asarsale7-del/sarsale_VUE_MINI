<template>
  <div class="app">
    <header class="topbar">
      <button v-if="view !== 'home'" class="icon-nav-button" aria-label="Back to previous screen" title="Back to previous screen" :disabled="!canGoBack" @click="goBack">←</button>
      <a class="brand" href="#" @click.prevent="navigate('home')">
        <img class="school-logo-small" src="/mater-dei-logo.png" alt="" />
        <span>MDC Student Complaint<small>MANAGEMENT SYSTEM</small></span>
      </a>
      <nav v-if="user" class="main-nav" aria-label="Main navigation">
        <button :class="{ active: view === 'home' }" @click="navigate('home')">Overview</button>
        <button v-if="user.role === 'student'" :class="{ active: view === 'complaints' }" @click="navigate('complaints')">My complaints</button>
        <button v-if="user.role === 'admin'" :class="{ active: view === 'complaints' }" @click="navigate('complaints')">All complaints</button>
        <button v-if="user.role === 'student'" :class="{ active: view === 'new' }" @click="navigate('new')">New complaint</button>
        <button v-if="user.role === 'student'" :class="{ active: view === 'track' }" @click="navigate('track')">Track a complaint</button>
      </nav>
      <div v-if="user" class="account">
        <span class="avatar">{{ initials(user.fullName) }}</span>
        <span class="account-name">{{ user.fullName }}<small>{{ user.role === 'admin' ? 'Administrator' : user.studentId }}</small></span>
        <button class="button-quiet signout" :disabled="busy" @click="signOut">Sign out</button>
      </div>
      <button v-else class="button-quiet top-signin" @click="openLogin('student')">Login</button>
    </header>

    <main>
      <div v-if="errorMessage" class="notice error-notice" role="alert">
        <span>{{ errorMessage }}</span>
        <button v-if="errorMessage === connectionErrorMessage" class="notice-retry" @click="retryConnection">Retry</button>
        <button aria-label="Dismiss notification" @click="errorMessage = ''">×</button>
      </div>
      <div v-if="successMessage" class="notice success-notice" role="status">
        <span>{{ successMessage }}</span>
        <button aria-label="Dismiss notification" @click="successMessage = ''">×</button>
      </div>

      <section v-if="!user && view === 'home'" class="public-home">
        <div class="public-brand-lockup">
          <img class="landing-school-logo" src="/mater-dei-logo.png" alt="Mater Dei College seal" />
          <h1>Student Complaint Management System</h1>
          <p>Your voice. Your campus.</p>
        </div>
        <div class="public-hero">
          <div class="public-copy">
            <span class="eyebrow"><span class="live-dot"></span> A BETTER WAY TO BE HEARD</span>
            <p>A simple, private way to share concerns with your school, follow every update, and help make campus better for everyone.</p>
            <div class="public-hero-actions">
              <button class="button-primary" @click="navigate('new')">File a Complaint <span>→</span></button>
              <button class="button-outline" @click="navigate('track')">Track My Complaint</button>
            </div>
            <div class="public-trust"><span>✓</span> Private by design <i></i> Updates you can follow</div>
          </div>
          <aside class="public-action-card">
            <div class="action-card-heading"><span class="brand-icon">SC</span><div><b>How can we help?</b><small>Choose where you’d like to start.</small></div></div>
            <button class="action-card-link" @click="navigate('new')"><span class="action-card-icon">＋</span><span><b>File a Complaint</b><small>Tell us about a concern</small></span><span class="action-arrow">→</span></button>
            <button class="action-card-link" @click="navigate('track')"><span class="action-card-icon">⌕</span><span><b>Track My Complaint</b><small>Check the latest status</small></span><span class="action-arrow">→</span></button>
            <button class="action-card-link" @click="openLogin('student')"><span class="action-card-icon">♙</span><span><b>Student Login</b><small>View your complaints</small></span><span class="action-arrow">→</span></button>
            <button class="action-card-link staff-login-link" @click="openLogin('staff')"><span class="action-card-icon">▣</span><span><b>Staff / Admin Login</b><small>Review and process complaints</small></span><span class="action-arrow">→</span></button>
            <p class="action-card-note"><span>🔒</span> Student concerns stay private while authorized staff monitor and process each case.</p>
          </aside>
        </div>
        <div class="public-feature-row">
          <article><span>01</span><div><b>Tell us what happened</b><small>Choose a category and share the details that matter.</small></div></article>
          <article><span>02</span><div><b>Keep your reference</b><small>Use your private reference number to check progress.</small></div></article>
          <article><span>03</span><div><b>See every update</b><small>Follow your concern as it moves toward resolution.</small></div></article>
        </div>
      </section>

      <section v-else-if="!user && view === 'login'" class="welcome-layout">
        <div class="welcome-copy">
          <span class="eyebrow"><span class="live-dot"></span> {{ loginAudience === 'staff' ? 'STAFF WORKSPACE' : 'A better way to be heard' }}</span>
          <h1 v-if="loginAudience === 'staff'">Every concern.<br /><span>One place to help.</span></h1>
          <h1 v-else>Your campus.<br />Your voice. <span>Real change.</span></h1>
          <p v-if="loginAudience === 'staff'">Sign in with the school-configured staff account to review new submissions, update complaint statuses, and leave notes for students.</p>
          <p v-else>Share a concern, follow its progress, and stay connected with the people working to make your school better.</p>
          <div class="welcome-points">
            <div><span class="point-icon">{{ loginAudience === 'staff' ? '◷' : '✓' }}</span><span><b>{{ loginAudience === 'staff' ? 'Review the queue' : 'Private by design' }}</b><small>{{ loginAudience === 'staff' ? 'Find pending complaints and prioritize follow-up.' : 'Your submissions are only visible to you and authorized school staff.' }}</small></span></div>
            <div><span class="point-icon">↗</span><span><b>{{ loginAudience === 'staff' ? 'Keep students updated' : 'Always in the loop' }}</b><small>{{ loginAudience === 'staff' ? 'Record progress and resolutions in each case history.' : 'Follow every update from submission to resolution.' }}</small></span></div>
          </div>
          <div class="trust-note"><span>🔒</span> Your concerns are handled with care and confidentiality.</div>
        </div>

        <section class="auth-card" aria-labelledby="auth-heading">
          <div class="auth-card-heading">
            <span class="auth-symbol">↗</span>
            <p class="eyebrow">{{ loginAudience === 'staff' ? 'SCHOOL STAFF PORTAL' : 'STUDENT PORTAL' }}</p>
            <h2 id="auth-heading">{{ authMode === 'login' ? (loginAudience === 'staff' ? 'Staff sign in' : 'Welcome back') : 'Create your account' }}</h2>
            <p>{{ authMode === 'login' ? (loginAudience === 'staff' ? 'Use the staff username and password configured by your school.' : 'Sign in to manage your school concerns.') : 'Get started with your Student ID.' }}</p>
          </div>
          <form class="auth-form" @submit.prevent="submitAuth">
            <label v-if="authMode === 'register'" class="field">
              <span>Full name</span>
              <input v-model.trim="authForm.fullName" autocomplete="name" maxlength="100" placeholder="e.g. Alex Rivera" required />
            </label>
            <label class="field">
              <span>{{ loginAudience === 'staff' ? 'Staff username' : 'Student ID' }}</span>
              <input v-model.trim="authForm.studentId" autocomplete="username" maxlength="32" :placeholder="loginAudience === 'staff' ? 'Enter your staff username' : 'Enter your Student ID'" required />
            </label>
            <label class="field">
              <span>Password</span>
              <input v-model="authForm.password" :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'" type="password" minlength="10" maxlength="128" placeholder="At least 10 characters" required />
            </label>
            <button class="button-primary auth-submit" :disabled="busy" type="submit">
              {{ busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account' }}
              <span>→</span>
            </button>
          </form>
          <p v-if="loginAudience === 'student'" class="auth-switch">
            {{ authMode === 'login' ? 'New to the portal?' : 'Already have an account?' }}
            <button @click="switchAuthMode">{{ authMode === 'login' ? 'Create an account' : 'Sign in' }}</button>
          </p>
          <p v-if="loginAudience === 'staff' && authMode === 'login'" class="staff-setup-note">Staff accounts are configured by the school administrator. Contact your system administrator if you need access.</p>
          <p v-if="loginAudience === 'staff'" class="guest-track-link"><button @click="openLogin('student')">Student login</button></p>
          <p class="guest-track-link"><button @click="navigate('track')">Continue as a guest to track a complaint</button></p>
          <p class="privacy-caption">By continuing, you agree to use this portal respectfully. Please do not submit emergency or time-critical requests here.</p>
        </section>
      </section>

      <section v-else-if="view === 'home'" class="page-content">
        <div class="welcome-banner">
          <div>
            <p class="eyebrow">{{ user.role === 'admin' ? 'STAFF WORKSPACE' : 'STUDENT WORKSPACE' }}</p>
            <h1>{{ greeting }}, {{ firstName }}.</h1>
            <p>{{ user.role === 'admin' ? 'Review student concerns and keep every case moving forward.' : 'Your concerns matter. Here’s where things stand.' }}</p>
          </div>
          <button v-if="user.role === 'student'" class="button-primary" @click="navigate('new')"><span>＋</span> File a complaint</button>
          <span v-else class="banner-illustration" aria-hidden="true">✳</span>
        </div>

        <div class="stats-grid">
          <article class="stat-card"><span class="stat-icon blue">▤</span><span><small>{{ user.role === 'admin' ? 'Total complaints' : 'My complaints' }}</small><b>{{ complaints.length }}</b></span></article>
          <article class="stat-card"><span class="stat-icon amber">◷</span><span><small>Pending review</small><b>{{ countStatus('Pending') }}</b></span></article>
          <article class="stat-card"><span class="stat-icon violet">↻</span><span><small>In progress</small><b>{{ countStatus('In Progress') }}</b></span></article>
          <article class="stat-card"><span class="stat-icon green">✓</span><span><small>Resolved</small><b>{{ countStatus('Resolved') }}</b></span></article>
        </div>

        <div class="section-heading">
          <div><p class="eyebrow">YOUR ACTIVITY</p><h2>{{ user.role === 'admin' ? 'Recently submitted' : 'Recent complaints' }}</h2></div>
          <button class="text-link" @click="navigate('complaints')">View all <span>→</span></button>
        </div>
        <ComplaintTable :complaints="complaints.slice(0, 5)" :admin="user.role === 'admin'" :busy-reference="busyReference" @open="openComplaint" @update-status="updateStatus" />
        <div v-if="!complaints.length && !busy" class="empty-state">
          <span class="empty-illustration">◇</span><h3>{{ user.role === 'admin' ? 'You’re all caught up' : 'A fresh start' }}</h3>
          <p>{{ user.role === 'admin' ? 'New student concerns will appear here.' : 'You haven’t submitted a complaint yet.' }}</p>
          <button v-if="user.role === 'student'" class="button-outline" @click="navigate('new')">Submit your first complaint</button>
        </div>
      </section>

      <section v-else-if="view === 'new'" class="page-content narrow-content">
        <button class="back-link" @click="navigate('home')">← Back to overview</button>
        <div class="page-intro"><p class="eyebrow">WE’RE HERE TO HELP</p><h1>Tell us what’s going on.</h1><p>Share as much detail as you’re comfortable with. Your complaint is private to you and authorized staff.</p></div>
        <form class="panel complaint-form" @submit.prevent="submitComplaint">
          <div class="panel-heading"><span class="panel-icon">✎</span><div><h2>Complaint details</h2><p>Fields marked <span class="required">*</span> are required.</p></div></div>
          <div class="form-grid">
            <label class="field"><span>Your name</span><input :value="user.fullName" disabled /></label>
            <label class="field"><span>Student ID</span><input :value="user.studentId" disabled /></label>
            <label class="field full-field"><span>What is your concern about? <span class="required">*</span></span>
              <select v-model="complaintForm.category" required>
                <option value="" disabled>Select a category</option>
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
            </label>
            <label class="field full-field"><span>Tell us what happened <span class="required">*</span></span>
              <textarea v-model.trim="complaintForm.description" minlength="10" maxlength="5000" rows="7" placeholder="Include relevant details such as what happened, when it happened, and how it affected you." required></textarea>
              <small class="field-hint">Please don’t include sensitive information that isn’t needed to understand your concern. {{ complaintForm.description.length }}/5000</small>
            </label>
            <label class="field full-field"><span>Supporting document <span class="optional">(optional)</span></span>
              <span class="upload-box"><input type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" @change="selectEvidence" /><span class="upload-icon">↑</span><span><b>{{ evidence?.name || 'Choose a file to attach' }}</b><small>PDF or image · Maximum 5 MB</small></span></span>
            </label>
          </div>
          <div class="form-footer"><p><span>🔒</span> Your complaint is visible only to you and authorized staff.</p><button class="button-primary" type="submit" :disabled="busy">{{ busy ? 'Submitting…' : 'Submit complaint' }} <span>→</span></button></div>
        </form>
      </section>

      <section v-else-if="view === 'complaints'" class="page-content">
        <div class="page-intro horizontal-intro"><div><p class="eyebrow">{{ user.role === 'admin' ? 'STAFF WORKSPACE' : 'YOUR RECORDS' }}</p><h1>{{ user.role === 'admin' ? 'Complaint inbox' : 'My complaints' }}</h1><p>{{ user.role === 'admin' ? 'Open a complaint to review its details. Add an optional note, then select a status to record your action and notify the student in their history.' : 'A complete history of your submitted concerns and their progress.' }}</p></div><button v-if="user.role === 'student'" class="button-primary" @click="navigate('new')"><span>＋</span> New complaint</button></div>
        <div class="filter-bar"><div class="filter-group" aria-label="Filter complaints"><button v-for="filter in filters" :key="filter" :class="{ selected: activeFilter === filter }" @click="changeFilter(filter)">{{ filter }}<span>{{ filter === 'All' ? complaints.length : countStatus(filter) }}</span></button></div><button class="button-quiet refresh-button" :disabled="busy" @click="loadComplaints">↻ Refresh</button></div>
        <ComplaintTable :complaints="filteredComplaints" :admin="user.role === 'admin'" :busy-reference="busyReference" @open="openComplaint" @update-status="updateStatus" />
        <div v-if="!filteredComplaints.length && !busy" class="empty-state panel"><span class="empty-illustration">◇</span><h3>{{ activeFilter === 'All' ? 'Nothing here yet' : `No ${activeFilter.toLowerCase()} complaints` }}</h3><p>{{ user.role === 'admin' ? 'Try another filter or refresh the inbox.' : 'Your submitted concerns will appear here.' }}</p><button v-if="user.role === 'student' && activeFilter === 'All'" class="button-outline" @click="navigate('new')">Submit a complaint</button></div>
      </section>

      <section v-else-if="view === 'track'" class="page-content narrow-content">
        <button class="back-link" @click="navigate('home')">← Back to overview</button>
        <div class="page-intro"><p class="eyebrow">COMPLAINT STATUS</p><h1>Track a complaint.</h1><p>Enter your reference number to see its latest status. {{ user ? 'Your account can also view the full complaint details.' : 'Guest tracking shows status updates only; sign in to view full details.' }}</p></div>
        <form class="track-search panel" @submit.prevent="trackComplaint"><label class="field"><span>Reference number</span><input v-model.trim="referenceQuery" placeholder="e.g. SC-20261005-A1B2C3D4E5F60718293A4B5C6D7E8F90" required /></label><button class="button-primary" type="submit" :disabled="busy">Find complaint <span>→</span></button></form>
        <article v-if="trackedComplaint" class="panel detail-panel">
          <div class="detail-heading"><div><span class="eyebrow">REFERENCE NUMBER</span><h2>{{ trackedComplaint.reference }}</h2></div><StatusBadge :status="trackedComplaint.status" /></div>
          <div class="detail-meta"><span>Category<strong>{{ trackedComplaint.category }}</strong></span><span>Date submitted<strong>{{ formatDate(trackedComplaint.createdAt) }}</strong></span></div>
          <div v-if="user" class="detail-description"><h3>Your description</h3><p>{{ trackedComplaint.description }}</p></div>
          <a v-if="user && trackedComplaint.evidence" class="evidence-link" :href="trackedComplaint.evidence.url" target="_blank" rel="noopener">↗ {{ trackedComplaint.evidence.filename }}</a>
          <div class="updates"><h3>Status history</h3><ol><li v-for="update in trackedUpdates" :key="`${update.created_at}-${update.status}`"><span class="update-dot"></span><div><b>{{ update.status }}</b><small>{{ formatDate(update.created_at) }}<template v-if="user && update.changed_by"> · {{ update.changed_by }}</template></small><p v-if="user && update.note">{{ update.note }}</p></div></li></ol></div>
        </article>
      </section>
    </main>

    <footer class="footer"><span>Student Complaint Management System</span><span>For account concerns, contact Armand Sarsale. For emergencies, contact your school directly.</span></footer>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';

const StatusBadge = defineComponent({
  props: { status: { type: String, required: true } },
  setup(props) {
    return () => h('span', { class: ['status-badge', `status-${props.status.toLowerCase().replaceAll(' ', '-')}`] }, props.status);
  }
});

const ComplaintTable = defineComponent({
  components: { StatusBadge },
  props: {
    complaints: { type: Array, required: true },
    admin: { type: Boolean, default: false },
    busyReference: { type: String, default: '' }
  },
  emits: ['open', 'update-status'],
  setup(props, { emit }) {
    const statusNotes = ref({});
    return () => h('div', { class: 'complaint-table-wrap' }, [
      h('table', { class: 'complaint-table' }, [
        h('thead', [h('tr', [
          h('th', 'Complaint'),
          ...(props.admin ? [h('th', 'Student')] : []),
          h('th', 'Submitted'),
          h('th', 'Status'),
          ...(props.admin ? [h('th', 'Update status')] : [])
        ])]),
        h('tbody', props.complaints.map((complaint) => h('tr', { key: complaint.reference }, [
          h('td', [
            h('button', { class: 'complaint-title', onClick: () => emit('open', complaint) }, complaint.category),
            h('small', { class: 'reference-text' }, complaint.reference)
          ]),
          ...(props.admin ? [h('td', [
            h('span', { class: 'student-name' }, complaint.studentName),
            h('small', { class: 'reference-text' }, complaint.studentId)
          ])] : []),
          h('td', { class: 'date-cell' }, formatDate(complaint.createdAt)),
          h('td', [h(StatusBadge, { status: complaint.status })]),
          ...(props.admin ? [h('td', [h('select', {
            class: 'status-select',
            value: complaint.status,
            disabled: props.busyReference === complaint.reference,
            'aria-label': `Update status for ${complaint.reference}`,
            onChange: (event) => {
              if (event.target.value === complaint.status) return;
              emit('update-status', complaint, event.target.value, statusNotes.value[complaint.reference] || '');
              delete statusNotes.value[complaint.reference];
            }
          }, ['Pending', 'In Progress', 'Resolved'].map((status) => h('option', { value: status }, status))),
          h('input', {
            class: 'status-note',
            value: statusNotes.value[complaint.reference] || '',
            maxlength: 1000,
            placeholder: 'Optional update note',
            'aria-label': `Update note for ${complaint.reference}`,
            onInput: (event) => { statusNotes.value[complaint.reference] = event.target.value; }
          })])] : [])
        ])))
      ])
    ]);
  }
});

const categories = ['Academic Concern', 'Library Services', 'Facilities & Services', 'Disciplinary Concern', 'Technical Issue', 'Other'];
const filters = ['All', 'Pending', 'In Progress', 'Resolved'];
const user = ref(null);
const view = ref('home');
const viewHistory = ref([]);
const authMode = ref('login');
const loginAudience = ref('student');
const authForm = ref({ fullName: '', studentId: '', password: '' });
const complaintForm = ref({ category: '', description: '' });
const evidence = ref(null);
const pendingDestination = ref('home');
const complaints = ref([]);
const activeFilter = ref('All');
const referenceQuery = ref('');
const trackedComplaint = ref(null);
const trackedUpdates = ref([]);
const busy = ref(false);
const busyReference = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const connectionErrorMessage = 'The complaint service could not be reached. Check your connection and try again.';
const canGoBack = computed(() => viewHistory.value.length > 0);

const firstName = computed(() => user.value?.fullName.split(/\s+/)[0] || 'there');
const filteredComplaints = computed(() => activeFilter.value === 'All'
  ? complaints.value
  : complaints.value.filter((complaint) => complaint.status === activeFilter.value));
const greeting = computed(() => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
});

async function api(url, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const method = (options.method || 'GET').toUpperCase();
  const retryDelays = method === 'GET' ? [1000, 2000, 4000, 8000] : [];
  let response;

  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
    } catch (error) {
      if (attempt >= retryDelays.length) throw new Error(connectionErrorMessage, { cause: error });
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
      continue;
    }

    if ([502, 503, 504].includes(response.status) && attempt < retryDelays.length) {
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
      continue;
    }
    break;
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(connectionErrorMessage);
    }
    throw new Error('The complaint service returned an unexpected response. Please try again later.');
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
  return body;
}

function showError(error) {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  errorMessage.value = message;
  successMessage.value = '';
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  }
}

function validateAuthForm() {
  const studentId = authForm.value.studentId.trim();
  const fullName = authForm.value.fullName.trim();
  const password = authForm.value.password;

  if (loginAudience.value === 'staff') {
    if (!studentId) return 'Please enter your staff username.';
  } else if (!studentId || !/^[a-zA-Z0-9_-]{4,32}$/.test(studentId)) {
    return 'Student ID must be 4 to 32 characters using letters, numbers, dashes, or underscores.';
  }

  if (authMode.value === 'register') {
    if (!fullName || fullName.length < 2 || fullName.length > 100) {
      return 'Please enter a valid full name between 2 and 100 characters.';
    }
  }

  if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
    return 'Password must be between 10 and 128 characters.';
  }

  return '';
}

function validateComplaintForm() {
  if (!complaintForm.value.category) {
    return 'Please choose a complaint category.';
  }
  if (!complaintForm.value.description || complaintForm.value.description.trim().length < 10) {
    return 'Please provide a more detailed description with at least 10 characters.';
  }
  if (complaintForm.value.description.trim().length > 5000) {
    return 'Description must be 5,000 characters or fewer.';
  }
  return '';
}

async function retryConnection() {
  errorMessage.value = '';
  await loadUser();
}

function setView(destination) {
  if (view.value === destination) return;
  if (view.value) viewHistory.value.push(view.value);
  view.value = destination;
}

function resetFormState() {
  authForm.value = { fullName: '', studentId: '', password: '' };
  complaintForm.value = { category: '', description: '' };
  evidence.value = null;
}

function goBack() {
  const previousView = viewHistory.value.pop();
  if (previousView) view.value = previousView;
}

async function loadUser() {
  try {
    const result = await api('/api/auth/me');
    user.value = result.user;
    errorMessage.value = '';
    if (user.value) {
      viewHistory.value = [];
      view.value = user.value.role === 'admin' ? 'complaints' : 'home';
      await loadComplaints();
    }
  } catch (error) {
    showError(error);
  }
}

async function loadComplaints() {
  if (!user.value) return;
  busy.value = true;
  try {
    complaints.value = (await api('/api/complaints')).complaints;
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
}

async function submitAuth() {
  busy.value = true;
  errorMessage.value = '';
  try {
    const validationError = validateAuthForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const payload = {
      ...authForm.value,
      studentId: authForm.value.studentId.trim(),
      fullName: authForm.value.fullName.trim(),
      password: authForm.value.password
    };

    const url = authMode.value === 'login' ? '/api/auth/login' : '/api/auth/register';
    const result = await api(url, { method: 'POST', body: JSON.stringify(payload) });
    user.value = result.user;
    authForm.value = { fullName: '', studentId: '', password: '' };
    viewHistory.value = [];
    view.value = result.user.role === 'admin' ? 'complaints' : 'home';
    activeFilter.value = 'All';
    complaints.value = [];
    await loadComplaints();
    successMessage.value = authMode.value === 'register' ? 'Your account is ready. Welcome to the student portal.' : 'You’re signed in.';
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
}

function switchAuthMode() {
  authMode.value = authMode.value === 'login' ? 'register' : 'login';
  loginAudience.value = 'student';
  errorMessage.value = '';
}

function openLogin(audience) {
  authMode.value = 'login';
  loginAudience.value = audience;
  errorMessage.value = '';
  resetFormState();
  setView('login');
}

async function signOut() {
  busy.value = true;
  try {
    await api('/api/auth/logout', { method: 'POST' });
    user.value = null;
    complaints.value = [];
    trackedComplaint.value = null;
    view.value = 'home';
    viewHistory.value = [];
    loginAudience.value = 'student';
    resetFormState();
    successMessage.value = 'You’ve signed out.';
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
}

function navigate(destination) {
  if (destination === 'new' && !user.value) {
    authMode.value = 'login';
    loginAudience.value = 'student';
    setView('login');
    errorMessage.value = '';
    return;
  }
  setView(destination);
  errorMessage.value = '';
  if (destination === 'complaints') {
    activeFilter.value = 'All';
    loadComplaints();
  }
  if (destination === 'new') {
    complaintForm.value = { category: '', description: '' };
    evidence.value = null;
  }
}

function countStatus(status) {
  return complaints.value.filter((complaint) => complaint.status === status).length;
}

async function changeFilter(filter) {
  activeFilter.value = filter;
}

async function submitComplaint() {
  busy.value = true;
  errorMessage.value = '';
  try {
    const validationError = validateComplaintForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const body = new FormData();
    body.set('category', complaintForm.value.category);
    body.set('description', complaintForm.value.description.trim());
    if (evidence.value) body.set('evidence', evidence.value);
    const result = await api('/api/complaints', { method: 'POST', body });
    complaintForm.value = { category: '', description: '' };
    evidence.value = null;
    await loadComplaints();
    setView('track');
    await openComplaint(result.complaint);
    successMessage.value = `Complaint submitted. Keep your reference number: ${result.complaint.reference}`;
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
}

function selectEvidence(event) {
  evidence.value = event.target.files?.[0] || null;
}

async function trackComplaint() {
  await openComplaint({ reference: referenceQuery.value.trim().toUpperCase() });
}

async function openComplaint(complaint) {
  try {
    const endpoint = user.value ? '/api/complaints/' : '/api/public/complaints/';
    const result = await api(`${endpoint}${encodeURIComponent(complaint.reference)}`);
    trackedComplaint.value = result.complaint;
    trackedUpdates.value = result.updates;
    referenceQuery.value = result.complaint.reference;
    if (view.value === 'complaints') setView('track');
    errorMessage.value = '';
  } catch (error) {
    showError(error);
  }
}

async function updateStatus(complaint, status, note = '') {
  busyReference.value = complaint.reference;
  try {
    await api(`/api/complaints/${encodeURIComponent(complaint.reference)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
    await loadComplaints();
    successMessage.value = `Updated ${complaint.reference} to ${status}.`;
  } catch (error) {
    showError(error);
    await loadComplaints();
  } finally {
    busyReference.value = '';
  }
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

onMounted(loadUser);
</script>

<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1c2c43;background:#f6f8fb;font-synthesis:none;text-rendering:optimizeLegibility;font-weight:400;font-size:12px;font-optical-sizing:auto}*{box-sizing:border-box}body{margin:0;min-width:320px}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:wait;opacity:.6}.app{min-height:100vh;display:flex;flex-direction:column}.topbar{position:sticky;top:0;z-index:20;height:76px;display:flex;align-items:center;gap:60px;padding:0 max(calc((100vw - 1160px)/2),32px);border-bottom:1px solid #e8edf3;background:#fff}.brand{display:flex;align-items:center;gap:11px;color:#1d2d42;text-decoration:none;font-size:20px;font-weight:760;letter-spacing:-.6px;white-space:nowrap}.brand-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:#e9f3ff;color:#2472cc;font-size:22px;font-weight:800}.brand-accent{color:#367fd0}.brand small,.account-name small{display:block;margin-top:2px;color:#8b98a8;font-size:8px;font-weight:700;letter-spacing:1.3px}.main-nav{height:100%;display:flex;align-items:center;gap:28px}.main-nav button{height:100%;position:relative;padding:0;border:0;background:transparent;color:#6e7e91;font-size:13px;font-weight:550}.main-nav button.active{color:#256fc1}.main-nav button.active::after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:#347fd0;content:""}.account{display:flex;align-items:center;gap:10px;margin-left:auto}.avatar{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#e9f1fc;color:#3978b8;font-size:12px;font-weight:750}.account-name{font-size:12px;font-weight:650}.account-name small{font-size:10px;font-weight:450;letter-spacing:0}.button-quiet{padding:9px 13px;border:1px solid #dfe6ef;border-radius:8px;background:#fff;color:#46566a;font-size:12px;font-weight:600}.signout{margin-left:10px}.top-signin{margin-left:auto}.app main{width:min(100% - 48px,1120px);margin:0 auto;flex:1}.welcome-layout{min-height:calc(100vh - 140px);display:grid;grid-template-columns:1fr 440px;align-items:center;gap:90px;padding:48px 0}.welcome-copy{padding:0 10px}.eyebrow{margin:0 0 13px;color:#5c88b9;font-size:10px;font-weight:750;letter-spacing:1.3px}.live-dot{width:7px;height:7px;display:inline-block;margin-right:6px;border-radius:50%;background:#4ba981;box-shadow:0 0 0 3px #e3f3eb}.welcome-copy h1{margin:20px 0;color:#203653;font-size:54px;line-height:1.1;letter-spacing:-2.5px}.welcome-copy h1 span{color:#4286ce}.welcome-copy>p{max-width:505px;color:#738195;font-size:16px;line-height:1.7}.welcome-points{display:grid;gap:20px;margin-top:35px}.welcome-points>div{display:flex;align-items:flex-start;gap:13px}.point-icon{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#e7f4ed;color:#3b9971;font-weight:800}.welcome-points b,.welcome-points small{display:block}.welcome-points b{font-size:13px}.welcome-points small{max-width:370px;margin-top:4px;color:#7d8b9d;font-size:12px;line-height:1.5}.trust-note{margin-top:40px;padding:12px 14px;border-left:2px solid #84bb9f;background:#f0f7f2;color:#657968;font-size:11px}.trust-note span{margin-right:5px}.auth-card{padding:32px;border:1px solid #e8edf3;border-radius:16px;background:#fff;box-shadow:0 14px 45px #2c496312}.auth-card-heading{text-align:center}.auth-symbol{width:45px;height:45px;display:grid;place-items:center;margin:0 auto 20px;border-radius:13px;background:#eaf3ff;color:#327bc6;font-size:22px}.auth-card-heading .eyebrow{margin:0 0 8px}.auth-card-heading h2{margin:0;color:#233955;font-size:24px;letter-spacing:-.6px}.auth-card-heading>p:last-child{margin:8px 0 0;color:#8591a0;font-size:12px}.auth-form{display:grid;gap:17px;margin-top:27px}.field{min-width:0;display:grid;gap:7px}.field>span:first-child{color:#43546b;font-size:11px;font-weight:650}.field input,.field select,.field textarea{width:100%;min-width:0;padding:11px 12px;border:1px solid #dce4ee;border-radius:8px;outline:none;background:#fff;color:#263951;font-size:12px}.field input:focus,.field select:focus,.field textarea:focus{border-color:#76a9df;box-shadow:0 0 0 3px #e9f3ff}.field input:disabled{background:#f6f8fb;color:#758398}.field textarea{resize:vertical;line-height:1.6}.button-primary{min-height:41px;display:inline-flex;justify-content:center;align-items:center;gap:12px;padding:0 17px;border:0;border-radius:8px;background:#347dca;color:#fff;font-size:12px;font-weight:700;transition:background .15s,transform .15s}.button-primary:hover:not(:disabled){background:#246cb8;transform:translateY(-1px)}.button-primary span:last-child{font-size:17px}.auth-submit{width:100%;margin-top:3px}.auth-submit span{margin-left:auto}.auth-switch{margin:20px 0 0;color:#798699;text-align:center;font-size:11px}.auth-switch button,.text-link{padding:0;border:0;background:transparent;color:#347dca;font-size:inherit;font-weight:700}.privacy-caption{margin:22px 0 0;color:#9aa4b1;text-align:center;font-size:9px;line-height:1.6}.notice{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:20px 0 0;padding:12px 15px;border-radius:8px;font-size:12px}.notice button{border:0;background:transparent;font-size:18px}.error-notice{background:#fff0ee;color:#a94438}.error-notice button{color:inherit}.success-notice{background:#edf8f0;color:#287349}.success-notice button{color:inherit}.page-content{padding:38px 0 60px}.welcome-banner{min-height:186px;display:flex;justify-content:space-between;align-items:center;padding:32px 40px;border:1px solid #dceafb;border-radius:15px;background:linear-gradient(110deg,#edf5ff,#f6f9ff 65%,#edf7f5)}.welcome-banner .eyebrow{margin-bottom:10px}.welcome-banner h1,.page-intro h1{margin:0;color:#233955;font-size:31px;letter-spacing:-1.1px}.welcome-banner>div>p:last-child,.page-intro>p:last-child{margin:8px 0 0;color:#7c8a9d;font-size:13px}.welcome-banner .button-primary{min-height:43px}.banner-illustration{width:72px;height:72px;display:grid;place-items:center;border-radius:50%;background:#e0eee8;color:#429172;font-size:45px}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0 39px}.stat-card{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid #e9edf3;border-radius:11px;background:#fff}.stat-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:10px;font-size:18px}.stat-icon.blue{background:#edf4ff;color:#4b85cf}.stat-icon.amber{background:#fff6e4;color:#ca9841}.stat-icon.violet{background:#f1efff;color:#8178c7}.stat-icon.green{background:#e9f6ef;color:#53a17b}.stat-card small,.stat-card b{display:block}.stat-card small{color:#8390a1;font-size:10px}.stat-card b{margin-top:4px;color:#263a55;font-size:22px}.section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:14px}.section-heading .eyebrow{margin:0 0 5px}.section-heading h2{margin:0;color:#293c56;font-size:18px;letter-spacing:-.3px}.text-link{font-size:11px}.text-link span{margin-left:5px;font-size:16px}.complaint-table-wrap{overflow:auto;border:1px solid #e7ecf2;border-radius:11px;background:#fff}.complaint-table{width:100%;border-collapse:collapse;text-align:left}.complaint-table th{padding:12px 18px;border-bottom:1px solid #edf0f4;background:#fbfcfe;color:#8a96a6;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}.complaint-table td{padding:14px 18px;border-bottom:1px solid #f0f2f5;color:#59697e;font-size:11px;white-space:nowrap}.complaint-table tr:last-child td{border-bottom:0}.complaint-title{display:block;padding:0;border:0;background:transparent;color:#2c4565;font-size:12px;font-weight:700;text-align:left}.complaint-title:hover{color:#347dca;text-decoration:underline}.reference-text{display:block;margin-top:4px;color:#8e9aaa;font-size:9px}.student-name{display:block;color:#394d67;font-size:11px;font-weight:600}.date-cell{color:#718095!important}.status-badge{display:inline-flex;align-items:center;padding:5px 8px;border-radius:20px;font-size:9px;font-weight:700}.status-pending{background:#fff5dc;color:#a5791c}.status-in-progress{background:#eaf3ff;color:#397bc3}.status-resolved{background:#e8f6ed;color:#388559}.status-select{padding:6px 24px 6px 8px;border:1px solid #dfe6ef;border-radius:6px;background:#fff;color:#53647a;font-size:10px}.empty-state{display:flex;flex-direction:column;align-items:center;padding:45px 20px;border:1px dashed #d8e1eb;border-radius:12px;background:#fff;text-align:center}.empty-illustration{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:#edf4fc;color:#6793c1;font-size:28px}.empty-state h3{margin:13px 0 5px;color:#334963;font-size:16px}.empty-state p{margin:0 0 15px;color:#8290a1;font-size:12px}.button-outline{padding:9px 14px;border:1px solid #bfd3e8;border-radius:7px;background:#fff;color:#397abc;font-size:11px;font-weight:650}.narrow-content{max-width:760px;margin:0 auto}.back-link{margin-bottom:25px;padding:0;border:0;background:transparent;color:#6d8097;font-size:11px}.page-intro{margin-bottom:23px}.page-intro .eyebrow{margin-bottom:8px}.page-intro h1{font-size:29px}.panel{padding:23px;border:1px solid #e7ecf2;border-radius:11px;background:#fff}.panel-heading{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid #eef1f5}.panel-icon{width:37px;height:37px;display:grid;place-items:center;border-radius:9px;background:#eaf3ff;color:#347dca;font-size:19px}.panel-heading h2{margin:0;color:#314661;font-size:15px}.panel-heading p{margin:4px 0 0;color:#8995a4;font-size:10px}.required{color:#d66c65}.optional{color:#9aa4b0;font-size:10px;font-weight:400}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-top:19px}.full-field{grid-column:1/-1}.field-hint{color:#909ba9;font-size:9px}.upload-box{min-height:67px;position:relative;display:flex;align-items:center;gap:12px;padding:12px;border:1px dashed #cbd9e7;border-radius:8px;background:#fafcff}.upload-box input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.upload-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:8px;background:#edf4fc;color:#4a84bf;font-size:19px}.upload-box b,.upload-box small{display:block}.upload-box b{color:#4a5e77;font-size:11px}.upload-box small{margin-top:4px;color:#929eac;font-size:9px}.form-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:23px;padding-top:18px;border-top:1px solid #eef1f5}.form-footer p{margin:0;color:#798797;font-size:10px}.form-footer p span{margin-right:5px}.horizontal-intro{display:flex;justify-content:space-between;align-items:center;margin-bottom:27px}.horizontal-intro .page-intro{margin:0}.filter-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.filter-group{display:flex;gap:4px;padding:4px;border:1px solid #e8edf3;border-radius:8px;background:#fff}.filter-group button{padding:8px 11px;border:0;border-radius:6px;background:transparent;color:#778496;font-size:10px}.filter-group button.selected{background:#edf4fc;color:#367ac0;font-weight:700}.filter-group button span{margin-left:6px;color:#9ca8b6}.refresh-button{padding:8px 11px}.track-search{display:grid;grid-template-columns:1fr auto;align-items:end;gap:12px;margin-bottom:18px;padding:16px}.detail-heading{display:flex;justify-content:space-between;align-items:center;padding-bottom:17px;border-bottom:1px solid #edf0f4}.detail-heading .eyebrow{margin:0 0 5px;font-size:9px}.detail-heading h2{margin:0;color:#2b405d;font-size:20px;letter-spacing:.5px}.detail-meta{display:flex;gap:60px;padding:17px 0;border-bottom:1px solid #edf0f4}.detail-meta span{color:#8a96a5;font-size:10px}.detail-meta strong{display:block;margin-top:5px;color:#40546e;font-size:11px}.detail-description{padding:17px 0;border-bottom:1px solid #edf0f4}.detail-description h3,.updates h3{margin:0 0 8px;color:#42566f;font-size:11px}.detail-description p{margin:0;color:#63748a;font-size:11px;line-height:1.65;white-space:pre-wrap}.evidence-link{display:inline-block;margin-top:13px;color:#347dca;font-size:11px;text-decoration:none}.updates{padding-top:19px}.updates ol{display:grid;gap:0;margin:0;padding:0;list-style:none}.updates li{position:relative;display:flex;gap:12px;padding:12px 0}.updates li:not(:last-child)::after{position:absolute;top:25px;bottom:-5px;left:5px;width:1px;background:#e4eaf1;content:""}.update-dot{z-index:1;width:11px;height:11px;flex:none;margin-top:2px;border:3px solid #82b8a1;border-radius:50%;background:#fff}.updates li b,.updates li small{display:block}.updates li b{color:#40546f;font-size:11px}.updates li small{margin-top:4px;color:#909baa;font-size:9px}.updates li p{margin:6px 0 0;color:#68798e;font-size:10px;line-height:1.5}.footer{width:min(100% - 48px,1120px);display:flex;justify-content:space-between;gap:16px;margin:0 auto;padding:17px 0 20px;border-top:1px solid #e7ecf2;color:#95a0ad;font-size:9px}
.status-note{display:block;width:160px;margin-top:5px;padding:6px 8px;border:1px solid #e3e9f0;border-radius:6px;color:#53647a;font-size:9px}.status-note:focus{border-color:#76a9df;outline:none}
.error-notice .notice-retry{border:1px solid currentColor;border-radius:6px;padding:6px 10px;font-size:11px}
@media(max-width:900px){.topbar{gap:24px;padding:0 24px}.main-nav{gap:16px}.welcome-layout{grid-template-columns:1fr 390px;gap:35px}.welcome-copy h1{font-size:45px}.app main{width:min(100% - 36px,1120px)}}
@media(max-width:700px){.topbar{height:auto;min-height:68px;flex-wrap:wrap;gap:0;padding:12px 18px}.brand{font-size:18px}.main-nav{order:3;width:100%;height:43px;justify-content:space-between;gap:10px;overflow-x:auto}.main-nav button{flex:none;font-size:11px}.main-nav button.active::after{bottom:0}.account{margin-left:auto}.account-name{display:none}.signout{margin-left:0}.app main{width:calc(100% - 32px)}.welcome-layout{min-height:auto;grid-template-columns:1fr;gap:30px;padding:44px 0}.welcome-copy{padding:0}.welcome-copy h1{font-size:43px}.welcome-copy>p{font-size:14px}.auth-card{padding:25px}.page-content{padding:27px 0 40px}.welcome-banner{min-height:0;gap:14px;padding:24px;align-items:flex-start}.welcome-banner h1{font-size:25px}.welcome-banner>div>p:last-child{font-size:11px;line-height:1.5}.welcome-banner .button-primary{flex:none;padding:0 10px;font-size:10px}.banner-illustration{display:none}.stats-grid{grid-template-columns:1fr 1fr;gap:9px;margin-bottom:30px}.stat-card{gap:9px;padding:12px}.stat-icon{width:32px;height:32px}.stat-card small{font-size:9px}.stat-card b{font-size:19px}.section-heading h2{font-size:16px}.complaint-table th,.complaint-table td{padding:12px 10px}.complaint-table th{font-size:8px}.complaint-table td{font-size:10px}.horizontal-intro{align-items:flex-start;gap:10px}.horizontal-intro .button-primary{min-height:37px;padding:0 10px;font-size:10px}.page-intro h1{font-size:25px}.page-intro>p:last-child{line-height:1.5}.panel{padding:17px}.form-grid{grid-template-columns:1fr;gap:14px}.full-field{grid-column:auto}.form-footer{align-items:flex-start;flex-direction:column}.form-footer .button-primary{width:100%}.filter-group{max-width:calc(100vw - 115px);overflow:auto}.filter-group button{flex:none;padding:8px}.refresh-button{flex:none}.track-search{grid-template-columns:1fr}.track-search .button-primary{width:100%}.detail-meta{gap:30px}.footer{width:calc(100% - 32px);flex-direction:column;gap:6px}}
.public-home{min-height:calc(100vh - 140px);display:flex;flex-direction:column;justify-content:center;padding:56px 0 44px}.public-hero{display:grid;grid-template-columns:1fr 420px;align-items:center;gap:100px}.public-copy{padding:0 10px}.public-copy h1{margin:21px 0;color:#203653;font-size:62px;line-height:1.02;letter-spacing:-3px}.public-copy h1 span{color:#347dca}.public-copy>p{max-width:480px;color:#738195;font-size:16px;line-height:1.75}.public-hero-actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:28px}.public-hero-actions .button-primary,.public-hero-actions .button-outline{min-height:46px;padding:0 20px}.public-trust{display:flex;align-items:center;gap:9px;margin-top:25px;color:#7c8a9d;font-size:11px}.public-trust>span{width:19px;height:19px;display:grid;place-items:center;border-radius:50%;background:#e7f4ed;color:#3b9971;font-weight:800}.public-trust i{width:3px;height:3px;border-radius:50%;background:#b7c1cc}.public-action-card{padding:23px;border:1px solid #e4eaf1;border-radius:16px;background:#fff;box-shadow:0 18px 50px #2c496310}.action-card-heading{display:flex;align-items:center;gap:13px;padding:2px 3px 19px}.action-card-heading b,.action-card-heading small,.action-card-link b,.action-card-link small{display:block}.action-card-heading b{color:#233955;font-size:15px}.action-card-heading small{margin-top:5px;color:#8a96a6;font-size:11px}.action-card-link{width:100%;display:flex;align-items:center;gap:13px;padding:14px 3px;border:0;border-top:1px solid #edf0f4;background:#fff;text-align:left}.action-card-link:hover .action-arrow{color:#347dca;transform:translateX(3px)}.action-card-icon{width:37px;height:37px;display:grid;place-items:center;border-radius:10px;background:#edf4ff;color:#347dca;font-size:20px}.action-card-link b{color:#344961;font-size:12px}.action-card-link small{margin-top:4px;color:#8a96a6;font-size:10px}.action-arrow{margin-left:auto;color:#9aa7b6;font-size:18px;transition:transform .15s}.action-card-note{margin:12px 0 0;padding:12px;border-radius:8px;background:#f2f7f3;color:#728478;font-size:10px}.public-feature-row{display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-top:48px;padding-top:23px;border-top:1px solid #e6ebf1}.public-feature-row article{display:flex;gap:12px;align-items:flex-start}.public-feature-row article>span{color:#7ca6d0;font-size:11px;font-weight:750}.public-feature-row b,.public-feature-row small{display:block}.public-feature-row b{color:#344961;font-size:11px}.public-feature-row small{max-width:260px;margin-top:5px;color:#8491a1;font-size:10px;line-height:1.5}.guest-track-link{margin:13px 0 0;text-align:center;font-size:11px}.guest-track-link button{padding:0;border:0;background:transparent;color:#347dca;font-size:inherit;font-weight:650}.guest-track-link button:hover{text-decoration:underline}@media(max-width:900px){.public-hero{grid-template-columns:1fr 360px;gap:34px}.public-copy h1{font-size:53px}.public-home{padding-top:35px}.public-feature-row{gap:14px}}@media(max-width:700px){.public-home{min-height:auto;padding:35px 0}.public-hero{grid-template-columns:1fr;gap:30px}.public-copy{padding:0}.public-copy h1{font-size:46px;letter-spacing:-2px}.public-copy>p{font-size:14px}.public-action-card{padding:18px}.public-feature-row{grid-template-columns:1fr;gap:16px;margin-top:27px;padding-top:19px}.public-feature-row small{max-width:none}}
.school-logo-small{width:42px;height:42px;flex:none;border:1px solid #e6ebf1;border-radius:50%;background:#fff;object-fit:contain}.landing-school-logo{width:104px;height:104px;display:block;margin-bottom:14px;border:1px solid #e5e9f0;border-radius:50%;background:#fff;object-fit:contain;box-shadow:0 9px 24px #213d5c14}.public-brand-lockup{display:flex;flex-direction:column;align-items:center;margin-bottom:38px;text-align:center}.public-brand-lockup h1{max-width:100%;margin:0;color:#203653;font-size:clamp(25px,3.2vw,36px);font-weight:780;line-height:1.2;letter-spacing:-1.2px}.public-brand-lockup p{margin:8px 0 0;color:#6484a6;font-size:15px;font-weight:550;letter-spacing:.25px}.public-copy,.public-hero{min-width:0}.public-copy h1{overflow-wrap:anywhere}.public-copy>p{margin-top:9px}.public-hero{gap:80px}@media(max-width:900px){.public-hero{gap:34px}.public-brand-lockup{margin-bottom:28px}}@media(max-width:700px){body{overflow-x:hidden}.topbar .brand{min-width:0;gap:8px;font-size:16px}.school-logo-small{width:36px;height:36px}.public-home{padding-top:28px}.public-brand-lockup{margin-bottom:26px}.public-brand-lockup h1{max-width:340px;font-size:clamp(24px,7vw,30px);letter-spacing:-.8px}.public-brand-lockup p{font-size:14px}.landing-school-logo{width:82px;height:82px;margin-bottom:12px}.public-hero,.public-feature-row{width:100%;min-width:0}.public-action-card{min-width:0}.action-card-link{min-width:0}.action-card-link>span:nth-child(2){min-width:0}}
.icon-nav-button{width:36px;height:36px;flex:none;display:grid;place-items:center;padding:0;border:1px solid #ffffff70;border-radius:9px;background:#ffffff14;color:#fff;font-size:21px;line-height:1;transition:background .15s,transform .15s}.icon-nav-button:hover{background:#ffffff2b;transform:translateX(-2px)}.icon-nav-button:focus-visible{outline:3px solid #87ceeb;outline-offset:2px}.topbar:has(.icon-nav-button){gap:14px}
:root{color:#18315d;background:#eaf6ff}.app{background:#eaf6ff}.topbar{border-bottom-color:#17439a;background:#17439a}.brand{color:#fff}.brand small,.account-name small{color:#c8e7ff}.main-nav button{color:#c8e7ff}.main-nav button.active{color:#fff}.main-nav button.active::after{background:#87ceeb}.avatar{background:#d9efff;color:#17439a}.account-name{color:#fff}.topbar .button-quiet{border-color:#ffffff7a;background:#fff;color:#17439a}.topbar .button-quiet:hover{background:#eaf6ff}.public-home,.page-content,.welcome-layout{color:#18315d}.public-home{background:#eaf6ff}.public-brand-lockup{padding:24px 18px;border:1px solid #c8e7ff;border-radius:16px;background:#17439a}.public-brand-lockup h1{color:#fff}.public-brand-lockup p{color:#c8e7ff}.public-brand-lockup .landing-school-logo{border-color:#fff}.public-copy .eyebrow{color:#245bb7}.public-copy h1{color:#17439a}.public-copy>p,.public-feature-row small{color:#4c6589}.public-feature-row{border-color:#c8e7ff}.public-feature-row article>span{color:#17439a}.public-feature-row b{color:#18315d}.public-action-card,.auth-card,.panel,.stat-card,.complaint-table-wrap,.filter-bar{border-color:#c8e7ff;background:#fff}.action-card-heading b,.action-card-link b{color:#18315d}.action-card-link{border-top-color:#e1f2ff;background:#fff}.action-card-icon,.brand-icon,.auth-symbol{background:#dff2ff;color:#17439a}.button-primary{background:#17439a}.button-primary:hover:not(:disabled){background:#10357d}.button-outline,.button-quiet{border-color:#76bdf0;background:#fff;color:#17439a}.button-outline:hover,.button-quiet:hover{background:#e4f4ff}.footer{color:#eaf6ff}.footer span:first-child{color:#fff}.footer{border-color:#17439a;background:#17439a}.status-pending{background:#fff5dc;color:#84600e}.status-in-progress{background:#e5f3ff;color:#17439a}.status-resolved{background:#e8f6ed;color:#26734b}.page-intro h1,.welcome-banner h1,.section-heading h2{color:#17439a}.welcome-banner{border-color:#b8e2ff;background:linear-gradient(110deg,#d9efff,#edf8ff 65%,#fff)}.notice{border:1px solid #c8e7ff}.field input:focus,.field select:focus,.field textarea:focus{border-color:#4d9be0;box-shadow:0 0 0 3px #dff2ff}.school-logo-small{border-color:#fff}@media(max-width:700px){.public-brand-lockup{padding:20px 13px}.topbar .main-nav{background:#17439a}.topbar:has(.icon-nav-button){gap:8px}.topbar:has(.icon-nav-button) .brand{font-size:14px}.icon-nav-button{width:32px;height:32px}}
.public-brand-lockup{position:relative;isolation:isolate;justify-content:center;min-height:clamp(280px,28vw,350px);margin:0 0 38px;padding:28px 24px;overflow:hidden;border-color:#17439a;background:#17439a url('/mater-dei-campus.png') center center/cover no-repeat}.public-brand-lockup::before{position:absolute;z-index:-1;inset:0;background:linear-gradient(180deg,#102a5b24 0%,#102a5b0a 38%,#102a5bc9 100%);content:""}.public-brand-lockup .landing-school-logo{width:90px;height:90px;margin-bottom:14px;border-color:#fff;box-shadow:0 5px 18px #102a5b40}.public-brand-lockup h1{color:#fff;font-size:clamp(26px,4vw,42px);text-shadow:0 2px 12px #102a5b8c}.public-brand-lockup p{color:#e5f5ff;font-size:17px;text-shadow:0 1px 8px #102a5b}
@media(max-width:700px){.public-brand-lockup{min-height:280px;margin-bottom:26px;padding:22px 15px;background-position:center center}.public-brand-lockup .landing-school-logo{width:72px;height:72px}.public-brand-lockup h1{max-width:360px;font-size:clamp(24px,7vw,32px)}.public-brand-lockup p{font-size:15px}}
.icon-nav-button:disabled{cursor:not-allowed;opacity:.48;transform:none}
.footer{display:flex;justify-content:space-between;gap:16px;padding:8px 24px 12px;color:#8190a4;font-size:10px;background:#f8fafc;border-top:1px solid #e9edf3}.footer span{display:block}.app main{padding-bottom:20px}</style>