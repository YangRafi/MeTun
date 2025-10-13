<template>
  <div class="space-y-4">
    <!-- Uczelnia -->
    <div>
      <label class="block font-semibold mb-1">Uczelnia</label>
      <input
        v-model="searchQuery"
        @input="onSearch"
        type="text"
        placeholder="Wpisz nazwę uczelni..."
        class="w-full p-2 rounded-lg bg-black/20 border border-yellow-400 text-white"
      />

      <!-- Podpowiedzi -->
      <ul
        v-if="suggestions.length > 0"
        class="bg-black/70 border border-yellow-400 rounded-lg mt-1 max-h-60 overflow-y-auto"
      >
        <li
          v-for="uni in suggestions"
          :key="uni.university_id"
          @click="selectUniversity(uni)"
          class="p-2 cursor-pointer hover:bg-yellow-500/20"
        >
          {{ uni.university_name }}
        </li>
      </ul>
    </div>

    <!-- Wydział -->
    <div v-if="selectedUniversity">
      <label class="block font-semibold mb-1">Wydział</label>
      <select
        v-model="selectedFaculty"
        @change="onFacultyChange"
        class="w-full p-2 rounded-lg bg-black/20 border border-yellow-400 text-white"
      >
        <option disabled value="">-- wybierz wydział --</option>
        <option v-for="f in faculties" :key="f.faculty_id" :value="f">
          {{ f.faculty_name }}
        </option>
      </select>
    </div>

    <!-- Kierunek -->
    <div v-if="selectedFaculty">
      <label class="block font-semibold mb-1">Kierunek</label>
      <select
        v-model="selectedDiscipline"
        class="w-full p-2 rounded-lg bg-black/20 border border-yellow-400 text-white"
      >
        <option disabled value="">-- wybierz kierunek --</option>
        <option v-for="d in disciplines" :key="d.discipline_id" :value="d">
          {{ d.discipline_name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')
const suggestions = ref([])
const selectedUniversity = ref(null)
const faculties = ref([])
const selectedFaculty = ref(null)
const disciplines = ref([])
const selectedDiscipline = ref(null)

// 🔹 opóźnienie wyszukiwania, żeby nie spamować backendu
let searchTimeout = null

const onSearch = () => {
  clearTimeout(searchTimeout)
  if (!searchQuery.value) {
    suggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(searchQuery.value)}`)
      if (!res.ok) throw new Error('Błąd wyszukiwania')
      suggestions.value = await res.json()
    } catch (err) {
      console.error('❌ Błąd pobierania uczelni:', err)
    }
  }, 300)
}

const selectUniversity = async (uni) => {
  selectedUniversity.value = uni
  searchQuery.value = uni.university_name
  suggestions.value = []

  try {
    const res = await fetch(`http://localhost:3000/api/faculties/byUniversity/${uni.university_id}`)
    if (!res.ok) throw new Error('Błąd ładowania wydziałów')
    faculties.value = await res.json()
  } catch (err) {
    console.error('❌ Błąd pobierania wydziałów:', err)
  }
}

const onFacultyChange = async () => {
  if (!selectedFaculty.value) return
  try {
    const res = await fetch(`http://localhost:3000/api/disciplines/byFaculty/${selectedFaculty.value.faculty_id}`)
    if (!res.ok) throw new Error('Błąd ładowania kierunków')
    disciplines.value = await res.json()
  } catch (err) {
    console.error('❌ Błąd pobierania kierunków:', err)
  }
}
</script>

<style scoped>
/* delikatne efekty hover */
li:hover {
  transition: background 0.2s;
}
</style>
