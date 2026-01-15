<template>
  <section class="animate-fade-in p-15">
    <div class="flex justify-between mb-6 items-center">
      <h2 class="text-2xl font-semibold">🏫 Zarządzanie uczelniami</h2>
      <button
        @click="$router.push('/admin')"
        class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded relative z-10"
      >
        ⬅ Wróć
      </button>
    </div>

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

    <div class="flex gap-2 mb-6">
      <input
        v-model="searchQuery"
        placeholder="Szukaj uczelni..."
        class="px-4 py-2 rounded w-1/3 bg-gray-700 text-white"
        @input="applyFilters"
      />
    </div>

    <div class="space-y-4">
      <div
        v-for="uni in universities"
        :key="uni.university_id"
        class="bg-gray-800 p-4 rounded-lg shadow-lg"
      >
        <div class="flex justify-between items-center">
          <span
            class="font-semibold cursor-pointer"
            @click="toggleUniversity(uni.university_id)"
          >
            {{ uni.university_name }} ({{ uni.type || '-' }}, {{ uni.location || '-' }})
          </span>
          <div class="space-x-2">
            <button @click.stop="openEditUniversityModal(uni)" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Edytuj</button>
            <button @click.stop="confirmDeleteUniversity(uni)" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Usuń</button>
          </div>
        </div>

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
                <button @click.stop="openEditFacultyModal(fac)" class="bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded text-sm">Edytuj</button>
                <button @click.stop="confirmDeleteFaculty(fac)" class="bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded text-sm">Usuń</button>
              </div>
            </div>

            <div v-if="fac.show" class="mt-1 pl-4 space-y-1">
              <div
                v-for="disc in fac.disciplines"
                :key="disc.discipline_id"
                class="flex justify-between items-center bg-gray-600 p-1 rounded"
              >
                <span>{{ disc.name || '-' }}</span>
                <div class="space-x-1">
                  <button @click.stop="openEditDisciplineModal(disc)" class="bg-blue-400 hover:bg-blue-500 px-2 py-0.5 rounded text-sm">Edytuj</button>
                  <button @click.stop="confirmDeleteDiscipline(disc)" class="bg-red-400 hover:bg-red-500 px-2 py-0.5 rounded text-sm">Usuń</button>
                </div>
              </div>

              <div class="flex gap-2 mt-1">
                <input v-model="newDiscipline[fac.faculty_id]" placeholder="Nowy kierunek" class="px-2 py-1 rounded bg-gray-700 text-white w-1/2" />
                <button @click="addDiscipline(fac.faculty_id)" class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm">Dodaj</button>
              </div>
            </div>
          </div>

          <div class="flex gap-2 mt-2">
            <input v-model="newFaculty[uni.university_id]" placeholder="Nowy wydział" class="px-2 py-1 rounded bg-gray-700 text-white w-1/2" />
            <button @click="addFaculty(uni.university_id)" class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm">Dodaj wydział</button>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showEditUniversity" header="Edytuj uczelnię" modal>
      <div class="flex flex-col gap-3">
        <input v-model="editUniversityData.name" placeholder="Nazwa uczelni" class="px-3 py-2 rounded w-full bg-gray-200"/>
        <input v-model="editUniversityData.location" placeholder="Miasto" class="px-3 py-2 rounded w-full bg-gray-200"/>
        <select v-model="editUniversityData.type" class="px-3 py-2 rounded w-full bg-gray-200">
          <option>Publiczna</option>
          <option>Prywatna</option>
        </select>
        <div class="flex justify-end gap-2 mt-2">
          <button @click="showEditUniversity = false" class="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500">Anuluj</button>
          <button @click="saveUniversityEdit" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Zapisz</button>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showEditFaculty" header="Edytuj wydział" modal>
      <div class="flex flex-col gap-3">
        <input v-model="editFacultyData.name" placeholder="Nazwa wydziału" class="px-3 py-2 rounded w-full bg-gray-200"/>
        <div class="flex justify-end gap-2 mt-2">
          <button @click="showEditFaculty = false" class="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500">Anuluj</button>
          <button @click="saveFacultyEdit" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Zapisz</button>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showEditDiscipline" header="Edytuj kierunek" modal>
      <div class="flex flex-col gap-3">
        <input v-model="editDisciplineData.name" placeholder="Nazwa kierunku" class="px-3 py-2 rounded w-full bg-gray-200"/>
        <div class="flex justify-end gap-2 mt-2">
          <button @click="showEditDiscipline = false" class="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500">Anuluj</button>
          <button @click="saveDisciplineEdit" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Zapisz</button>
        </div>
      </div>
    </Dialog>

    <Toast ref="toast" position="top-right" />
    <ConfirmDialog />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast, useConfirm } from 'primevue'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'

const universities = ref([])
const originalUniversities = ref([])
const searchQuery = ref('')
const newUniversity = ref({ name: '', location: '', type: '' })
const newFaculty = ref({})
const newDiscipline = ref({})

