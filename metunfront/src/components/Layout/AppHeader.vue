<template>
  <header class="flex items-center justify-between px-8 py-4 fixed top-0 left-0 w-full z-20 bg-transparent">
    <div class="flex items-center gap-3">
      <img src="/src/assets/logometun.png" alt="Logo" class="w-12 h-12 object-contain"/>
      <h1 class="text-2xl font-bold text-white drop-shadow">MeTun</h1>
    </div>

    <nav class="flex gap-4">
      <router-link to="/" class="px-4 py-2 text-white hover:text-blue-300 transition">Strona główna</router-link>
      <router-link to="/more" class="px-4 py-2 text-white hover:text-blue-300 transition">Więcej</router-link>
      <button @click="$emit('show-login')" class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition">
        Zaloguj się
      </button>
    </nav>
  </header>
</template>
