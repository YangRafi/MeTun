<template>
  <section class="animate-fade-in p-15">
    <!-- Nagłówek -->
    <div class="flex justify-between mb-6 items-center">
      <h2 class="text-2xl font-semibold">🏫 Zarządzanie uczelniami</h2>
      <button
        @click="$router.push('/admin')"
        class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded relative z-10"
      >
        ⬅ Wróć
      </button>
    </div>

    <!-- Dodawanie uczelni -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="newUniversity.name"
        placeholder="Nazwa uczelni"
        class="px-4 py-2 rounded w-1/3 bg-gray-700 text-white"
      />
      <input
        v-model="newUniversity.location"
        placeholder="Miasto"
        class="px-4 py-2 rounded w-1/4 bg-gray-700 text-white"
      />
      <select
        v-model="newUniversity.type"
        class="px-4 py-2 rounded w-1/4 bg-gray-700 text-white"
      >
        <option disabled value="">Typ</option>
        <option>Publiczna</option>
        <option>Prywatna</option>
      </select>
      <button @click="addUniversity" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
        Dodaj
      </button>
    </div>

    <!-- Wyszukiwanie -->
    <div class="flex gap-2 mb-6">
      <input
        v-model="searchQuery"
        placeholder="Szukaj uczelni..."
        class="px-4 py-2 rounded w-1/3 bg-gray-700 text-white"
        @input="applyFilters"
      />
    </div>

    <!-- Lista uczelni -->
    <div class="space-y-4">
      <div
        v-for="uni in universities"
        :key="uni.university_id"
        class="bg-gray-800 p-4 rounded-lg shadow-lg"
      >
        <!-- Wiersz uczelni (bez cursor-pointer) -->
        <div class="flex justify-between items-center">
          <span
            class="font-semibold cursor-pointer"
            @click="toggleUniversity(uni.university_id)"
          >
            {{ uni.university_name }} ({{ uni.type || '-' }}, {{ uni.location || '-' }})
          </span>
          <div class="space-x-2">
            <button @click.stop="editUniversity(uni)" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Edytuj</button>
            <button @click.stop="deleteUniversity(uni.university_id)" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Usuń</button>
          </div>
        </div>

        <!-- Wydziały -->
        <div v-if="uni.show" class="mt-2 pl-4 space-y-2">
          <div
            v-for="fac in uni.faculties"
            :key="fac.faculty_id"
            class="bg-gray-700 p-2 rounded"
          >
            <div class="flex justify-between items-center">
              <span class="cursor-pointer" @click="toggleFaculty(fac.faculty_id)">
                {{ fac.faculty_name || '-' }}
              </span>
              <div class="space-x-2">
                <button @click.stop="editFaculty(fac)" class="bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded text-sm">Edytuj</button>
                <button @click.stop="deleteFaculty(fac.faculty_id)" class="bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded text-sm">Usuń</button>
              </div>
            </div>

            <!-- Kierunki -->
            <div v-if="fac.show" class="mt-1 pl-4 space-y-1">
              <div
                v-for="disc in fac.disciplines"
                :key="disc.discipline_id"
                class="flex justify-between items-center bg-gray-600 p-1 rounded"
              >
                <span>{{ disc.name || '-' }}</span>
                <div class="space-x-1">
                  <button @click.stop="editDiscipline(disc)" class="bg-blue-400 hover:bg-blue-500 px-2 py-0.5 rounded text-sm">Edytuj</button>
                  <button @click.stop="deleteDiscipline(disc.discipline_id)" class="bg-red-400 hover:bg-red-500 px-2 py-0.5 rounded text-sm">Usuń</button>
                </div>
              </div>

              <!-- Dodawanie kierunku -->
              <div class="flex gap-2 mt-1">
                <input v-model="newDiscipline[fac.faculty_id]" placeholder="Nowy kierunek" class="px-2 py-1 rounded bg-gray-700 text-white w-1/2" />
                <button @click="addDiscipline(fac.faculty_id)" class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm">Dodaj</button>
              </div>
            </div>
          </div>

          <!-- Dodawanie wydziału -->
          <div class="flex gap-2 mt-2">
            <input v-model="newFaculty[uni.university_id]" placeholder="Nowy wydział" class="px-2 py-1 rounded bg-gray-700 text-white w-1/2" />
            <button @click="addFaculty(uni.university_id)" class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm">Dodaj wydział</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const universities = ref([])
const originalUniversities = ref([])
const searchQuery = ref('')
const newUniversity = ref({ name: '', location: '', type: '' })
const newFaculty = ref({})
const newDiscipline = ref({})

// 🧠 Pobranie uczelni z backendu
const fetchUniversities = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/universities', { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) return console.error('Nieprawidłowa odpowiedź:', data)

    originalUniversities.value = data
    universities.value = await buildUniversityTree(data.slice(0, 10))
  } catch (err) {
    console.error('❌ Błąd pobierania uczelni:', err)
  }
}

