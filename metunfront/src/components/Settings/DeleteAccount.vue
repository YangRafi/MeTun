<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 text-center">
    <p class="text-blue-800 mb-6 font-semibold">
      Usunięcie konta jest <span class="font-bold text-red-600">nieodwracalne</span>. Wszystkie dane zostaną utracone.
    </p>

    <button
      @click="deleteAccount"
      class="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg transition"
    >
      Usuń konto
    </button>
  </div>
</template>

<script setup>
import { defineProps } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  profile: Object,
});

const router = useRouter();

async function deleteAccount() {
  if (!confirm("Na pewno chcesz usunąć konto?")) return;

  try {
    const res = await fetch("http://localhost:3000/api/auth/delete-account", {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      alert("Konto usunięte.");
      router.push("/");
    } else {
      alert("Błąd podczas usuwania konta.");
    }
  } catch {
    alert("Nie udało się połączyć z serwerem.");
  }
}
</script>
