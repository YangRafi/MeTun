<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 mx-auto">
    <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center flex items-center justify-center gap-2">
      ✉️ Zmień e-mail
    </h2>

    <div class="grid gap-4">
      <label class="block text-blue-800 font-medium">Nowy e-mail</label>
      <input
        v-model="newEmail"
        type="email"
        placeholder="wpisz nowy e-mail"
        class="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
      />

      <label class="block text-blue-800 font-medium">Potwierdź e-mail</label>
      <input
        v-model="confirmEmail"
        type="email"
        placeholder="powtórz nowy e-mail"
        class="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
      />

      <button
        @click="changeEmail"
        class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition transform hover:scale-105 mt-4"
      >
        Zmień e-mail
      </button>
    </div>

    <!-- Toast PrimeVue -->
    <Toast />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";

const newEmail = ref("");
const confirmEmail = ref("");

const toast = useToast();

async function changeEmail() {
  if (!newEmail.value || !confirmEmail.value) {
    return toast.add({ severity: 'warn', summary: 'Uwaga', detail: 'Uzupełnij wszystkie pola!', life: 3000 });
  }
  if (newEmail.value !== confirmEmail.value) {
    return toast.add({ severity: 'warn', summary: 'Uwaga', detail: 'E-maile nie pasują do siebie!', life: 3000 });
  }

  try {
    const res = await fetch("http://localhost:3000/api/users/change-email", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.value }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.add({ severity: 'success', summary: 'Sukces', detail: data.message || "E-mail zmieniony!", life: 3000 });
      newEmail.value = "";
      confirmEmail.value = "";
    } else {
      toast.add({ severity: 'error', summary: 'Błąd', detail: data.error || "Błąd podczas zmiany e-maila.", life: 3000 });
    }
  } catch (err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Błąd', detail: "Nie udało się połączyć z serwerem.", life: 3000 });
  }
}
</script>
