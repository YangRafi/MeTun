<template>
  <div class="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700 text-white flex flex-col">
    <!-- HEADER -->
    <UserHeader :profile="profile" />

    <!-- MAIN CONTENT -->
    <div class="flex flex-1 overflow-hidden">
      <!-- LEFT SIDEBAR: lista dopasowań + filtry -->
      <aside class="w-1/4 bg-black/30 backdrop-blur-md p-4 flex flex-col">
        <!-- Filtry -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Twoje dopasowania</h2>
          <button
            @click="toggleFilters"
            class="px-2 py-1 bg-yellow-400/20 rounded hover:bg-yellow-400/40"
          >
            Filtry
          </button>
        </div>

        <div v-if="showFilters" class="mb-4 p-2 bg-black/20 rounded">
          <label class="block mb-1">Płeć:</label>
          <select v-model="filters.gender" class="w-full mb-2 text-black rounded px-2 py-1">
            <option value="">Wszystkie</option>
            <option value="male">Mężczyzna</option>
            <option value="female">Kobieta</option>
          </select>

          <label class="block mb-1">Uczelnia:</label>
          <input
            v-model="filters.university"
            type="text"
            placeholder="Wpisz uczelnię"
            class="w-full mb-2 text-black rounded px-2 py-1"
          />

          <label class="block mb-1">Wydział:</label>
          <input
            v-model="filters.faculty"
            type="text"
            placeholder="Wpisz wydział"
            class="w-full text-black rounded px-2 py-1"
          />
        </div>

        <!-- Lista dopasowań -->
        <div class="flex-1 overflow-y-auto">
          <ul>
            <li
              v-for="match in filteredMatches"
              :key="match.id"
              @click="selectMatch(match)"
              :class="['cursor-pointer p-2 rounded-lg mb-2 flex items-center', selectedMatch?.id === match.id ? 'bg-yellow-400/30' : 'hover:bg-yellow-400/20']"
            >
              <img
                v-if="match.profile_picture"
                :src="'http://localhost:3000' + match.profile_picture"
                class="w-10 h-10 rounded-full mr-2 object-cover"
              />
              <div>
                <div>{{ match.name }}</div>
                <div class="text-sm text-white/60">{{ match.university || '' }}</div>
              </div>
            </li>

            <li v-if="filteredMatches.length === 0" class="text-white/50 p-2">
              Brak dopasowań
            </li>
          </ul>
        </div>
      </aside>

      <!-- CENTER: czat -->
      <main class="flex-1 flex flex-col p-4">
        <ChatBox v-if="selectedMatch" :match="selectedMatch" />
        <div v-else class="flex-1 flex items-center justify-center text-white/70">
          Wybierz dopasowanie, aby rozpocząć czat
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserHeader from '../components/Layout/UserHeader.vue'
import ChatBox from '../components/Chat/ChatBox.vue'

const router = useRouter()
const profile = reactive({})
const matches = ref([])
const selectedMatch = ref(null)

const showFilters = ref(false)
const filters = reactive({
  gender: '',
  university: '',
  faculty: ''
})

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const filteredMatches = computed(() => {
  return matches.value.filter(match => {
    const genderOk = !filters.gender || match.gender === filters.gender
    const universityOk = !filters.university || match.university?.toLowerCase().includes(filters.university.toLowerCase())
    const facultyOk = !filters.faculty || match.faculty?.toLowerCase().includes(filters.faculty.toLowerCase())
    return genderOk && universityOk && facultyOk
  })
})

const fetchUser = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Nie zalogowany')
    const data = await res.json()
    Object.assign(profile, data)
  } catch {
    router.push('/')
  }
}

const fetchMatches = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/matches', {
      method: 'GET',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Błąd ładowania dopasowań')
    const data = await res.json()
    matches.value = data
  } catch (err) {
    console.error(err)
  }
}

const selectMatch = (match) => {
  selectedMatch.value = match
}

onMounted(() => {
  fetchUser()
  fetchMatches()
})
</script>
