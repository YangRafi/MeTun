<template>
  <div>
    <AppHeader />

    <section
      class="min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center"
      :style="{ backgroundImage: 'url(/src/assets/home.jpg)' }"
    >
      <!-- Logo -->
      <img src="/src/assets/logometun.png" alt="Logo" class="w-32 h-32 object-contain mb-6" />

      <!-- Nagłówek -->
      <h2 class="text-4xl font-bold mb-4 text-white text-center drop-shadow-lg">Witaj w MeTun</h2>

      <!-- Opis -->
      <p class="text-lg text-center max-w-xl mb-6 text-white drop-shadow-md">
        Twoja aplikacja społecznościowa dla kandydatów na studia. Poznawaj nowych ludzi i dołączaj do grup kierunkowych!
      </p>

      <!-- Przycisk Utwórz konto -->
      <button class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
        Utwórz konto
      </button>
    </section>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue';
</script>
