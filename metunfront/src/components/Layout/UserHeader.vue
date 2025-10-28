<template>
  <header
    class="flex justify-between items-center p-6 text-white fixed top-0 left-0 w-full z-30"
  >
    <!-- Logo -->
    <div
      class="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/30 transition"
      @click="goToMainDashboard"
    >
      <span class="text-3xl">🎓</span>
      <span class="text-2xl text-white tracking-wide drop-shadow-md">MeTun</span>
    </div>

    <!-- Użytkownik -->
    <div class="flex items-center gap-4">
      <!-- Avatar -->
      <div class="w-10 h-10">
        <img
          v-if="profile?.profile_picture"
          :src="profile.profile_picture"
          alt="Avatar"
          class="w-full h-full rounded-full object-cover border-2 border-pink-300 shadow-md"
        />
        <div
          v-else
          class="w-full h-full rounded-full bg-pink-300 flex items-center justify-center text-white font-bold"
        >
          {{ (user?.name || '?').charAt(0).toUpperCase() }}
        </div>
      </div>

      <!-- Imię użytkownika -->
      <span class="text-white text-lg sm:text-xl md:text-2xl font-bold drop-shadow-lg truncate">
        {{ profile?.name || user?.name || "Użytkownik" }}
      </span>

      <!-- Wyloguj -->
      <button
        @click="logout"
        class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
      >
        Wyloguj
      </button>
    </div>
  </header>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = reactive({});
const profile = reactive({});

const goToMainDashboard = () => router.push('/dashboard');

const logout = async () => {
  try {
    await fetch('http://localhost:3000/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (err) {
    console.error(err);
  } finally {
    router.push('/');
  }
};

const fetchProfile = async () => {
  try {
    // 1️⃣ Pobierz usera
    const resUser = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
    if (!resUser.ok) throw new Error('Nie zalogowany');
    const userData = await resUser.json();
    Object.assign(user, userData);

    // 2️⃣ Pobierz profil po user_id
    const resProfile = await fetch(`http://localhost:3000/api/profiles/user/${user.user_id}`, { credentials: 'include' });
    if (resProfile.ok) {
      const profileData = await resProfile.json();
      Object.assign(profile, profileData);
    } else if (resProfile.status === 404) {
      console.log('Profil nie istnieje');
    }
  } catch (err) {
    console.error('Błąd pobierania profilu:', err);
  }
};

onMounted(fetchProfile);
</script>
