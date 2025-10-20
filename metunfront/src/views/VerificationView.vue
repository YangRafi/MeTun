<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-600 text-white">
    <UserHeader :profile="profile" />

    <main class="max-w-3xl mx-auto p-6 space-y-6">
      <h1 class="text-3xl font-bold text-center mb-4">Weryfikacja studenta</h1>

      <!-- 🔹 Aktualne uczelnie i status -->
      <div v-if="userUniversities.length">
        <h2 class="text-xl font-semibold mb-2">Twoje aplikacje</h2>
        <ul class="space-y-2">
          <li v-for="u in userUniversities" :key="u.id" class="bg-white/10 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p class="font-medium">{{ u.university_name }} - {{ u.discipline_name }}</p>
              <p class="text-sm">
                Status: 
                <span :class="{
                  'text-yellow-300': u.status==='pending',
                  'text-green-400': u.status==='approved',
                  'text-red-400': u.status==='rejected'
                }">
                  {{ u.status }}
                </span>
              </p>
            </div>
            <button @click="removeApplication(u.id)" class="text-red-400 hover:text-red-600">Usuń</button>
          </li>
        </ul>
      </div>

      <!-- 🔹 Dodaj nową aplikację -->
      <div v-if="userUniversities.length < 2" class="bg-white/10 p-6 rounded-3xl space-y-4">
        <h2 class="text-xl font-semibold text-white">Dodaj uczelnię</h2>

        <!-- Wyszukiwarka uczelni -->
        <div>
          <input v-model="universityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..." 
            class="w-full p-2 rounded-lg text-black focus:ring-2 focus:ring-indigo-400"/>
          <ul v-if="universitySuggestions.length" class="bg-white text-black rounded-lg mt-1 max-h-40 overflow-y-auto shadow">
            <li v-for="u in universitySuggestions" :key="u.university_id" @click="selectUniversity(u)" 
                class="p-2 hover:bg-indigo-100 cursor-pointer">{{ u.university_name }}</li>
          </ul>
        </div>

        <!-- Wydział -->
        <div v-if="selectedUniversity">
          <label class="block mt-2 mb-1">Wydział</label>
          <select v-model="selectedFaculty" @change="fetchDisciplines" class="w-full p-2 rounded-lg text-black">
            <option value="">Wybierz...</option>
            <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
          </select>
        </div>

        <!-- Kierunek -->
        <div v-if="selectedFaculty">
          <label class="block mt-2 mb-1">Kierunek</label>
          <select v-model="selectedDiscipline" class="w-full p-2 rounded-lg text-black">
            <option value="">Wybierz...</option>
            <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
          </select>
        </div>

        <!-- Upload dokumentu -->
        <div v-if="selectedDiscipline">
          <label class="block mt-2 mb-1">Załącz dokument weryfikacyjny</label>
          <input type="file" @change="handleFile" accept="image/*,.pdf" class="text-black"/>
        </div>

        <!-- Submit -->
        <button @click="submitApplication" 
                :disabled="!selectedDiscipline || !file" 
                class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg mt-4 disabled:opacity-50">
          Wyślij do weryfikacji
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import UserHeader from '../components/Layout/UserHeader.vue'

const profile = reactive({})
const userUniversities = ref([])

// 🔹 Wyszukiwanie uczelni
const universityQuery = ref('')
const universitySuggestions = ref([])
const selectedUniversity = ref(null)
const selectedFaculty = ref('')
const selectedDiscipline = ref('')
const faculties = ref([])
const disciplines = ref([])
const file = ref(null)

// 🔹 Fetch user profile i uczelnie
async function fetchUser() {
  const res = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
  if (!res.ok) return
  Object.assign(profile, await res.json())
  fetchUserUniversities()
}

async function fetchUserUniversities() {
  const res = await fetch('http://localhost:3000/api/user/universities', { credentials: 'include' })
  if (!res.ok) return
  userUniversities.value = await res.json()
}

onMounted(fetchUser)

// 🔹 Uczelnie / fakultety / kierunki
async function fetchUniversities() {
  if (universityQuery.value.length < 1) { universitySuggestions.value = []; return }
  const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`)
  universitySuggestions.value = await res.json()
}

function selectUniversity(u) {
  selectedUniversity.value = u
  universityQuery.value = u.university_name
  universitySuggestions.value = []
  selectedFaculty.value = ''
  selectedDiscipline.value = ''
  faculties.value = []
  disciplines.value = []
  fetchFaculties()
}

async function fetchFaculties() {
  if (!selectedUniversity.value) return
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${selectedUniversity.value.university_id}`)
  faculties.value = await res.json()
}

async function fetchDisciplines() {
  if (!selectedFaculty.value) return
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${selectedFaculty.value}`)
  disciplines.value = await res.json()
}

// 🔹 Upload dokumentu
function handleFile(e) { file.value = e.target.files[0] }

// 🔹 Submit aplikacji
async function submitApplication() {
  if (!selectedDiscipline.value || !file.value) return

  const formData = new FormData()
  formData.append('universityId', selectedUniversity.value.university_id)
  formData.append('facultyId', selectedFaculty.value)
  formData.append('disciplineId', selectedDiscipline.value)
  formData.append('document', file.value)

  await fetch('http://localhost:3000/api/user/universities', {
    method: 'POST',
    credentials: 'include',
    body: formData
  })

  // Reset
  selectedUniversity.value = null
  selectedFaculty.value = ''
  selectedDiscipline.value = ''
  file.value = null
  universityQuery.value = ''
  faculties.value = []
  disciplines.value = []

  fetchUserUniversities()
}

// 🔹 Usuń aplikację
async function removeApplication(id) {
  await fetch(`http://localhost:3000/api/user/universities/${id}`, { method: 'DELETE', credentials: 'include' })
  fetchUserUniversities()
}
</script>

<style scoped>
/* Styl do listy uczelni */
</style>