// 🔍 Filtrowanie po prefiksie + limit 10
const applyFilters = async () => {
  const query = searchQuery.value.trim().toLowerCase()
  const filtered = originalUniversities.value.filter(u =>
    u.university_name?.toLowerCase().startsWith(query)
  )
  universities.value = await buildUniversityTree(filtered.slice(0, 10))
}

// 📦 Pomocnicza funkcja budująca strukturę (uczelnia → wydziały → kierunki)
const buildUniversityTree = async (universityList) => {
  return await Promise.all(universityList.map(async uni => {
    const facRes = await fetch(`http://localhost:3000/api/faculties?universityId=${uni.university_id}`, { credentials: 'include' })
    const faculties = await facRes.json()
    const facultiesWithDisc = await Promise.all(faculties.map(async f => {
      const discRes = await fetch(`http://localhost:3000/api/disciplines?facultyId=${f.faculty_id}`, { credentials: 'include' })
      const disciplines = await discRes.json()
      return { ...f, show: false, disciplines }
    }))
    return { ...uni, show: false, faculties: facultiesWithDisc }
  }))
}

// 🔄 Toggle’y
const toggleUniversity = (id) => {
  const uni = universities.value.find(u => u.university_id === id)
  if (uni) uni.show = !uni.show
}

const toggleFaculty = (id) => {
  universities.value.forEach(u => u.faculties.forEach(f => {
    if (f.faculty_id === id) f.show = !f.show
  }))
}

// 🏫 CRUD — Uczelnie
const addUniversity = async () => {
  if (!newUniversity.value.name || !newUniversity.value.type) return
  try {
    const res = await fetch('http://localhost:3000/api/universities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        university_name: newUniversity.value.name,
        location: newUniversity.value.location,
        type: newUniversity.value.type
      })
    })
    const uni = await res.json()
    uni.show = false
    uni.faculties = []
    universities.value.push(uni)
    originalUniversities.value.push(uni)
    newUniversity.value = { name: '', location: '', type: '' }
  } catch (err) {
    console.error('❌ Błąd dodawania uczelni:', err)
  }
}

const editUniversity = async (uni) => {
  const name = prompt('Nazwa uczelni:', uni.university_name)
  if (!name) return
  const location = prompt('Miasto:', uni.location)
  const type = prompt('Typ (Publiczna/Prywatna):', uni.type)
  await fetch(`http://localhost:3000/api/universities/${uni.university_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ university_name: name, location, type })
  })
  uni.university_name = name
  uni.location = location
  uni.type = type
}

const deleteUniversity = async (id) => {
  if (!confirm('Na pewno usunąć uczelnię?')) return
  await fetch(`http://localhost:3000/api/universities/${id}`, { method: 'DELETE', credentials: 'include' })
  universities.value = universities.value.filter(u => u.university_id !== id)
  originalUniversities.value = originalUniversities.value.filter(u => u.university_id !== id)
}

// 🧩 CRUD — Wydziały
const addFaculty = async (uniId) => {
  const name = newFaculty.value[uniId]
  if (!name) return
  const res = await fetch('http://localhost:3000/api/faculties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ faculty_name: name, university_id: uniId })
  })
  const f = await res.json()
  f.show = false
  f.disciplines = []
  universities.value.find(u => u.university_id === uniId).faculties.push(f)
  newFaculty.value[uniId] = ''
}

const editFaculty = async (fac) => {
  const name = prompt('Nazwa wydziału:', fac.faculty_name)
  if (!name) return
  await fetch(`http://localhost:3000/api/faculties/${fac.faculty_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ faculty_name: name, university_id: fac.university_id })
  })
  fac.faculty_name = name
}

const deleteFaculty = async (id) => {
  if (!confirm('Na pewno usunąć wydział?')) return
  await fetch(`http://localhost:3000/api/faculties/${id}`, { method: 'DELETE', credentials: 'include' })
  universities.value.forEach(u => { u.faculties = u.faculties.filter(f => f.faculty_id !== id) })
}

// 🎓 CRUD — Kierunki
const addDiscipline = async (facId) => {
  const name = newDiscipline.value[facId]
  if (!name) return
  const res = await fetch('http://localhost:3000/api/disciplines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, faculty_id: facId })
  })
  const disc = await res.json()
  const fac = universities.value.flatMap(u => u.faculties).find(f => f.faculty_id === facId)
  fac.disciplines.push(disc)
  newDiscipline.value[facId] = ''
}

const editDiscipline = async (disc) => {
  const name = prompt('Nazwa kierunku:', disc.name)
  if (!name) return
  await fetch(`http://localhost:3000/api/disciplines/${disc.discipline_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, faculty_id: disc.faculty_id })
  })
  disc.name = name
}

const deleteDiscipline = async (id) => {
  if (!confirm('Na pewno usunąć kierunek?')) return
  await fetch(`http://localhost:3000/api/disciplines/${id}`, { method: 'DELETE', credentials: 'include' })
  universities.value.forEach(u => u.faculties.forEach(f => {
    f.disciplines = f.disciplines.filter(d => d.discipline_id !== id)
  }))
}

onMounted(fetchUniversities)
</script>
