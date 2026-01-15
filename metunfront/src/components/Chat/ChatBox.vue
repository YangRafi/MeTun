<template>
  <div
    v-if="chat"
    class="fixed bottom-6 right-6 w-96 min-h-[55vh] max-h-[55vh]
           bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-200
           flex flex-col overflow-hidden font-sans text-black transition-all z-50 animate-slide-up"
  >
    <div class="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-t-3xl shadow-md">
      <div class="flex items-center gap-3">
        <img
          v-if="chat.profile_picture"
          :src="chat.profile_picture"
          class="w-10 h-10 rounded-full border-2 border-white shadow-sm"
        />
        <div>
          <h3 class="font-semibold text-lg drop-shadow-sm">{{ chat.name }}</h3>
          <p v-if="chat.type === 'group'" class="text-xs opacity-80 italic">
            Czat grupowy
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative" v-if="chat.type === 'group'">
          <button
            @click="showGroupMenu = !showGroupMenu"
            class="text-white font-bold text-xl hover:text-gray-100"
          >⋮</button>

          <div
            v-if="showGroupMenu"
            class="absolute right-0 mt-2 bg-white text-black shadow-lg rounded-xl w-48 z-50 overflow-hidden border border-blue-100"
          >
            <button
              @click="openMemberModal"
              class="block w-full text-left px-4 py-2 hover:bg-blue-50 transition"
            >
              👥 Członkowie grupy
            </button>
          </div>
        </div>
        <button
          @click="closeChat"
          class="font-bold text-xl hover:text-gray-100 transition"
        >×</button>
      </div>
    </div>

    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50"
    >
      <div
        v-for="m in messages"
        :key="m.message_id || m.timestamp"
        class="flex items-start gap-2"
        :class="m.senderId === userId ? 'justify-end' : 'justify-start'"
      >
        <img
          v-if="m.senderId !== userId && m.senderAvatar"
          :src="m.senderAvatar"
          class="w-8 h-8 rounded-full mt-1 border border-blue-200"
        />
        <div
          :class="[ 
            'inline-block p-3 rounded-2xl max-w-[75%] break-words shadow-sm',
            m.senderId === userId
              ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 text-white shadow-md'
              : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border border-blue-100'
          ]"
          :title="formatTimestamp(m.timestamp)"
        >
          {{ m.content }}
        </div>
      </div>

      <div
        v-if="typingUser"
        class="ml-2 text-sm text-blue-600 flex items-center gap-2 italic"
      >
        <span class="font-medium">{{ typingUser }}</span>
        <span>pisze...</span>
        <span class="typing-indicator"><span></span><span></span><span></span></span>
      </div>
    </div>

    <div class="p-3 border-t bg-gradient-to-r from-blue-50 to-blue-100 rounded-b-3xl flex gap-2">
      <input
        v-model="newMessage"
        placeholder="Napisz wiadomość..."
        class="flex-1 border border-blue-200 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none"
        @keyup.enter="sendMessage"
        @input="notifyTyping"
      />
      <button
        @click="sendMessage"
        class="bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white rounded-full px-4 py-2 shadow-md transition-transform hover:scale-105"
      >➤</button>
    </div>

    <MemberListModal
      v-if="showMemberModal"
      :members="groupMembers"
      :isAdmin="isCurrentUserAdmin"
      @close="showMemberModal = false"
      @remove="removeMember"
      @changeRole="changeMemberRole"
      @viewProfile="viewProfile"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import socket from "../../socket.js";
import MemberListModal from "../Modal/MemberListModal.vue";

const props = defineProps({ chat: Object, userId: Number });
const emit = defineEmits(["close"]);

const messages = ref([]);
const newMessage = ref("");
const messagesContainer = ref(null);
const typingUser = ref(false);

const showGroupMenu = ref(false);
const showMemberModal = ref(false);
const groupMembers = ref([]);
const isCurrentUserAdmin = ref(false);

const profileCache = new Map();
let typingTimer = null;

onMounted(() => {
  socket.emit("register", props.userId);
  socket.on("receive_message", handleReceive);
  socket.on("message_sent", handleMessageSent);
  socket.on("user_typing", async ({ chatId, userId }) => {
    if (chatId === props.chat?.id && userId !== props.userId) {
      const name = await getUserName(userId);
      typingUser.value = name || "Ktoś";
      if (typingTimer) clearTimeout(typingTimer);
      typingTimer = setTimeout(() => (typingUser.value = false), 3000);
    }
  });
});

