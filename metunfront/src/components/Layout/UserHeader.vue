<template>
  <header class="flex justify-between items-center p-6 text-white fixed top-0 left-0 w-full z-30">
    <!-- Logo -->
    <div
      @click="goToMainDashboard"
      class="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/30 transition"
    >
      <span class="text-3xl">🎓</span>
      <span class="text-2xl text-white tracking-wide drop-shadow-md">MeTun</span>
    </div>

    <!-- User section -->
    <div class="flex items-center gap-4">
      <!-- 🔄 Ładowanie -->
      <div v-if="!loaded" class="text-white text-xl opacity-80">
        Ładowanie...
      </div>

      <!-- 🎭 Avatar -->
      <div v-else class="w-10 h-10">
        <img
          v-if="profile.profile_picture"
          :src="profile.profile_picture"
          alt="Avatar"
          class="w-full h-full rounded-full object-cover border-2 border-pink-300 shadow-md"
        />

        <div
          v-else
          class="w-full h-full rounded-full bg-pink-300 flex items-center justify-center text-white font-bold"
        >
          {{ (profile.name || user.name || '?').charAt(0).toUpperCase() }}
        </div>
      </div>

      <!-- 👤 Imię użytkownika -->
      <span v-if="loaded" class="text-white text-lg sm:text-xl md:text-2xl font-bold drop-shadow-lg truncate">
        {{ profile.name || user.name || "Użytkownik" }}
      </span>

      <button
        @click="handleLogout"
        class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
      >
        Wyloguj
      </button>
    </div>
  </header>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore'

const router = useRouter()
const userStore = useUserStore()
const { user, profile, loaded, fetchUserAndProfile, logout } = userStore

onMounted(async () => {
  if (!loaded) await fetchUserAndProfile()
})

const goToMainDashboard = () => router.push('/dashboard')
const handleLogout = () => logout(router)
</script>
