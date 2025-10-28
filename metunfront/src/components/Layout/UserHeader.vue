<template>
  <header
    class="flex justify-between items-center p-6 text-white  fixed top-0 left-0 w-full z-30"
  >
    <div class="text-2xl font-bold cursor-pointer hover:text-pink-300 transition" @click="goToMainDashboard">
      🎓 MeTun
    </div>

    <div class="flex items-center gap-4">
      <img
        v-if="profile?.profile_picture"
        :src="'http://localhost:3000' + profile.profile_picture"
        class="w-10 h-10 rounded-full border-2 border-pink-300 object-cover"
      />
      <span>{{ profile?.name }}</span>
      <button
        @click="logout"
        class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
      >
        Wyloguj
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { defineProps } from 'vue'

const props = defineProps({
  profile: Object
})

const router = useRouter()

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
