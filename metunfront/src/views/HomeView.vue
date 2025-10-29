<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- Modale -->
    <AuthModal 
      type="signup" 
      v-model:visible="showSignup" 
      @open-login="showLogin = true"
    />
    <AuthModal type="login" v-model:visible="showLogin" />

    <!-- Wideo w tle -->
    <video
      ref="bgVideo"
      autoplay
      muted
      loop
      playsinline
      class="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/videos/home.mp4" type="video/mp4" />
    </video>

    <!-- Overlay (przyciemnienie) -->
    <div class="absolute inset-0 bg-black/40"></div>

    <!-- Treść -->
    <div class="relative z-10 flex flex-col min-h-screen">
      <AppHeader @show-login="showLogin = true" />

      <main class="flex-1 flex flex-col items-center justify-center px-4">
        <img
          src="/src/assets/logometun.png"
          alt="Logo"
          class="w-32 h-32 object-contain mb-6"
        />

        <h2 class="text-4xl font-bold mb-4 text-white text-center drop-shadow-lg">
          Witaj w MeTun
        </h2>

        <p class="text-lg text-center max-w-xl mb-6 text-white drop-shadow-md">
          Twoja aplikacja społecznościowa dla kandydatów na studia. Poznawaj
          nowych ludzi i dołączaj do grup kierunkowych!
        </p>

        <button
          @click="showSignup = true"
          class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Utwórz konto
        </button>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import AppHeader from '../components/Layout/AppHeader.vue'
import AppFooter from '../components/Layout/AppFooter.vue'
import AuthModal from '../components/Modal/AuthModal.vue'

const showSignup = ref(false)
const showLogin = ref(false)
const bgVideo = ref(null)

// Włącz autoplay przy pierwszym mount
onMounted(() => {
  bgVideo.value?.play().catch(() => {})
})

// Włącz autoplay przy powrocie do komponentu z keep-alive
onActivated(() => {
  bgVideo.value?.play().catch(() => {})
})
</script>
