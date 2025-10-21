<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-blue-800">Weryfikacja studenta</h1>

    <!-- 🔹 Formularz weryfikacji -->
    <div class="bg-white shadow rounded-2xl p-6 mb-8 border border-blue-100">
      <h2 class="text-xl font-semibold mb-4 text-gray-800">Złóż wniosek o weryfikację</h2>

      <!-- 🔹 Uczelnia -->
      <div class="mb-4 relative">
        <label class="block mb-1 text-sm font-medium text-blue-800">Uczelnia</label>
        <input
          v-model="universityQuery"
          @input="fetchUniversities"
          type="text"
          placeholder="Wpisz nazwę uczelni..."
          class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"
        />
        <ul
          v-if="universitySuggestions.length > 0"
          class="absolute w-full bg-white border rounded-lg shadow mt-1 max-h-40 overflow-y-auto z-10"
        >
          <li
            v-for="u in universitySuggestions"
            :key="u.university_id"
            @click="selectUniversity(u)"
            class="p-2 hover:bg-blue-50 cursor-pointer"
          >
            {{ u.university_name }}
          </li>
        </ul>
      </div>

      <!-- 🔹 Wydział -->
      <div v-if="faculties.length > 0" class="mb-4">
        <label class="block mb-1 text-sm font-medium text-blue-800">Wydział</label>
        <select
          v-model="selectedFaculty"
          @change="fetchDisciplines"
          class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"
        >
          <option value="">Wybierz...</option>
          <option
            v-for="f in faculties"
            :key="f.faculty_id"
            :value="f.faculty_id"
          >
            {{ f.faculty_name }}
          </option>
        </select>
      </div>

      <!-- 🔹 Kierunek -->
      <div v-if="disciplines.length > 0" class="mb-4">
        <label class="block mb-1 text-sm font-medium text-blue-800">Kierunek</label>
        <select
          v-model="selectedDiscipline"
          class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"
        >
          <option value="">Wybierz...</option>
          <option
            v-for="d in disciplines"
            :key="d.discipline_id"
            :value="d.discipline_id"
          >
            {{ d.name }}
          </option>
        </select>
      </div>

      <!-- 🔹 Plik -->
      <div class="mb-4">
        <label class="block mb-1 text-sm font-medium text-blue-800">Załącz plik (np. legitymację studencką)</label>
        <input type="file" @change="onFileChange" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300" />
      </div>

      <!-- 🔹 Przycisk -->
      <button
        @click="submitVerification"
        class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
      >
        Wyślij wniosek o weryfikację
      </button>
    </div>

    <!-- 🔹 Lista wniosków -->
    <div>
      <h2 class="text-xl font-semibold mb-4 text-gray-800">Twoje wnioski</h2>

      <div v-if="applications.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="a in applications"
          :key="a.id"
          class="bg-white p-5 rounded-2xl shadow hover:shadow-md transition relative border border-blue-100"
        >
          <h3 class="font-semibold text-blue-800 text-lg">{{ a.university_name }}</h3>
          <p class="text-gray-600">{{ a.faculty_name }} / {{ a.discipline_name }}</p>
          <span
            :class="statusColor(a.status)"
            class="absolute top-4 right-4 px-2 py-1 rounded text-xs font-semibold"
          >
            {{ a.status }}
          </span>
          <p class="text-gray-400 text-sm mt-3">
            Złożono: {{ new Date(a.applied_at).toLocaleDateString() }}
          </p>
          <button
            @click="deleteApplication(a.id)"
            class="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            🗑 Usuń
          </button>
        </div>
      </div>

      <p v-else class="text-gray-500 text-center mt-6">Nie masz jeszcze żadnych wniosków.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const universityQuery = ref('')
const universitySuggestions = ref([])
const selectedUniversity = ref(null)
const faculties = ref([])
const selectedFaculty = ref('')
const disciplines = ref([])
const selectedDiscipline = ref('')
const file = ref(null)
const applications = ref([])

// 🔹 Uczelnie
async function fetchUniversities() {
  if (universityQuery.value.length < 1) {
    universitySuggestions.value = []
    return
  }
  try {
    const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`, { credentials: 'include' })
    const data = await res.json()
    universitySuggestions.value = Array.isArray(data) ? data.slice(0, 10) : []
  } catch (err) {
    console.error('Błąd pobierania uczelni:', err)
    universitySuggestions.value = []
  }
}

function selectUniversity(u) {
  selectedUniversity.value = u
  universityQuery.value = u.university_name
  universitySuggestions.value = []
  fetchFaculties(u.university_id)
}

// 🔹 Wydziały
async function fetchFaculties(universityId) {
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${universityId}`, { credentials: 'include' })
  faculties.value = await res.json()
  disciplines.value = []
  selectedFaculty.value = ''
  selectedDiscipline.value = ''
}

// 🔹 Kierunki
async function fetchDisciplines() {
  if (!selectedFaculty.value) return
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${selectedFaculty.value}`, { credentials: 'include' })
  disciplines.value = await res.json()
}

// 🔹 Upload
function onFileChange(e) {
  file.value = e.target.files[0]
}

// 🔹 Wysyłka
async function submitVerification() {
  if (!selectedUniversity.value || !selectedFaculty.value || !selectedDiscipline.value || !file.value) {
    alert('Uzupełnij wszystkie pola i dodaj plik.')
    return
  }

  const formData = new FormData()
  formData.append('universityId', selectedUniversity.value.university_id)
  formData.append('facultyId', selectedFaculty.value)
  formData.append('disciplineId', selectedDiscipline.value)
  formData.append('document', file.value) // 👈 musi być 'document' dla backendu

  const res = await fetch('http://localhost:3000/api/userUniversity', {
    method: 'POST',
    credentials: 'include',
    body: formData
  })

  if (res.ok) {
    alert('Wniosek wysłany!')
    fetchApplications()
  } else {
    const err = await res.json()
    alert('Błąd podczas wysyłania wniosku: ' + (err.error || res.statusText))
  }
}

// 🔹 Lista wniosków
async function fetchApplications() {
  try {
    const res = await fetch('http://localhost:3000/api/userUniversity/my', { credentials: 'include' })
    if (res.ok) applications.value = await res.json()
  } catch (err) {
    console.error('Błąd pobierania aplikacji:', err)
  }
}

async function deleteApplication(id) {
  if (!confirm('Na pewno usunąć wniosek?')) return
  await fetch(`http://localhost:3000/api/userUniversity/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  fetchApplications()
}

function statusColor(status) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-yellow-100 text-yellow-700'
  }
}

onMounted(fetchApplications)
</script>

<style scoped>
ul li {
  transition: background-color 0.2s;
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}
</style>
