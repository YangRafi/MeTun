<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
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
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Users, CheckCircle, School, UsersRound, ClipboardList } from 'lucide-vue-next'
import StatCard from '../../components/Admin/StatCard.vue'
import UserHeader from '../../components/Layout/UserHeader.vue'

const router = useRouter()
const profile = ref(null)

const stats = reactive({ users: 0, verified: 0, universities: 0, groups: 0 })

const sections = [
  { key: 'users', name: 'Zarządzanie użytkownikami', icon: Users },
  { key: 'universities', name: 'Zarządzanie uczelniami', icon: School },
  { key: 'requests', name: 'Wnioski do weryfikacji', icon: ClipboardList }
]

const fetchAdminData = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/dashboard', { credentials: 'include' })
    if (!res.ok) throw new Error('Brak uprawnień')
    const data = await res.json()
    Object.assign(stats, data.stats)

    const profileRes = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (profileRes.ok) profile.value = await profileRes.json()
  } catch {
    router.push('/dashboard')
  }
}

onMounted(fetchAdminData)
</script>
