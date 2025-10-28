<template>
  <div class="relative min-h-screen bg-blue-50">
    <UserHeader :profile="profile" />
    <ChatSidebar v-model:isOpen="isSidebarOpen" @open-chat="openChat" :onlyPrivate="true" />

    <!-- Widok dopasowań -->
    <div class="max-w-3xl mx-auto p-6 relative" v-if="!activeChat">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold flex-1 text-center text-blue-800">Znajdź dopasowania</h1>
        <button @click="showFilters = true" class="text-blue-600 hover:text-blue-800 text-2xl font-bold ml-4">⋮</button>
      </div>

      <!-- Modal filtrów -->
      <MatchFilterModal
        v-model:showFilters="showFilters"
        :filters="filters"
        :faculties="faculties"
        :disciplines="disciplines"
        @close="showFilters=false"
        @applyFilters="applyFilters()"
        @fetchDisciplines="onFacultyChange()"
        @selectUniversity="selectUniversity"
      />

      <MatchProfileCard
        v-if="matches.length && currentIndex < matches.length"
        :profile="currentProfile"
        @swipe-left="swipeLeft"
        @swipe-right="swipeRight"
        class="rounded-3xl shadow-xl match-card"
      />
      <p v-else-if="searched" class="text-center mt-6 text-gray-500">Brak dostępnych profili.</p>
    </div>

    <!-- ChatBox -->
    <ChatBox v-if="activeChat" :chat="activeChat" :userId="profile.user_id" @close="closeChat"/>

    <!-- It's a Match -->
    <transition name="fade">
      <div v-if="showMatch" class="fixed inset-0 bg-black/50 flex flex-col justify-center items-center z-50">
        <div class="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-xs">
          <h2 class="text-2xl font-bold text-red-500 mb-2">It's a Match!</h2>
          <img v-if="matchProfile.profile_picture" :src="matchProfile.profile_picture" class="w-24 h-24 rounded-full mx-auto mb-2"/>
          <p class="font-semibold">{{matchProfile.name}}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";
import MatchProfileCard from "../components/Match/MatchProfileCard.vue";
import MatchFilterModal from "../components/Modal/MatchFilterModal.vue";
import socket from "../socket";

const profile = reactive({});
const filters = reactive({ gender:"", ageMin:"", ageMax:"", universityId:"", facultyId:"", disciplineId:"" });
const matches = ref([]);
const currentIndex = ref(0);
const searched = ref(false);
const showFilters = ref(false);

const isSidebarOpen = ref(false);
const activeChat = ref(null);

// ChatBox open/close
function openChat(chat){ activeChat.value = chat; }
function closeChat(){ activeChat.value = null; }

const faculties = ref([]);
const disciplines = ref([]);

const showMatch = ref(false);
const matchProfile = ref({});
const currentProfile = computed(()=>matches.value[currentIndex.value] || {});

// Pobranie profilu zalogowanego użytkownika
async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me",{ credentials:"include" });
  if(!res.ok) return;
  Object.assign(profile, await res.json());
}

onMounted(fetchUser);

// Swipe
async function swipeLeft() { await vote(false); nextProfile(); }
async function swipeRight() { await vote(true); nextProfile(); }

async function vote(like){
  const otherUserId = currentProfile.value.user_id;
  const res = await fetch("http://localhost:3000/api/matches/vote",{
    method:"POST", credentials:"include", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({userId: otherUserId, like})
  });
  if(!res.ok){ console.error("❌ Błąd przy głosowaniu"); return; }
  const data = await res.json();
  if(data.matchJustActivated){ showItsAMatchAnimation(currentProfile.value); }
}

function showItsAMatchAnimation(profile){ 
  matchProfile.value = profile; 
  showMatch.value = true; 
  setTimeout(()=>showMatch.value=false,3000); 
}
function nextProfile(){ 
  if(currentIndex.value< matches.value.length-1) currentIndex.value++; 
  else matches.value=[]; 
}

// Socket events
onMounted(()=>{
  socket.on("match_created", data=>console.log("🔔 Nowy match!", data));
  socket.on("match_deleted", data=>console.log("❌ Match usunięty:", data));
});
onUnmounted(()=>{ socket.off("match_created"); socket.off("match_deleted"); });

// Filtry
async function applyFilters(){
  const params = new URLSearchParams();
  for(const k in filters) if(filters[k]) params.append(k,filters[k]);
  const res = await fetch(`http://localhost:3000/api/matches/potential?${params.toString()}`,{ credentials:"include" });
  matches.value = await res.json();
  currentIndex.value = 0;
  searched.value = true;
}

// Fetch wydziałów/kierunków
async function onFacultyChange(){ 
  if(!filters.facultyId) return;
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`,{ credentials:"include" });
  disciplines.value = await res.json(); 
}

// Select university
async function selectUniversity(u){ 
  filters.universityId=u.university_id; 
  await fetchFaculties(); 
}

// Fetch faculties
async function fetchFaculties(){ 
  if(!filters.universityId) return; 
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`,{ credentials:"include" }); 
  faculties.value=await res.json(); 
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition: opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
.match-card{background:linear-gradient(135deg,#1e3a8a 0%,#0ea5e9 100%);color:white;}
</style>
