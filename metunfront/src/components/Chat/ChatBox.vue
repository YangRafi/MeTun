<template>
  <div v-if="chat" class="fixed bottom-6 right-6 w-96 max-h-[55vh] bg-blue-50 rounded-3xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden">
    <div class="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 text-white">
      <div class="flex items-center gap-2">
        <img v-if="chat.profile_picture" :src="chat.profile_picture" class="w-10 h-10 rounded-full border-2 border-white"/>
        <h3 class="font-semibold">{{ chat.name }}</h3>
      </div>
      <button @click="closeChat" class="font-bold text-xl hover:text-gray-200">×</button>
    </div>

    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-blue-50">
      <div v-for="m in messages" :key="m.message_id || m.timestamp" class="flex items-start gap-2" :class="m.senderId===userId?'justify-end':'justify-start'">
        <img v-if="m.senderId!==userId && m.senderAvatar" :src="m.senderAvatar" class="w-8 h-8 rounded-full mt-1"/>
        <div :class="['inline-block p-3 rounded-2xl max-w-[75%] break-words', m.senderId===userId?'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 text-white shadow-md':'bg-white text-gray-800 shadow-sm']" :title="formatTimestamp(m.timestamp)">
          {{ m.content }}
        </div>
      </div>

      <div v-if="typing" class="ml-2"><span class="typing-indicator"><span></span><span></span><span></span></span></div>
    </div>

    <div class="p-3 border-t flex gap-2 bg-white">
      <input v-model="newMessage" placeholder="Napisz wiadomość..." class="flex-1 border rounded-full px-3 py-2 focus:ring-2 focus:ring-cyan-300 focus:outline-none" @keyup.enter="sendMessage" @input="notifyTyping"/>
      <button @click="sendMessage" class="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-4 py-2 shadow-lg">➤</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { socket } from "../../socket.js";

const props = defineProps({ chat: Object, userId: Number });
const emit = defineEmits(["close"]);

const messages = ref([]);
const newMessage = ref("");
const messagesContainer = ref(null);
const typing = ref(false);

onMounted(()=>{
  socket.emit("register", props.userId);
  socket.on("receive_message", handleReceive);
  socket.on("message_sent", handleMessageSent);
  socket.on("user_typing", ({ chatId, userId: senderId })=>{
    if(chatId===props.chat?.id && senderId!==props.userId){
      typing.value=true;
      setTimeout(()=>typing.value=false,3000);
    }
  });
});

onBeforeUnmount(()=>{
  socket.off("receive_message", handleReceive);
  socket.off("message_sent", handleMessageSent);
  socket.off("user_typing");
});

const handleReceive = (msg)=>{
  if(msg.matchId===props.chat?.id && !messages.value.some(m=>m.message_id===msg.message_id)){
    messages.value.push(msg);
    scrollToBottom();
    props.chat.unread=true;
  }
};
const handleMessageSent = (msg)=>{
  if(msg.matchId===props.chat?.id && !messages.value.some(m=>m.message_id===msg.message_id)){
    messages.value.push(msg);
    scrollToBottom();
  }
};

watch(()=>props.chat, async newChat=>{
  if(newChat){
    newChat.unread=false;
    await loadMessages(newChat.type,newChat.id);
    scrollToBottom();
  } else messages.value=[];
},{immediate:true});

async function loadMessages(chatType,chatId){
  try{
    const res=await fetch(`http://localhost:3000/api/chats/${chatType}/${chatId}`,{credentials:"include"});
    if(!res.ok) throw new Error("Błąd pobierania wiadomości");
    messages.value=(await res.json()).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    await nextTick(); scrollToBottom();
  } catch(err){ console.error(err);}
}

function sendMessage(){
  if(!newMessage.value.trim()) return;
  socket.emit("send_message",{
    matchId:props.chat.id,
    senderId:props.userId,
    receiverId:props.chat.user_id,
    content:newMessage.value,
    timestamp:new Date().toISOString()
  });
  newMessage.value="";
}

function notifyTyping(){
  if(!props.chat) return;
  socket.emit("user_typing",{ chatId:props.chat.id, userId:props.userId, receiverId:props.chat.user_id });
}

function scrollToBottom(){ nextTick(()=>{ if(messagesContainer.value) messagesContainer.value.scrollTop=messagesContainer.value.scrollHeight; }); }
function closeChat(){ emit("close"); }
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