onBeforeUnmount(() => {
  socket.off("receive_message", handleReceive);
  socket.off("message_sent", handleMessageSent);
  socket.off("user_typing");
  if (typingTimer) clearTimeout(typingTimer);
});

const handleReceive = (msg) => {
  const isMatch = msg.matchId === props.chat?.id;
  const isGroup = msg.groupId === props.chat?.id;
  if ((isMatch || isGroup) && !messages.value.some((m) => m.message_id === msg.message_id)) {
    messages.value.push(msg);
    scrollToBottom();
    props.chat.unread = true;
  }
};

const handleMessageSent = (msg) => {
  const isMatch = msg.matchId === props.chat?.id;
  const isGroup = msg.groupId === props.chat?.id;
  if ((isMatch || isGroup) && !messages.value.some((m) => m.message_id === msg.message_id)) {
    messages.value.push(msg);
    scrollToBottom();
  }
};

watch(
  () => props.chat,
  async (newChat) => {
    if (newChat) {
      newChat.unread = false;
      await loadMessages(newChat.type, newChat.id);
      scrollToBottom();
    } else messages.value = [];
  },
  { immediate: true }
);

async function loadMessages(chatType, chatId) {
  try {
    const endpoint =
      chatType === "group"
        ? `http://localhost:3000/api/chats/group/${chatId}`
        : `http://localhost:3000/api/chats/private/${chatId}`;

    const res = await fetch(endpoint, { credentials: "include" });
    if (!res.ok) throw new Error("Błąd pobierania wiadomości");
    const data = await res.json();
    messages.value = Array.isArray(data)
      ? data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      : [];
    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error(err);
  }
}

function sendMessage() {
  if (!newMessage.value.trim()) return;
  const payload = {
    senderId: props.userId,
    content: newMessage.value,
    timestamp: new Date().toISOString(),
  };
  if (props.chat.type === "private") {
    payload.matchId = props.chat.id;
    payload.receiverId = props.chat.user_id;
  }
  if (props.chat.type === "group") {
    payload.groupId = props.chat.id;
  }
  socket.emit("send_message", payload);
  newMessage.value = "";
}

function notifyTyping() {
  if (!props.chat) return;
  socket.emit("user_typing", {
    chatId: props.chat.id,
    userId: props.userId,
    receiverId: props.chat.user_id,
    groupId: props.chat.type === "group" ? props.chat.id : null,
  });
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value)
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  });
}
function closeChat() {
  emit("close");
}
function formatTimestamp(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

async function getUserName(userId) {
  if (!userId) return null;
  if (profileCache.has(userId)) return profileCache.get(userId);
  try {
    const res = await fetch(`http://localhost:3000/api/profiles/${userId}`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    const name = data.name ? data.name : data.username || null;
    profileCache.set(userId, name);
    return name;
  } catch (e) {
    console.error("Błąd pobrania profilu:", e);
    return null;
  }
}

async function openMemberModal() {
  showGroupMenu.value = false;
  try {
    const res = await fetch(`http://localhost:3000/api/group-members/${props.chat.id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Błąd pobierania członków grupy");
    const data = await res.json();
    groupMembers.value = Array.isArray(data) ? data : [];
    const me = groupMembers.value.find((m) => m.user_id === props.userId);
    isCurrentUserAdmin.value = me?.role === "admin";
    showMemberModal.value = true;
  } catch (e) {
    console.error(e);
    groupMembers.value = [];
  }
}

async function removeMember(userId) {
  await fetch(`http://localhost:3000/api/groups/${props.chat.id}/remove-member`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  groupMembers.value = groupMembers.value.filter((m) => m.user_id !== userId);
}

async function changeMemberRole(userId) {
  const member = groupMembers.value.find((m) => m.user_id === userId);
  const newRole = member.role === "admin" ? "member" : "admin";
  await fetch(`http://localhost:3000/api/groups/${props.chat.id}/change-role`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role: newRole }),
  });
  member.role = newRole;
}

function viewProfile(userId) {
  alert("Otwieram profil użytkownika: " + userId);
}
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}
.scrollbar-thumb-blue-300::-webkit-scrollbar-thumb {
  background-color: #60a5fa;
  border-radius: 9999px;
}
.scrollbar-track-blue-50::-webkit-scrollbar-track {
  background-color: #eff6ff;
}
.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #60a5fa;
  border-radius: 50%;
  animation: blink 1.4s infinite both;
}
.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slide-up 0.25s ease-out;
}
</style>
