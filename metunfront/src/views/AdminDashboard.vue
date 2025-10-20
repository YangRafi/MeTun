<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
    <!-- 🔹 Górny pasek -->
    <header class="p-6 flex justify-between items-center border-b border-gray-600">
      <h1 class="text-3xl font-bold">Panel Administratora</h1>
      <button 
        @click="logout"
        class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold">
        Wyloguj
      </button>
    </header>

    <!-- 🔹 Sekcje panelu -->
    <main class="max-w-6xl mx-auto py-10 px-6 space-y-12">
      <!-- 📊 Statystyki -->
      <section>
        <h2 class="text-2xl font-semibold mb-6">📊 Statystyki systemu</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Użytkownicy" :value="stats.users" icon="Users" />
          <StatCard title="Zweryfikowani" :value="stats.verified" icon="CheckCircle" />
          <StatCard title="Uczelnie" :value="stats.universities" icon="School" />
          <StatCard title="Grupy" :value="stats.groups" icon="UsersRound" />
        </div>
      </section>

      <!-- 👥 Zarządzanie użytkownikami -->
      <section>
        <h2 class="text-2xl font-semibold mb-4">👥 Zarządzanie użytkownikami</h2>
        <div class="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
          <table class="min-w-full text-sm text-left">
            <thead class="bg-gray-700 text-gray-300 uppercase">
              <tr>
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Imię</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Rola</th>
                <th class="py-3 px-4">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.user_id" class="border-b border-gray-700 hover:bg-gray-700">
                <td class="py-3 px-4">{{ user.user_id }}</td>
                <td class="py-3 px-4">{{ user.name }} {{ user.surname }}</td>
                <td class="py-3 px-4">{{ user.email }}</td>
                <td class="py-3 px-4 capitalize">{{ user.role }}</td>
                <td class="py-3 px-4 space-x-2">
                  <button 
                    class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                    @click="toggleRole(user)">
                    Zmień rolę
                  </button>
                  <button 
                    class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                    @click="deleteUser(user.user_id)">
                    Usuń
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 🏫 Zarządzanie uczelniami -->
      <section>
        <h2 class="text-2xl font-semibold mb-4">🏫 Uczelnie</h2>
        <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div class="flex justify-between mb-4">
            <input 
              v-model="newUniversity"
              placeholder="Nowa uczelnia..."
              class="px-4 py-2 rounded-lg text-black w-1/2"
            />
            <button 
              @click="addUniversity"
              class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold">
              Dodaj uczelnię
            </button>
          </div>
          <ul>
            <li v-for="uni in universities" :key="uni.university_id" class="flex justify-between py-2 border-b border-gray-700">
              <span>{{ uni.university_name }}</span>
              <button 
                @click="deleteUniversity(uni.university_id)"
                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
                Usuń
              </button>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '../components/Admin/StatCard.vue'

const router = useRouter()
const stats = reactive({ users: 0, verified: 0, universities: 0, groups: 0 })
const users = ref([])
const universities = ref([])
const newUniversity = ref('')

// Pobieranie danych po stronie admina
const fetchAdminData = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/dashboard', {
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Brak uprawnień')
    const data = await res.json()
    Object.assign(stats, data.stats)
    users.value = data.users
    universities.value = data.universities
  } catch (err) {
    console.error('❌ Brak dostępu do panelu admina:', err)
    router.push('/dashboard')
  }
}

const toggleRole = async (user) => {
  // tutaj dodasz logikę zmiany roli użytkownika
  alert(`Zmieniono rolę użytkownika ${user.email}`)
}

const deleteUser = async (id) => {
  // tutaj dodasz logikę usuwania użytkownika
  alert(`Użytkownik ${id} został usunięty`)
}

const addUniversity = async () => {
  if (!newUniversity.value.trim()) return
  universities.value.push({
    university_id: Date.now(),
    university_name: newUniversity.value
  })
  newUniversity.value = ''
}

const deleteUniversity = async (id) => {
  universities.value = universities.value.filter(u => u.university_id !== id)
}

const logout = async () => {
  await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  })
  router.push('/')
}

onMounted(fetchAdminData)
</script>
