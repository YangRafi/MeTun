<template>
  <div>
    <!-- 🔹 Ikonka czatu -->
    <button
      @click="toggleSidebar"
      class="fixed top-24 left-6 z-50 bg-yellow-400 hover:bg-yellow-500 text-black p-3 rounded-full shadow-lg transition"
      title="Otwórz czat"
    >
      💬
    </button>

    <!-- 🔹 Nakładka -->
    <div
      v-if="isOpen"
      @click="closeSidebar"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
    ></div>

    <!-- 🔹 Sidebar -->
    <div
      class="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300"
      :class="{ '-translate-x-full': !isOpen, 'translate-x-0': isOpen }"
    >
      <!-- Nagłówek sidebaru -->
      <div class="flex justify-between items-center p-4 border-b bg-yellow-400">
        <h2 class="text-lg font-semibold text-black">Czaty</h2>
        <button @click="closeSidebar" class="text-black hover:text-gray-700 text-xl font-bold">×</button>
      </div>

      <!-- Lista czatów -->
      <div class="p-4 overflow-y-auto h-[calc(100%-4rem)]">
        <p v-if="loading" class="text-gray-500 text-center mt-6">Ładowanie...</p>
        <p v-else-if="chats.length === 0" class="text-gray-500 text-center mt-6">Brak czatów.</p>

        <ul v-else class="space-y-3">
          <li
            v-for="chat in chats"
            :key="chat.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition"
            @click="selectChat(chat)"
          >
            <img
              v-if="chat.profile_picture"
              :src="'http://localhost:3000' + chat.profile_picture"
              alt="avatar"
              class="w-10 h-10 rounded-full object-cover border border-yellow-400"
            />
            <div>
              <p class="font-semibold">{{ chat.name }}</p>
              <p class="text-sm text-gray-500 truncate">Kliknij, aby otworzyć czat</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["open-chat"]);

const isOpen = ref(false);
const chats = ref([]);
const loading = ref(false);

function toggleSidebar() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && chats.value.length === 0) fetchChats();
}

function closeSidebar() {
  isOpen.value = false;
}

// 🔹 Pobieranie czatów użytkownika
async function fetchChats() {
  loading.value = true;
  try {
    const res = await fetch("http://localhost:3000/api/chats", {
      credentials: "include",
    });
    if (res.ok) {
      chats.value = await res.json();
    } else {
      console.error("Błąd pobierania czatów:", res.statusText);
    }
  } catch (err) {
    console.error("Błąd czatu:", err);
  } finally {
    loading.value = false;
  }
}

function selectChat(chat) {
  emit("open-chat", chat);
  closeSidebar();
}
</script>
