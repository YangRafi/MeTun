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
        :key="m.message_id"
        :class="m.sender_id === userId ? 'text-right' : 'text-left'"
      >
        <div
          :class="[
            'inline-block p-2 rounded-lg',
            m.sender_id === userId
              ? 'bg-yellow-400 text-black'
              : 'bg-gray-200 text-black'
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
  chat: Object, // zawiera: match_id, user_id, name, profile_picture
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
      // upewnij się, że używamy właściwego ID matcha
      const matchId = newChat.match_id ?? newChat.id;
      await loadMessages(matchId);
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
  // filtruj po match_id, a nie po id chatu
  if (msg.matchId === props.chat?.match_id) {
    messages.value.push(msg);
    scrollToBottom();
  }
});

// 🔹 Fetch historii wiadomości
async function loadMessages(matchId) {
  try {
    const res = await fetch(`http://localhost:3000/api/chat/${matchId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Błąd pobierania wiadomości");

    // backend powinien zwracać wszystkie wiadomości dla match_id
    const data = await res.json();
    // sortowanie po czasie rosnąco
    messages.value = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
    matchId: props.chat.match_id,
    senderId: props.userId,
    receiverId: props.chat.user_id,
    content: newMessage.value,
  };

  socket.emit("send_message", msg);

  try {
    await fetch(`http://localhost:3000/api/chat/${props.chat.match_id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  } catch (err) {
    console.error(err);
  }

  messages.value.push(msg);
  newMessage.value = "";
  scrollToBottom();
}

// 🔹 Scroll
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// 🔹 Zamknięcie
function closeChat() {
  emit("close");
}

onUnmounted(() => {
  socket.disconnect();
});
</script>
