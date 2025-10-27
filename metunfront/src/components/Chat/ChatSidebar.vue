<template>
  <div>
    <button @click="toggleSidebar" class="fixed top-24 left-6 z-50 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform" title="Otwórz czat">💬</button>
    <div v-if="isOpen" @click="closeSidebar" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"></div>
    <div class="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 rounded-r-3xl overflow-hidden border-r border-blue-200" :class="{ '-translate-x-full': !isOpen, 'translate-x-0': isOpen }">
      <div class="flex justify-between items-center p-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-white">
        <h2 class="text-lg font-semibold">Czaty</h2>
        <button @click="closeSidebar" class="text-white hover:text-gray-100 text-xl font-bold">×</button>
      </div>
      <div class="p-4 overflow-y-auto h-[calc(100%-4rem)] scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-blue-50">
        <p v-if="loading" class="text-gray-500 text-center mt-6">Ładowanie...</p>
        <p v-else-if="chats.length === 0" class="text-gray-400 text-center mt-6 italic">Brak czatów.</p>
        <ul v-else class="space-y-3">
          <li v-for="chat in chats" :key="chat.id" class="flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all" @click="openChat(chat)">
            <img v-if="chat.profile_picture" :src="chat.profile_picture" alt="avatar" class="w-12 h-12 rounded-full object-cover border-2 border-gradient-to-r from-blue-400 via-cyan-400 to-teal-400"/>
            <div class="flex-1 truncate relative">
              <p class="font-semibold text-gray-800 truncate">{{ chat.name }}</p>
              <p class="text-sm truncate" :class="chat.unread ? 'font-bold text-gray-900' : 'text-gray-500'" :title="formatTimestamp(chat.lastMessageTimestamp)">
                <!-- jeśli ktoś pisze, pokaż imię + animacja kropki -->
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
const props = defineProps({
  onlyPrivate: { type: Boolean, default: false },
  onlyGroups: { type: Boolean, default: false },
  userId: Number
});

const isOpen = ref(false);
const chats = ref([]);
const loading = ref(false);

// typingStatus: { [chatId]: "Kasia" } lub undefined
const typingStatus = ref({});
// per-chat timers to clear typing state reliably
const typingTimers = new Map();

// cache profili: { userId: name }
const profileCache = new Map();

function toggleSidebar() {
  isOpen.value = !isOpen.value;
  if(isOpen.value && chats.value.length===0) fetchChats();
}
function closeSidebar() { isOpen.value=false; }

async function fetchChats() {
  loading.value = true;
  try {
    let fetchedChats = [];

    if(props.onlyPrivate){
      const res = await fetch("http://localhost:3000/api/chats/private",{ credentials:"include" });
      fetchedChats = res.ok ? await res.json() : [];
    } else if(props.onlyGroups){
      const res = await fetch("http://localhost:3000/api/chats/group",{ credentials:"include" });
      fetchedChats = res.ok ? await res.json() : [];
    } else {
      // wszystkie czaty
      const privateRes = await fetch("http://localhost:3000/api/chats/private",{ credentials:"include" });
      const groupRes = await fetch("http://localhost:3000/api/chats/group",{ credentials:"include" });
      fetchedChats = (privateRes.ok ? await privateRes.json():[]).concat(groupRes.ok ? await groupRes.json():[]);
    }

    // normalizuj: upewnij się, że każdy chat ma pole `id` i `name` (jeśli Twoje API używa group_id itp., zmapuj tutaj)
    chats.value = fetchedChats.map(c => {
      // jeśli nie ma id, spróbuj z group_id / match_id
      const normalized = { ...c };
      if(!normalized.id){
        if(normalized.group_id) normalized.id = normalized.group_id;
        else if(normalized.match_id) normalized.id = normalized.match_id;
      }
      // upewnij się, że name istnieje (API powinno to zwracać)
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
  } catch (e) {
    console.error("Błąd pobierania profilu:", e);
    return null;
  }
}

onMounted(()=>{
  socket.emit("register", props.userId);

  socket.on("match_created", (data) => {
    const exists = chats.value.find(c => c.id === data.matchId);
    if(!exists){
      chats.value.unshift({ id: data.matchId, name: data.userB === props.userId ? data.userAName : data.userBName, profile_picture: data.userB === props.userId ? data.userAPicture : data.userBPicture, lastMessage: null, lastMessageTimestamp: new Date(), unread: true });
    }
  });

  // receive_message: obsługuje matchId i groupId
  socket.on("receive_message", msg=>{
    const chatId = msg.matchId ?? msg.groupId;
    if (!chatId) return;
    const index = chats.value.findIndex(c=>c.id===chatId);
    if(index>-1){
      const [chat]=chats.value.splice(index,1);
      chat.lastMessage=msg.content;
      chat.lastMessageTimestamp=msg.timestamp;
      chat.unread=true;
      chats.value.unshift(chat);
    } else {
      // opcjonalnie można dopisać nowy chat jeśli go nie ma
      // chats.value.unshift({ id: chatId, name: msg.senderName || 'Nowy czat', profile_picture: null, lastMessage: msg.content, lastMessageTimestamp: msg.timestamp, unread: true });
    }
  });

  // user_typing: { chatId, userId } — ustaw imię dla danego chatId
  socket.on("user_typing", async ({ chatId, userId })=>{
    if(!chatId || !userId) return;
    if(userId === props.userId) return; // nie pokazuj gdy to ja

    // spróbuj znaleźć imię w istniejących chatach (dla prywatnych chatów często mamy name i user_id)
    const chat = chats.value.find(c => c.id === chatId);
    let name = null;
    if(chat){
      // jeśli to prywatny chat i mamy pola user_id/name
      if(chat.user_id && chat.user_id === userId && chat.name) name = chat.name;
      // jeśli chat ma members lub last typer name do dyspozycji, możesz spróbować odczytać stąd
      if(!name && chat.lastTypistName) name = chat.lastTypistName;
    }
    if(!name){
      // pobierz profil i zapamiętaj
      name = await getUserName(userId) || 'Ktoś';
    }

    // ustaw typingStatus i timer
    typingStatus.value[chatId] = name;

    // wyczyść poprzedni timer
    if(typingTimers.has(chatId)) clearTimeout(typingTimers.get(chatId));

    const t = setTimeout(()=>{
      typingStatus.value[chatId] = false;
      // można też delete typingStatus.value[chatId]
      typingTimers.delete(chatId);
    }, 3000);
    typingTimers.set(chatId, t);
  });
});

function openChat(chat){ chat.unread=false; emit("open-chat", chat); closeSidebar(); }
function formatTimestamp(ts){ if(!ts) return ''; return new Date(ts).toLocaleString(); }
</script>

<style scoped>
.scrollbar-thin { scrollbar-width: thin; }
.scrollbar-thumb-cyan-400::-webkit-scrollbar-thumb { background-color:#06b6d4;border-radius:9999px;}
.scrollbar-track-blue-50::-webkit-scrollbar-track{background-color:#eff6ff;}
.typing-indicator { display:inline-flex; align-items:center; gap:3px; }
.typing-indicator span { width:6px;height:6px;background:#999;border-radius:50%;animation:blink 1.4s infinite both; }
.typing-indicator span:nth-child(2){ animation-delay:0.2s; }
.typing-indicator span:nth-child(3){ animation-delay:0.4s; }
@keyframes blink{0%,80%,100%{transform:scale(0);opacity:0.3;}40%{transform:scale(1);opacity:1;}}
</style>
