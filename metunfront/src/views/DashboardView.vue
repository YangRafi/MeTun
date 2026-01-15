<template>
  <div class="min-h-screen relative overflow-hidden">
    <div
      class="absolute inset-0 bg-cover bg-center z-0"
      :style="{ backgroundImage: `url(${background})` }"
    >
      <div class="absolute inset-0 bg-black/30"></div>
    </div>

    <div class="relative z-10 text-white">
      <UserHeader :profile="profile" />

      <main class="grid grid-cols-6 grid-rows-4 gap-2 min-h-screen">
      <DashboardTile
        label="Grupy"
        route="/groups"
        :profile="profile"
        video-src="/videos/groups.mp4"
        class="col-span-4 row-span-2"
        tile-class="bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white"
      />

      <DashboardTile
        label="Dopasowania"
        route="/matches"
        :profile="profile"
        video-src="/videos/matches.mp4"
        class="col-span-2 row-span-2"
        tile-class="bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white"
      />

      <DashboardTile
        label="Weryfikacja"
        route="/verification"
        video-src="/videos/verification.mp4"
        class="col-span-3 row-span-2"
        tile-class="bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white"
      />

      <DashboardTile
        label="Ustawienia"
        route="/settings"
        :profile="profile"
        video-src="/videos/settings.mp4"
        class="col-span-3 row-span-2"
        tile-class="bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white"
      />

      <div
        v-if="profile.role==='admin'"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
      >
        <DashboardCircle
          icon="ShieldCheck"
          label="Panel admina"
          route="/admin"
          :profile="profile"
          circle-class="bg-indigo-600 hover:bg-indigo-700 text-white"
        />
      </div>
    </main>

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
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserHeader from '../components/Layout/UserHeader.vue'
import DashboardCircle from '../components/Dashboard/DashboardCircle.vue'
import DashboardTile from '../components/Dashboard/DashboardTile.vue'
import { showVerifiedPopup } from '../store/popupStore.js'

import background from '@/assets/background.jpg'

const router = useRouter()
const profile = reactive({})
const showPopup = showVerifiedPopup

const fetchUser = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (!res.ok) throw new Error('Nie zalogowany')
    const data = await res.json()
    Object.assign(profile, data)
  } catch (err) {
    console.error('[DashboardView] Failed to fetch profile:', err)
    router.push('/')
  }
}

onMounted(fetchUser)
</script>

<style scoped>
.fade-enter-active,.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
</style>
