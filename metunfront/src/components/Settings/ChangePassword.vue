<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200">
    <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center">Zmień hasło</h2>

    <div class="grid gap-4">
      <label class="block text-blue-800 font-medium">Aktualne hasło</label>
      <input
        v-model="currentPassword"
        type="password"
        class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300"
      />

      <label class="block text-blue-800 font-medium">Nowe hasło</label>
      <input
        v-model="newPassword"
        type="password"
        class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300"
      />

      <label class="block text-blue-800 font-medium">Potwierdź nowe hasło</label>
      <input
        v-model="confirmPassword"
        type="password"
        class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300"
      />

      <button
        @click="changePassword"
        class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition mt-4"
      >
        Zmień hasło
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref } from "vue";

const props = defineProps({
  profile: Object,
});

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

async function changePassword() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    return alert("Uzupełnij wszystkie pola!");
  }
  if (newPassword.value !== confirmPassword.value) {
    return alert("Nowe hasła nie pasują do siebie!");
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    });

    if (res.ok) alert("Hasło zmienione!");
    else alert("Błąd podczas zmiany hasła.");
  } catch {
    alert("Nie udało się połączyć z serwerem.");
  }
}
</script>
