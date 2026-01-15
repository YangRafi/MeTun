<template>
  <div
    class="relative min-h-screen bg-cover bg-center"
    :style="{ backgroundImage: `url(${background})` }"
  >
  <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

    <UserHeader :profile="profile" />

    <main class="relative z-10 flex flex-col items-center pt-28 px-6 w-full">
      <h1 class="text-4xl font-bold text-white mb-10 drop-shadow-lg">
        ⚙️ Ustawienia
      </h1>

      <div
        v-if="!currentView"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full justify-items-center"
      >
        <button
          v-for="option in settingsOptions"
          :key="option.name"
          @click="currentView = option.action"
          class="bg-white/20 hover:bg-white/30 text-white p-8 rounded-2xl shadow-md backdrop-blur-md transition flex flex-col items-center justify-center gap-4 w-90"
        >
          <component :is="option.icon" class="w-14 h-14" />
          <span class="text-xl font-semibold text-center">{{ option.name }}</span>
        </button>
      </div>

      <div v-else class="w-full flex flex-col items-center">
        <button
          @click="currentView = null"
          class="mb-6 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition"
        >
          ← Powrót do ustawień
        </button>

        <component :is="currentComponent" :profile="profile" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import background from "../assets/background.jpg";
import UserHeader from "../components/Layout/UserHeader.vue";
import { UserCog, Lock, Mail, Trash2, HelpCircle, BarChart2 } from "lucide-vue-next";

import EditProfile from "../components/Settings/EditProfile.vue";
import ChangePassword from "../components/Settings/ChangePassword.vue";
import ChangeEmail from "../components/Settings/ChangeEmail.vue";
import DeleteAccount from "../components/Settings/DeleteAccount.vue";
import AccountStats from "../components/Settings/AccountStats.vue";
import Support from "../components/Settings/Support.vue";

const profile = reactive({});
const currentView = ref(null);

const fetchUser = async () => {
  try {
    const res = await fetch("http://localhost:3000/api/auth/me", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Nie zalogowany");
    Object.assign(profile, await res.json());
  } catch {
    console.warn("Nie zalogowany");
  }
};

onMounted(fetchUser);

const settingsOptions = [
  { name: "Edytuj profil", icon: UserCog, action: "editProfile" },
  { name: "Zmień hasło", icon: Lock, action: "changePassword" },
  { name: "Zmień e-mail", icon: Mail, action: "changeEmail" },
  { name: "Usuń konto", icon: Trash2, action: "deleteAccount" },
  { name: "Statystyki konta", icon: BarChart2, action: "accountStats" },
  { name: "Centrum pomocy", icon: HelpCircle, action: "helpCenter" },
];

const componentsMap = {
  editProfile: EditProfile,
  changePassword: ChangePassword,
  changeEmail: ChangeEmail,
  deleteAccount: DeleteAccount,
  accountStats: AccountStats,
  helpCenter: Support,
};

const currentComponent = computed(() =>
  currentView.value ? componentsMap[currentView.value] : null
);
</script>
