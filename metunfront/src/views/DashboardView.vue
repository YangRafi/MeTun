<template>
  <div class="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700 text-white">
    <UserHeader :profile="profile" />

    <main class="flex flex-col items-center justify-center min-h-[80vh] space-y-10">
      <div class="grid grid-cols-2 gap-10">
        <DashboardCircle icon="Users" label="Grupy" route="/groups" :profile="profile" />
        <DashboardCircle icon="Heart" label="Dopasowania" route="/matches" :profile="profile" />
        <DashboardCircle icon="School" label="Weryfikacja" route="/verification" />
        <DashboardCircle icon="Settings" label="Ustawienia" route="/settings" />
        <DashboardCircle v-if="profile.role==='admin'" icon="ShieldCheck" label="Panel admina" route="/admin" :profile="profile" />
      </div>
    </main>

    <!-- Popup -->
    <transition name="fade">
      <div v-if="showPopup" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white text-black p-6 rounded-xl max-w-sm text-center shadow-xl">
          <h2 class="text-xl font-bold mb-2">Brak dostępu</h2>
          <p>Musisz mieć status <strong>verified</strong> lub <strong>trial</strong>, aby uzyskać dostęp do tej sekcji.</p>
          <button @click="showPopup=false" class="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">OK</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserHeader from '../components/Layout/UserHeader.vue'
import DashboardCircle from '../components/Dashboard/DashboardCircle.vue'
import { showVerifiedPopup } from '../store/popupStore.js'

const router = useRouter()
const profile = reactive({})
const showPopup = showVerifiedPopup

const fetchUser = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (!res.ok) throw new Error('Nie zalogowany')
    const data = await res.json()
    console.log('[DashboardView] Fetched user profile:', data)
    Object.assign(profile, data)
  } catch (err) {
    console.error('[DashboardView] Failed to fetch profile:', err)
    router.push('/')
  }
}

onMounted(fetchUser)
</script>
