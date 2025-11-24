<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white relative">
    <UserHeader :profile="profile" />

    <main class="max-w-6xl mx-auto py-10 px-6">
      <!-- Widok główny statystyk admina -->
      <section v-if="$route.path === '/admin'" class="space-y-10">
        <div>
          <h2 class="text-2xl font-semibold mb-6">📊 Statystyki systemu</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard title="Użytkownicy" :value="stats.users" icon="Users" />
            <StatCard title="Zweryfikowani" :value="stats.verified" icon="CheckCircle" />
            <StatCard title="Uczelnie" :value="stats.universities" icon="School" />
            <StatCard title="Grupy" :value="stats.groups" icon="UsersRound" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          <router-link
            v-for="section in sections"
            :key="section.key"
            :to="`/admin/${section.key}`"
            class="bg-gray-800 hover:bg-gray-700 transition-all p-8 rounded-2xl text-center cursor-pointer shadow-lg"
          >
            <component :is="section.icon" class="mx-auto mb-4" size="40" />
            <h3 class="text-xl font-semibold">{{ section.name }}</h3>
          </router-link>
        </div>
      </section>

      <!-- Dynamiczne podstrony admina -->
      <router-view v-slot="{ Component }">
        <component :is="Component" @back="router.push('/admin')" />
      </router-view>
    </main>

    <!-- 🔔 Toasty -->
    <div class="fixed top-5 right-5 space-y-2 z-50">
      <div
        v-for="(toast, i) in toasts"
        :key="i"
        :class="['px-4 py-2 rounded shadow text-white', toast.type==='success' ? 'bg-green-500' : 'bg-red-500']"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Users, School, ClipboardList } from 'lucide-vue-next'
import StatCard from '../../components/Admin/StatCard.vue'
import UserHeader from '../../components/Layout/UserHeader.vue'

const router = useRouter()
const profile = ref(null)
const stats = reactive({ users: 0, verified: 0, universities: 0, groups: 0 })

const sections = [
  { key: 'users', name: 'Zarządzanie użytkownikami', icon: User },
  { key: 'universities', name: 'Zarządzanie uczelniami', icon: School },
  { key: 'requests', name: 'Wnioski do weryfikacji', icon: ClipboardList },
  { key: 'groups', name: 'Zarządzanie grupami', icon: Users }
]

// 🌟 Toasty
const toasts = ref([])
const showToast = (message, type='success', duration=3000) => {
  toasts.value.push({ message, type })
  setTimeout(() => {
    toasts.value.shift()
  }, duration)
}

const fetchAdminData = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/dashboard', { credentials: 'include' })
    if (!res.ok) throw new Error('Brak uprawnień')
    const data = await res.json()
    Object.assign(stats, data.stats)
    showToast('Dane admina załadowane', 'success')

    const profileRes = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (profileRes.ok) profile.value = await profileRes.json()
  } catch (err) {
    console.error(err)
    showToast('Błąd ładowania danych admina', 'error')
    router.push('/dashboard')
  }
}

onMounted(fetchAdminData)
</script>
