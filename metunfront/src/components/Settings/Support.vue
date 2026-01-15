<template>
  <div class="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 grid gap-6">
    <h2 class="text-2xl font-bold text-blue-800 mb-4 text-center flex items-center justify-center gap-2">
      🛠️ Centrum pomocy
    </h2>

    <p class="text-blue-800 font-semibold mb-2 text-center">
      Masz problem lub pytanie? Skontaktuj się z administracją:
    </p>

    <select
      v-model="selectedTopic"
      class="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
    >
      <option disabled value="">Wybierz temat</option>
      <option v-for="tip in tips" :key="tip">{{ tip }}</option>
      <option>Inny temat</option>
    </select>

    <input
      v-if="selectedTopic === 'Inny temat'"
      v-model="customTopic"
      type="text"
      placeholder="Wpisz własny temat"
      class="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
    />

    <textarea
      v-model="message"
      placeholder="Treść wiadomości"
      class="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 h-40 transition"
    ></textarea>

    <button
      @click="sendMessage"
      class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
    >
      ✉️ Wyślij wiadomość
    </button>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useUserStore } from "@/store/userStore";

const toast = useToast();
const userStore = useUserStore();

const tips = ref([
  "Problem z logowaniem",
  "Błąd w profilu",
  "Pytanie o funkcjonalność",
  "Zgłoszenie nadużycia",
]);

const selectedTopic = ref("");
const customTopic = ref("");
const message = ref("");
const loadedUser = ref(false);

onMounted(async () => {
  await userStore.fetchUserAndProfile();
  if (userStore.user.user_id) {
    loadedUser.value = true;
  } else {
    toast.add({ severity: "error", summary: "Błąd", detail: "Nie zalogowano użytkownika.", life: 3000 });
  }
});

async function sendMessage() {
  if (!loadedUser.value) return;

  const subject = selectedTopic.value === "Inny temat" ? customTopic.value : selectedTopic.value;

  if (!subject || !message.value) {
    toast.add({ severity: "warn", summary: "Uwaga", detail: "Uzupełnij temat i treść wiadomości!", life: 3000 });
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/reports", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message: message.value }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.add({ severity: "success", summary: "Sukces", detail: data.message || "Raport wysłany!", life: 3000 });
      selectedTopic.value = "";
      customTopic.value = "";
      message.value = "";
    } else {
      toast.add({ severity: "error", summary: "Błąd", detail: data.error || "Nie udało się wysłać raportu.", life: 3000 });
    }
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Błąd", detail: "Nie udało się połączyć z serwerem.", life: 3000 });
  }
}
</script>
