<template>
  <header class="flex items-center justify-between px-8 py-4 fixed top-0 left-0 w-full z-20 bg-transparent">
    <!-- Logo + nazwa -->
    <div class="flex items-center gap-3">
      <img src="/src/assets/logometun.png" alt="Logo" class="w-12 h-12 object-contain"/>
      <h1 class="text-2xl font-bold text-white drop-shadow">MeTun</h1>
    </div>

    <!-- Nawigacja -->
    <nav class="flex gap-4 items-center">
      <router-link to="/" class="px-4 py-2 text-white hover:text-blue-300">Strona główna</router-link>
      <router-link to="/more" class="px-4 py-2 text-white hover:text-blue-300">Więcej</router-link>

      <!-- 🔹 Zaloguj się -->
      <router-link
        to="/login"
        class="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
      >
        Zaloguj się
      </router-link>
    </nav>
  </header>
</template>
