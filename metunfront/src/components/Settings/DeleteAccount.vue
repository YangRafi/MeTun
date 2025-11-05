<template>
  <div
    class="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 text-center mx-auto mt-8"
  >
    <h2 class="text-2xl font-bold text-blue-800 mb-4">⚠️ Usunięcie konta</h2>
    <p class="text-blue-800 mb-6 font-semibold">
      Usunięcie konta jest <span class="font-bold text-red-600">nieodwracalne</span>.
      Wszystkie dane zostaną trwale utracone.
    </p>

    <button
      @click="confirmDelete"
      class="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg transition-transform hover:scale-[1.02]"
    >
      🗑️ Usuń konto
    </button>

    <!-- Dialog potwierdzenia -->
    <ConfirmDialog v-if="showConfirm" />
    <!-- Toast powiadomienia -->
    <Toast />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useUserStore } from "@/store/userStore";

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const userStore = useUserStore();

const showConfirm = ref(false); // 🔹 kontrola widoczności ConfirmDialog

async function performDelete() {
  showConfirm.value = false; // 🔹 zamyka dialog natychmiast
  try {
    const res = await fetch("http://localhost:3000/api/users/me", {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      toast.add({
        severity: "success",
        summary: "Konto usunięte",
        detail: "Twoje konto zostało trwale usunięte.",
        life: 3000,
      });

      await userStore.logout(router);
    } else {
      const data = await res.json();
      toast.add({
        severity: "error",
        summary: "Błąd",
        detail: data?.error || "Nie udało się usunąć konta.",
        life: 3000,
      });
    }
  } catch (err) {
    console.error("❌ Błąd połączenia:", err);
    toast.add({
      severity: "warn",
      summary: "Brak połączenia",
      detail: "Nie udało się połączyć z serwerem.",
      life: 3000,
    });
  }
}

function confirmDelete() {
  showConfirm.value = true;
  confirm.require({
    message:
      "Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.",
    header: "Potwierdź usunięcie",
    icon: "pi pi-exclamation-triangle text-yellow-500",
    acceptLabel: "Tak, usuń",
    rejectLabel: "Anuluj",
    acceptClass:
      "bg-red-600 border-none hover:bg-red-700 font-semibold text-white rounded-xl px-4 py-2 transition",
    rejectClass:
      "bg-gray-300 border-none hover:bg-gray-400 font-semibold text-gray-800 rounded-xl px-4 py-2 transition",
    accept: performDelete,
    reject: () => (showConfirm.value = false),
  });
}
</script>
