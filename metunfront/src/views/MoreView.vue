<template>
  <div>
    <AppHeader />
    <section class="py-16 bg-gray-50 px-6">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-4xl font-bold text-gray-800 mb-6 text-center">
          Dlaczego warto wybrać MeTun?
        </h2>
        <p class="text-gray-600 text-lg mb-12 text-center">
          MeTun to aplikacja społecznościowa dla kandydatów na studia – poznawaj przyszłych studentów, dołączaj do grup i buduj relacje jeszcze przed rozpoczęciem studiów!
        </p>

        <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 class="text-xl font-semibold mb-2">Dołączaj do grup kierunkowych</h3>
            <p class="text-gray-600">
              Automatycznie generowane grupy dla Twojego kierunku studiów oraz możliwość tworzenia własnych grup tematycznych.
            </p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 class="text-xl font-semibold mb-2">Znajdź osoby o podobnych zainteresowaniach</h3>
            <p class="text-gray-600">
              Twórz profil z pasjami i zainteresowaniami, aby łatwiej nawiązywać kontakt z osobami o podobnych zainteresowaniach.
            </p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 class="text-xl font-semibold mb-2">Bezpieczna społeczność</h3>
            <p class="text-gray-600">
              Weryfikacja profili i decyzji o przyjęciu na uczelnię gwarantuje, że społeczność jest autentyczna i bezpieczna.
            </p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 class="text-xl font-semibold mb-2">Łatwe rozmowy 1:1</h3>
            <p class="text-gray-600">
              Przesuwaj profile w prawo, aby połączyć się z innymi kandydatami i rozpocząć rozmowę w prosty i intuicyjny sposób.
            </p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 class="text-xl font-semibold mb-2">Śledź aktywność</h3>
            <p class="text-gray-600">
              Zobacz, którzy użytkownicy są aktywni w Twojej grupie i bierz udział w dyskusjach na bieżąco.
            </p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 class="text-xl font-semibold mb-2">Dołącz już teraz</h3>
            <p class="text-gray-600">
              Nie czekaj – zarejestruj się i zacznij poznawać innych kandydatów jeszcze przed rozpoczęciem studiów.
            </p>
          </div>
        </div>

        <div class="mt-12 text-center">
          <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Dołącz teraz
          </button>
        </div>
      </div>
    </section>
  </div>
  <AppFooter />
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue';
</script>