const showEditUniversity = ref(false)
const editUniversityData = ref({})
const showEditFaculty = ref(false)
const editFacultyData = ref({})
const showEditDiscipline = ref(false)
const editDisciplineData = ref({})

const toast = useToast()
const confirm = useConfirm()

const toggleUniversity = (id) => {
  const uni = universities.value.find(u => u.university_id === id)
  if (uni) uni.show = !uni.show
}

const toggleFaculty = (id) => {
  universities.value.forEach(u => u.faculties.forEach(f => {
    if (f.faculty_id === id) f.show = !f.show
  }))
}

const fetchUniversities = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/universities', { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    originalUniversities.value = data
    universities.value = await buildUniversityTree(data.slice(0, 10))
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Błąd', detail: err.message, life: 3000 })
  }
}

const applyFilters = async () => {
  const query = searchQuery.value.trim().toLowerCase()
  const filtered = originalUniversities.value.filter(u =>
    u.university_name?.toLowerCase().startsWith(query)
  )
  universities.value = await buildUniversityTree(filtered.slice(0, 10))
}

const buildUniversityTree = async (universityList) => {
  return await Promise.all(universityList.map(async uni => {
    const facRes = await fetch(`http://localhost:3000/api/faculties?universityId=${uni.university_id}`, { credentials: 'include' })
    const faculties = await facRes.json()
    const facultiesWithDisc = await Promise.all(faculties.map(async f => {
      const discRes = await fetch(`http://localhost:3000/api/disciplines/byFaculty/${f.faculty_id}`, { credentials: 'include' })
      const disciplines = await discRes.json()
      return { ...f, show: false, disciplines }
    }))
    return { ...uni, show: false, faculties: facultiesWithDisc }
  }))
}

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
    toast.add({ severity: 'success', summary: 'Sukces', detail: 'Uczelnia dodana', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Błąd', detail: err.message, life: 3000 })
  }
}

const openEditUniversityModal = (uni) => {
  editUniversityData.value = { ...uni }
  showEditUniversity.value = true
}

const saveUniversityEdit = async () => {
  const uni = universities.value.find(u => u.university_id === editUniversityData.value.university_id)
  await fetch(`http://localhost:3000/api/universities/${editUniversityData.value.university_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      university_name: editUniversityData.value.university_name,
      location: editUniversityData.value.location,
      type: editUniversityData.value.type
    })
  })
  uni.university_name = editUniversityData.value.university_name
  uni.location = editUniversityData.value.location
  uni.type = editUniversityData.value.type
  showEditUniversity.value = false
  toast.add({ severity: 'success', summary: 'Sukces', detail: 'Uczelnia zaktualizowana', life: 3000 })
}

const openEditFacultyModal = (fac) => {
  editFacultyData.value = { ...fac }
  showEditFaculty.value = true
}

const saveFacultyEdit = async () => {
  const fac = universities.value.flatMap(u => u.faculties).find(f => f.faculty_id === editFacultyData.value.faculty_id)
  await fetch(`http://localhost:3000/api/faculties/${editFacultyData.value.faculty_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ faculty_name: editFacultyData.value.faculty_name, university_id: editFacultyData.value.university_id })
  })
  fac.faculty_name = editFacultyData.value.faculty_name
  showEditFaculty.value = false
  toast.add({ severity: 'success', summary: 'Sukces', detail: 'Wydział zaktualizowany', life: 3000 })
}

const openEditDisciplineModal = (disc) => {
  editDisciplineData.value = { ...disc }
  showEditDiscipline.value = true
}

const saveDisciplineEdit = async () => {
  const disc = universities.value.flatMap(u => u.faculties).flatMap(f => f.disciplines).find(d => d.discipline_id === editDisciplineData.value.discipline_id)
  await fetch(`http://localhost:3000/api/disciplines/${editDisciplineData.value.discipline_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: editDisciplineData.value.name, faculty_id: editDisciplineData.value.faculty_id })
  })
  disc.name = editDisciplineData.value.name
  showEditDiscipline.value = false
  toast.add({ severity: 'success', summary: 'Sukces', detail: 'Kierunek zaktualizowany', life: 3000 })
}

const confirmDeleteUniversity = (uni) => {
  confirm.require({
    message: `Na pewno usunąć uczelnię "${uni.university_name}"?`,
    header: 'Potwierdzenie',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      await fetch(`http://localhost:3000/api/universities/${uni.university_id}`, { method: 'DELETE', credentials: 'include' })
      universities.value = universities.value.filter(u => u.university_id !== uni.university_id)
      originalUniversities.value = originalUniversities.value.filter(u => u.university_id !== uni.university_id)
      toast.add({ severity: 'success', summary: 'Sukces', detail: 'Uczelnia usunięta', life: 3000 })
    }
  })
}

onMounted(fetchUniversities)
</script>
