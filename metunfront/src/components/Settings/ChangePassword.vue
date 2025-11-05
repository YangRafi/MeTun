<template>
  <div
    class="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 mx-auto"
  >
    <h2 class="text-3xl font-bold text-blue-800 mb-8 text-center">
      🔒 Zmień hasło
    </h2>

    <div class="space-y-6">
      <!-- Aktualne hasło -->
      <div>
        <label class="block text-blue-800 font-semibold mb-2">Aktualne hasło</label>
        <div class="relative">
          <input
            v-model="currentPassword"
            :type="showCurrent ? 'text' : 'password'"
            class="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 pr-12 transition"
            placeholder="Wpisz swoje obecne hasło"
          />
          <button
            type="button"
            class="absolute right-3 top-3 text-blue-600 hover:text-blue-800 transition"
            @click="showCurrent = !showCurrent"
          >
            <span v-if="showCurrent">🙈</span>
            <span v-else>👁️</span>
          </button>
        </div>
      </div>

      <!-- Nowe hasło -->
      <div>
        <label class="block text-blue-800 font-semibold mb-2">Nowe hasło</label>
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showNew ? 'text' : 'password'"
            class="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 pr-12 transition"
            placeholder="Wpisz nowe hasło"
          />
          <button
            type="button"
            class="absolute right-3 top-3 text-blue-600 hover:text-blue-800 transition"
            @click="showNew = !showNew"
          >
            <span v-if="showNew">🙈</span>
            <span v-else>👁️</span>
          </button>
        </div>
      </div>

      <!-- Potwierdzenie hasła -->
      <div>
        <label class="block text-blue-800 font-semibold mb-2">Potwierdź nowe hasło</label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            class="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 pr-12 transition"
            placeholder="Powtórz nowe hasło"
          />
          <button
            type="button"
            class="absolute right-3 top-3 text-blue-600 hover:text-blue-800 transition"
            @click="showConfirm = !showConfirm"
          >
            <span v-if="showConfirm">🙈</span>
            <span v-else>👁️</span>
          </button>
        </div>
      </div>

      <!-- Przycisk -->
      <button
        @click="changePassword"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition-transform hover:scale-[1.02] mt-6"
      >
        💾 Zapisz nowe hasło
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useUserStore } from "@/store/userStore";
import { toast } from "vue3-toastify"; // ✅ import toastów

const userStore = useUserStore();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

async function changePassword() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    return toast.warning("⚠️ Uzupełnij wszystkie pola!", { autoClose: 2500 });
  }

  if (newPassword.value !== confirmPassword.value) {
    return toast.error("❌ Nowe hasła nie pasują do siebie!", { autoClose: 2500 });
  }

  try {
    if (!userStore.user.user_id) {
      await userStore.fetchUserAndProfile();
    }

    const userId = userStore.user.user_id;

    const res = await fetch(`http://localhost:3000/api/users/${userId}/password`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    });

    if (res.ok) {
      toast.success("✅ Hasło zostało zmienione pomyślnie!", { autoClose: 2500 });
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(`❌ Błąd: ${err.message || "Nieznany błąd"}`, { autoClose: 3000 });
    }
  } catch (err) {
    console.error(err);
    toast.error("🚫 Nie udało się połączyć z serwerem.", { autoClose: 3000 });
  }
}
</script>
