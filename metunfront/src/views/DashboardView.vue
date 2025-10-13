<template>
  <div class="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700 text-white">
    <!-- HEADER -->
    <UserHeader :profile="profile" />

    <!-- GŁÓWNA SEKCJA KÓŁEK -->
    <main class="flex flex-col items-center justify-center min-h-[80vh] space-y-10">
      <div class="grid grid-cols-2 gap-10">
        <DashboardCircle icon="Users" label="Grupy" route="/groups" />
        <DashboardCircle icon="Heart" label="Dopasowania" route="/matches" />
        <DashboardCircle icon="School" label="Weryfikacja" route="/verification" />
        <DashboardCircle icon="Settings" label="Ustawienia" route="/settings" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserHeader from '../components/Layout/UserHeader.vue'
import DashboardCircle from '../components/Dashboard/DashboardCircle.vue'

const router = useRouter()
const profile = reactive({})

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

onMounted(fetchUser)
</script>
