<template>
  <header class="flex items-center justify-between px-8 py-4 bg-white shadow">
    <div class="flex items-center gap-3">
      <img src="/src/assets/logometun.png" alt="Logo" class="w-16 h-16 object-contain"/>
      <h1 class="text-2xl font-bold text-gray-800">MeTun</h1>
    </div>
    <nav class="flex gap-4">
      <router-link to="/" class="px-4 py-2 text-gray-800 hover:text-blue-600">Strona główna</router-link>
      <router-link to="/more" class="px-4 py-2 text-gray-800 hover:text-blue-600">Więcej</router-link>
    </nav>
  </header>
</template>
