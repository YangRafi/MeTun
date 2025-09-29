<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- Modale -->
    <AuthModal type="signup" v-model:visible="showSignup" />
    <AuthModal type="login" v-model:visible="showLogin" />

    <!-- Tło -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: 'url(/src/assets/more.jpg)' }"
    ></div>

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/40"></div>

    <!-- Treść -->
    <div class="relative z-10 flex flex-col min-h-screen">
      <AppHeader @show-login="showLogin = true" />

      <section class="py-16 px-6 flex-1">
        <div class="max-w-5xl mx-auto">
          <h2 class="text-4xl font-bold text-white mb-6 text-center drop-shadow-lg">
            Dlaczego warto wybrać MeTun?
          </h2>
          <p class="text-lg mb-12 text-center text-gray-200 drop-shadow-md">
            MeTun to aplikacja społecznościowa dla kandydatów na studia – poznawaj przyszłych studentów, dołączaj do grup i buduj relacje jeszcze przed rozpoczęciem studiów!
          </p>

          <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div class="bg-black/30 p-6 rounded-xl shadow-lg hover:shadow-xl transition text-white">
              <h3 class="text-xl font-semibold mb-2">Dołączaj do grup kierunkowych</h3>
              <p class="text-gray-200">
                Automatycznie generowane grupy dla Twojego kierunku studiów oraz możliwość tworzenia własnych grup tematycznych.
              </p>
            </div>

            <div class="bg-black/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition text-white">
              <h3 class="text-xl font-semibold mb-2">Znajdź osoby o podobnych zainteresowaniach</h3>
              <p class="text-gray-200">
                Twórz profil z pasjami i zainteresowaniami, aby łatwiej nawiązywać kontakt z osobami o podobnych zainteresowaniach.
              </p>
            </div>

            <div class="bg-black/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition text-white">
              <h3 class="text-xl font-semibold mb-2">Bezpieczna społeczność</h3>
              <p class="text-gray-200">
                Weryfikacja profili i decyzji o przyjęciu na uczelnię gwarantuje, że społeczność jest autentyczna i bezpieczna.
              </p>
            </div>

            <div class="bg-black/30 p-6 rounded-xl shadow-lg hover:shadow-xl transition text-white">
              <h3 class="text-xl font-semibold mb-2">Łatwe rozmowy 1:1</h3>
              <p class="text-gray-200">
                Przesuwaj profile w prawo, aby połączyć się z innymi kandydatami i rozpocząć rozmowę w prosty i intuicyjny sposób.
              </p>
            </div>

            <div class="bg-black/30 p-6 rounded-xl shadow-lg hover:shadow-xl transition text-white">
              <h3 class="text-xl font-semibold mb-2">Śledź aktywność</h3>
              <p class="text-gray-200">
                Zobacz, którzy użytkownicy są aktywni w Twojej grupie i bierz udział w dyskusjach na bieżąco.
              </p>
            </div>

            <div class="bg-black/30 p-6 rounded-xl shadow-lg hover:shadow-xl transition text-white">
              <h3 class="text-xl font-semibold mb-2">Dołącz już teraz</h3>
              <p class="text-gray-200">
                Nie czekaj – zarejestruj się i zacznij poznawać innych kandydatów jeszcze przed rozpoczęciem studiów.
              </p>
            </div>
          </div>

          <!-- 🔹 Przycisk otwierający modal rejestracji -->
          <div class="mt-12 text-center">
            <button
              @click="showSignup = true"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Dołącz teraz
            </button>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import AuthModal from '../components/AuthModal.vue'

const showSignup = ref(false)
const showLogin = ref(false)
</script>
