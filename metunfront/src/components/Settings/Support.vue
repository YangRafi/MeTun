<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 grid gap-4">
    <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center">Centrum pomocy</h2>

    <p class="text-blue-800 font-semibold mb-2">Masz problem lub pytanie? Skontaktuj się z administracją:</p>

    <input
      v-model="subject"
      type="text"
      placeholder="Temat"
      class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300"
    />
    <textarea
      v-model="message"
      placeholder="Treść wiadomości"
      class="w-full p-3 rounded-xl border focus:ring-blue-300 focus:border-blue-300 h-40"
    ></textarea>

    <button
      @click="sendMessage"
      class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition mt-2"
    >
      Wyślij wiadomość
    </button>
  </div>
</template>

<script setup>
import { defineProps, ref } from "vue";

const props = defineProps({
  profile: Object,
});

const subject = ref("");
const message = ref("");

async function sendMessage() {
  if (!subject.value || !message.value) {
    return alert("Uzupełnij temat i treść wiadomości!");
  }

  try {
    const res = await fetch("http://localhost:3000/api/support", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.value, message: message.value }),
    });

    if (res.ok) {
      alert("Wiadomość wysłana!");
      subject.value = "";
      message.value = "";
    } else {
      alert("Błąd przy wysyłaniu wiadomości.");
    }
  } catch {
    alert("Nie udało się połączyć z serwerem.");
  }
}
</script>
