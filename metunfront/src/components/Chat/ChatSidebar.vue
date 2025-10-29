<template>
  <div>
    <!-- 🔹 Przycisk otwarcia -->
    <button
      @click="toggleSidebar"
      class="fixed top-24 left-6 z-50 bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
      title="Otwórz czat"
    >💬</button>

    <!-- 🔹 Overlay -->
    <div
      v-if="isOpen"
      @click="closeSidebar"
      class="fixed inset-0 bg-white/20 backdrop-blur-sm z-40 transition-opacity"
    ></div>

    <!-- 🔹 Sidebar -->
    <div
      class="fixed top-0 left-0 h-full w-80 bg-white/80 backdrop-blur-md shadow-2xl z-50 transform transition-transform duration-300 rounded-r-3xl border border-blue-200 overflow-hidden"
      :class="{ '-translate-x-full': !isOpen, 'translate-x-0': isOpen }"
    >
      <!-- nagłówek -->
      <div class="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-r-3xl shadow-md">
        <h2 class="text-lg font-semibold drop-shadow-md">Czaty</h2>
        <button @click="closeSidebar" class="text-white hover:text-gray-100 text-xl font-bold">×</button>
      </div>

      <!-- lista czatów -->
      <div class="p-4 overflow-y-auto h-[calc(100%-4rem)] scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
        <p v-if="loading" class="text-gray-500 text-center mt-6">Ładowanie...</p>
        <p v-else-if="chats.length === 0" class="text-gray-400 text-center mt-6 italic">Brak czatów.</p>

        <ul v-else class="space-y-3">
          <li
            v-for="chat in chats"
            :key="chat.id"
            @click="openChat(chat)"
            class="flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all shadow-sm"
          >
            <img
              v-if="chat.profile_picture"
              :src="chat.profile_picture"
              alt="avatar"
              class="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm"
            />
            <div class="flex-1 truncate relative">
              <p class="font-semibold text-blue-800 truncate">{{ chat.name }}</p>
              <p
                class="text-sm truncate"
                :class="chat.unread ? 'font-bold text-blue-900' : 'text-gray-600'"
                :title="formatTimestamp(chat.lastMessageTimestamp)"
              >
                <span v-if="typingStatus[chat.id]" class="flex items-center gap-2">
                  <span class="text-xs italic">{{ typingStatus[chat.id] }} pisze</span>
                  <span class="typing-indicator"><span></span><span></span><span></span></span>
                </span>
                <span v-else>{{ chat.lastMessage ? chat.lastMessage.slice(0,40)+(chat.lastMessage.length>40?'…':'') : 'Brak wiadomości' }}</span>
              </p>
              <span v-if="chat.unread" class="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full" title="Nowa wiadomość"></span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import socket from "../../socket.js";

const emit = defineEmits(["open-chat"]);
const props = defineProps({ userId: Number, onlyPrivate: Boolean, onlyGroups: Boolean });

const isOpen = ref(false);
const chats = ref([]);
const loading = ref(false);
const typingStatus = ref({});
const typingTimers = new Map();
const profileCache = new Map();

function toggleSidebar() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && chats.value.length === 0) fetchChats();
}
function closeSidebar() { isOpen.value = false; }

async function fetchChats() {
  loading.value = true;
  try {
    let fetchedChats = [];
    if (props.onlyPrivate) {
      const res = await fetch("http://localhost:3000/api/chats/private",{ credentials:"include" });
      fetchedChats = res.ok ? await res.json() : [];
    } else if (props.onlyGroups) {
      const res = await fetch("http://localhost:3000/api/chats/group",{ credentials:"include" });
      fetchedChats = res.ok ? await res.json() : [];
    } else {
      const privateRes = await fetch("http://localhost:3000/api/chats/private",{ credentials:"include" });
      const groupRes = await fetch("http://localhost:3000/api/chats/group",{ credentials:"include" });
      fetchedChats = (privateRes.ok ? await privateRes.json():[]).concat(groupRes.ok ? await groupRes.json():[]);
    }

    chats.value = fetchedChats.map(c => {
      const normalized = { ...c };
      if(!normalized.id){ if(normalized.group_id) normalized.id = normalized.group_id; else if(normalized.match_id) normalized.id = normalized.match_id; }
      return normalized;
    }).sort((a,b)=>new Date(b.lastMessageTimestamp||0)-new Date(a.lastMessageTimestamp||0));
  } catch(e){ console.error(e); } finally { loading.value=false; }
}

async function getUserName(userId){
  if(!userId) return null;
  if(profileCache.has(userId)) return profileCache.get(userId);
  try {
    const res = await fetch(`http://localhost:3000/api/profiles/${userId}`, { credentials: "include" });
    if(!res.ok) return null;
    const data = await res.json();
    const name = (data.name ? data.name : (data.username || null));
    profileCache.set(userId, name);
    return name;
  } catch(e){ console.error(e); return null; }
}

onMounted(()=>{
  socket.emit("register", props.userId);
  socket.on("receive_message", msg => {
    const chatId = msg.matchId ?? msg.groupId;
    if (!chatId) return;
    const index = chats.value.findIndex(c=>c.id===chatId);
    if(index>-1){
      const [chat] = chats.value.splice(index,1);
      chat.lastMessage = msg.content;
      chat.lastMessageTimestamp = msg.timestamp;
      chat.unread = true;
      chats.value.unshift(chat);
    }
  });

  socket.on("user_typing", async ({ chatId, userId })=>{
    if(!chatId || !userId || userId === props.userId) return;
    let name = await getUserName(userId) || 'Ktoś';
    typingStatus.value[chatId] = name;
    if(typingTimers.has(chatId)) clearTimeout(typingTimers.get(chatId));
    const t = setTimeout(()=>{ typingStatus.value[chatId] = false; typingTimers.delete(chatId); },3000);
    typingTimers.set(chatId,t);
  });
});

function openChat(chat){ chat.unread=false; emit("open-chat", chat); closeSidebar(); }
function formatTimestamp(ts){ return ts ? new Date(ts).toLocaleString() : ''; }
</script>

<style scoped>
.scrollbar-thin { scrollbar-width: thin; }
.scrollbar-thumb-blue-300::-webkit-scrollbar-thumb { background-color:#60a5fa;border-radius:9999px; }
.scrollbar-track-blue-50::-webkit-scrollbar-track{ background-color:#eff6ff; }
.typing-indicator { display:inline-flex; align-items:center; gap:3px; }
.typing-indicator span { width:6px;height:6px;background:#999;border-radius:50%;animation:blink 1.4s infinite both; }
.typing-indicator span:nth-child(2){ animation-delay:0.2s; }
.typing-indicator span:nth-child(3){ animation-delay:0.4s; }
@keyframes blink{0%,80%,100%{transform:scale(0);opacity:0.3;}40%{transform:scale(1);opacity:1;}}
</style>
