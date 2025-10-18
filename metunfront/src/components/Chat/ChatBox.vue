<template>
  <div
    v-if="chat"
    class="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-yellow-400 flex flex-col overflow-hidden"
  >
    <!-- Nagłówek -->
    <div class="flex items-center justify-between p-3 bg-yellow-400">
      <div class="flex items-center gap-2">
        <img
          v-if="chat.profile_picture"
          :src="'http://localhost:3000' + chat.profile_picture"
          class="w-8 h-8 rounded-full border border-white"
        />
        <h3 class="font-semibold text-black">{{ chat.name }}</h3>
      </div>
      <button @click="closeChat" class="font-bold text-xl text-black">×</button>
    </div>

    <!-- Wiadomości -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-3 space-y-2">
      <div
        v-for="m in messages"
        :key="m.message_id || m.timestamp"
        class="flex items-start gap-2"
        :class="m.senderId === userId ? 'justify-end' : 'justify-start'"
      >
        <!-- Avatar dla innych osób -->
        <img
          v-if="m.senderId !== userId"
          :src="'http://localhost:3000' + m.senderAvatar"
          class="w-6 h-6 rounded-full mt-1"
        />

        <div
          :class="[
            'inline-block p-2 rounded-lg max-w-[75%]',
            m.senderId === userId ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-black'
          ]"
        >
          {{ m.content }}
        </div>
      </div>
    </div>

    <!-- Pole wysyłania -->
    <div class="p-3 border-t flex gap-2">
      <input
        v-model="newMessage"
        placeholder="Napisz wiadomość..."
        class="flex-1 border rounded-full px-3 py-2"
        @keyup.enter="sendMessage"
      />
      <button
        @click="sendMessage"
        class="bg-yellow-400 hover:bg-yellow-500 text-black rounded-full px-4 py-2"
      >
        ➤
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from "vue";
import { io } from "socket.io-client";

const props = defineProps({
  chat: Object,   // id (match_id), name, profile_picture, user_id
  userId: Number,
});

const emit = defineEmits(["close"]);

const socket = io("http://localhost:3000");
const messages = ref([]);
const newMessage = ref("");
const messagesContainer = ref(null);

// 🔹 Watch na zmiany chatu
watch(
  () => props.chat,
  async (newChat) => {
    if (newChat) {
      await loadMessages(newChat.id);
      socket.emit("register", props.userId);
      scrollToBottom();
    } else {
      messages.value = [];
    }
  },
  { immediate: true }
);

// 🔹 Odbieranie wiadomości przez socket
socket.on("receive_message", (msg) => {
  if (msg.matchId === props.chat?.id && msg.senderId !== props.userId) {
    // Dodaj tylko jeśli nie ma w liście
    if (!messages.value.some(m => m.timestamp === msg.timestamp && m.senderId === msg.senderId)) {
      messages.value.push({
        ...msg,
        senderAvatar: msg.senderAvatar || props.chat.profile_picture
      });
      scrollToBottom();
    }
  }
});

// 🔹 Fetch historii wiadomości
async function loadMessages(matchId) {
  try {
    const res = await fetch(`http://localhost:3000/api/chats/private/${matchId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Błąd pobierania wiadomości");

    const data = await res.json();

    messages.value = data
      .map(m => ({
        message_id: m.message_id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        timestamp: m.timestamp,
        senderAvatar: m.sender_id === props.userId ? null : props.chat.profile_picture
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error(err);
  }
}

// 🔹 Wysyłanie wiadomości
async function sendMessage() {
  if (!newMessage.value.trim()) return;

  const msg = {
    matchId: props.chat.id,
    senderId: props.userId,
    receiverId: props.chat.user_id,
    content: newMessage.value,
    timestamp: new Date().toISOString()
  };

  // 🔹 Emit tylko do odbiorcy (nie dodawaj od razu swojego)
  socket.emit("send_message", msg);

  // 🔹 Wyślij do backendu tylko raz
  try {
    await fetch(`http://localhost:3000/api/chats/private/${props.chat.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msg.content }),
    });
  } catch (err) {
    console.error(err);
  }

  // 🔹 Dodajemy lokalnie
  messages.value.push(msg);
  newMessage.value = "";
  scrollToBottom();
}

// 🔹 Scroll na dół
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// 🔹 Zamknięcie chatu
function closeChat() {
  emit("close");
}

onUnmounted(() => {
  socket.disconnect();
});
</script>
