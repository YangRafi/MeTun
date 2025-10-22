<template>
  <div class="relative min-h-screen bg-blue-50">
    <UserHeader :profile="profile" />
    <!-- Sidebar z eventem open-chat -->
    <ChatSidebar v-model:isOpen="isSidebarOpen" @open-chat="openChat" :onlyPrivate="true" />

    <!-- Widok dopasowań -->
    <div class="max-w-3xl mx-auto p-6 relative" v-if="!activeChat">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-center flex-1 text-blue-800">Znajdź dopasowania</h1>
        <button @click="showFilters = !showFilters" class="text-blue-600 hover:text-blue-800 text-2xl font-bold ml-4">⋮</button>
      </div>

      <transition name="fade">
        <div v-if="showFilters" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start z-50">
          <div class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-3xl shadow-xl relative border border-blue-200">
            <button @click="showFilters=false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>
            <h2 class="text-xl font-semibold mb-4 text-center text-blue-800">Filtry dopasowań</h2>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-blue-800">Płeć</label>
                <select v-model="filters.gender" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300">
                  <option value="">Dowolna</option>
                  <option value="male">Mężczyzna</option>
                  <option value="female">Kobieta</option>
                </select>
              </div>
              <div class="flex gap-2">
                <div class="flex-1">
                  <label class="block mb-1 text-sm font-medium text-blue-800">Wiek od</label>
                  <input v-model.number="filters.ageMin" type="number" min="18" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300" />
                </div>
                <div class="flex-1">
                  <label class="block mb-1 text-sm font-medium text-blue-800">Wiek do</label>
                  <input v-model.number="filters.ageMax" type="number" min="18" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300" />
                </div>
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-blue-800">Uczelnia</label>
                <input v-model="universityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..." class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"/>
                <ul v-if="universitySuggestions.length>0" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
                  <li v-for="u in universitySuggestions" :key="u.university_id" @click="selectUniversity(u)" class="p-2 hover:bg-blue-50 cursor-pointer">{{u.university_name}}</li>
                </ul>
              </div>
              <div v-if="filters.universityId">
                <label class="block mb-1 text-sm font-medium text-blue-800">Wydział</label>
                <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300">
                  <option value="">Wybierz...</option>
                  <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{f.faculty_name}}</option>
                </select>
              </div>
              <div v-if="filters.facultyId">
                <label class="block mb-1 text-sm font-medium text-blue-800">Kierunek</label>
                <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300">
                  <option value="">Wybierz...</option>
                  <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{d.name}}</option>
                </select>
              </div>
              <div class="mt-4">
                <button @click="applyFilters(); showFilters=false;" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full shadow-md">Zastosuj filtry</button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <MatchProfileCard v-if="matches.length && currentIndex< matches.length" :profile="currentProfile" @swipe-left="swipeLeft" @swipe-right="swipeRight" class="rounded-3xl shadow-xl match-card"/>
      <p v-else-if="searched" class="text-center mt-6 text-gray-500">Brak dostępnych profili.</p>
    </div>

    <!-- ChatBox -->
    <ChatBox v-if="activeChat" :chat="activeChat" :userId="profile.user_id" @close="closeChat"/>

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
function openChat(chat){
  activeChat.value = chat;  // przypisanie czatu
}

function closeChat(){
  activeChat.value = null;  // zamknięcie czatu
}

const universityQuery = ref("");
const universitySuggestions = ref([]);
const faculties = ref([]);
const disciplines = ref([]);

const showMatch = ref(false);
const matchProfile = ref({});
const currentProfile = computed(()=>matches.value[currentIndex.value] || {});

async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me",{ credentials:"include" });
  if(!res.ok) return;
  Object.assign(profile, await res.json());
}

onMounted(fetchUser);

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

function showItsAMatchAnimation(profile){ matchProfile.value = profile; showMatch.value = true; setTimeout(()=>showMatch.value=false,3000); }
function nextProfile(){ if(currentIndex.value< matches.value.length-1) currentIndex.value++; else matches.value=[]; }

onMounted(()=>{
  socket.on("match_created", data=>console.log("🔔 Nowy match!", data));
  socket.on("match_deleted", data=>console.log("❌ Match usunięty:", data));
});
onUnmounted(()=>{ socket.off("match_created"); socket.off("match_deleted"); });

async function applyFilters(){
  const params = new URLSearchParams();
  for(const k in filters) if(filters[k]) params.append(k,filters[k]);
  const res = await fetch(`http://localhost:3000/api/matches/potential?${params.toString()}`,{ credentials:"include" });
  matches.value = await res.json();
  currentIndex.value = 0;
  searched.value = true;
}

let fetchTimeout;
async function fetchUniversities() {
  if(universityQuery.value.length<1){ universitySuggestions.value=[]; return; }
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async ()=>{
    const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`,{ credentials:"include" });
    const data = await res.json();
    universitySuggestions.value = data.slice(0,10);
  },250);
}

async function selectUniversity(u){ 
  filters.universityId=u.university_id; 
  universityQuery.value=u.university_name; 
  universitySuggestions.value=[]; 
  await fetchFaculties(); 
}

async function fetchFaculties(){ 
  if(!filters.universityId) return; 
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`,{ credentials:"include" }); 
  faculties.value=await res.json(); 
}

async function onFacultyChange(){ 
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`,{ credentials:"include" }); 
  disciplines.value=await res.json(); 
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition: opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
.match-card{background:linear-gradient(135deg,#1e3a8a 0%,#0ea5e9 100%);color:white;}
</style>
