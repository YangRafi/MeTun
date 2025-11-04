<template>
  <div class="max-w-4xl mx-auto mt-12 p-6">
    <!-- Nagłówek -->
    <h2 class="text-3xl md:text-4xl font-extrabold text-blue-800 mb-12 text-center">
      📊 Statystyki profilu
    </h2>

    <!-- Grid statystyk -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
      <!-- Matchy -->
      <div class="bg-blue-50 rounded-full shadow-lg p-6 flex flex-col items-center justify-center border border-blue-200 hover:scale-105 transition-transform">
        <div class="text-4xl mb-2">💖</div>
        <span class="text-sm text-blue-600 mb-1">Aktywne dopasowania</span>
        <span class="text-3xl md:text-4xl font-bold text-blue-800">{{ stats.matchesCount }}</span>
      </div>

      <!-- Grupy -->
      <div class="bg-blue-50 rounded-full shadow-lg p-6 flex flex-col items-center justify-center border border-blue-200 hover:scale-105 transition-transform">
        <div class="text-4xl mb-2">👥</div>
        <span class="text-sm text-blue-600 mb-1">Grupy</span>
        <span class="text-3xl md:text-4xl font-bold text-blue-800">{{ stats.groupsCount }}</span>
      </div>

      <!-- Uczelnie -->
      <div class="bg-blue-50 rounded-full shadow-lg p-6 flex flex-col items-center justify-center border border-blue-200 hover:scale-105 transition-transform">
        <div class="text-4xl mb-2">🎓</div>
        <span class="text-sm text-blue-600 mb-1">Zatwierdzone uczelnie</span>
        <span class="text-3xl md:text-4xl font-bold text-blue-800">{{ stats.universitiesCount }}</span>
      </div>
    </div>

    <!-- Drugi rząd -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <!-- Wiadomości -->
      <div class="bg-blue-50 rounded-full shadow-lg p-6 flex flex-col items-center justify-center border border-blue-200 hover:scale-105 transition-transform">
        <div class="text-4xl mb-2">✉️</div>
        <span class="text-sm text-blue-600 mb-1">Wysłane wiadomości</span>
        <span class="text-3xl md:text-4xl font-bold text-blue-800">{{ stats.messagesCount }}</span>
      </div>

      <!-- Status trial -->
      <div class="bg-blue-50 rounded-full shadow-lg p-6 flex flex-col items-center justify-center border border-blue-200 hover:scale-105 transition-transform">
        <div class="text-4xl mb-2">⏱️</div>
        <span class="text-sm text-blue-600 mb-1">Status trial</span>
        <span class="text-2xl font-bold text-blue-800">{{ stats.hasTrial ? 'Aktywny' : 'Nieaktywny' }}</span>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useUserStore } from "@/store/userStore";

const toast = useToast();
const userStore = useUserStore();

const stats = ref({
  matchesCount: 0,
  groupsCount: 0,
  universitiesCount: 0,
  messagesCount: 0,
  hasTrial: false,
});

onMounted(async () => {
  try {
    await userStore.fetchUserAndProfile();

    if (!userStore.user.user_id) {
      throw new Error("Nie zalogowano użytkownika");
    }

    const res = await fetch("http://localhost:3000/api/users/stats", {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Nie udało się pobrać statystyk profilu.");
    }

    stats.value = await res.json();
  } catch (err) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Błąd",
      detail: err.message,
      life: 3000,
    });
  }
});
</script>
