<template>
  <header
    :class="[
      'flex justify-between items-center p-6 shadow-md',
      isAdmin ? 'bg-gray-800 text-yellow-400' : 'bg-black/30 text-white backdrop-blur-md'
    ]"
  >
    <!-- Logo / przejście do głównego dashboardu -->
    <div
      class="text-2xl font-bold cursor-pointer hover:text-yellow-400 transition"
      @click="goToMainDashboard"
    >
      🎓 MeTun
    </div>

    <!-- Prawa część: dane użytkownika -->
    <div class="flex items-center gap-4">
      <img
        v-if="profile?.profile_picture"
        :src="'http://localhost:3000' + profile.profile_picture"
        class="w-10 h-10 rounded-full border-2 border-yellow-400 object-cover"
      />
      <span>{{ profile?.name }}</span>
      <Button
        label="Wyloguj"
        class="bg-red-600 hover:bg-red-700"
        @click="logout"
      />
    </div>
  </header>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import { defineProps } from 'vue'

const props = defineProps({
  profile: Object
})

const router = useRouter()
const route = useRoute()

// Sprawdzenie, czy jesteśmy w panelu admina
const isAdmin = route.path.startsWith('/admin')

// Funkcja przejścia do głównego dashboardu
const goToMainDashboard = () => {
  router.push('/dashboard')
}

// Wylogowanie
const logout = async () => {
  try {
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (err) {
    console.error(err)
  } finally {
    router.push('/')
  }
}
</script>
