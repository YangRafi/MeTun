<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200">
    <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center">Zmień e-mail</h2>

    <div class="grid gap-4">
      <label class="block text-blue-800 font-medium">Nowy e-mail</label>
      <input
        v-model="newEmail"
        type="email"
        class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300"
      />

      <label class="block text-blue-800 font-medium">Potwierdź e-mail</label>
      <input
        v-model="confirmEmail"
        type="email"
        class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300"
      />

      <button
        @click="changeEmail"
        class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition mt-4"
      >
        Zmień e-mail
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref } from "vue";

const props = defineProps({
  profile: Object,
});

const newEmail = ref("");
const confirmEmail = ref("");

async function changeEmail() {
  if (!newEmail.value || !confirmEmail.value) {
    return alert("Uzupełnij wszystkie pola!");
  }
  if (newEmail.value !== confirmEmail.value) {
    return alert("E-maile nie pasują do siebie!");
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/change-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.value }),
    });

    if (res.ok) alert("E-mail zmieniony!");
    else alert("Błąd podczas zmiany e-maila.");
  } catch {
    alert("Nie udało się połączyć z serwerem.");
  }
}
</script>
