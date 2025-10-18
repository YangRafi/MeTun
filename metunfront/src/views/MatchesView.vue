<template>
  <div class="relative min-h-screen bg-gray-50">
    <UserHeader :profile="profile" />

    <!-- 🔹 Chat Sidebar (tylko prywatne czaty) -->
    <ChatSidebar
      v-model:isOpen="isSidebarOpen"
      @open-chat="openChat"
      :onlyPrivate="true"
    />

    <!-- 🔹 Główny content (swipe/karty matchy) -->
    <div class="max-w-3xl mx-auto p-6 relative" v-if="!activeChat">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-center flex-1">Znajdź dopasowania</h1>
        <button @click="showFilters = !showFilters" class="text-gray-600 hover:text-gray-800 text-2xl font-bold ml-4">⋮</button>
      </div>

      <!-- 🔹 Panel filtrów -->
      <transition name="fade">
        <div v-if="showFilters" class="fixed inset-0 bg-black/40 flex justify-center items-start z-50">
          <div class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-2xl shadow-lg relative">
            <button @click="showFilters = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>
            <h2 class="text-xl font-semibold mb-4 text-center">Filtry dopasowań</h2>

            <div class="grid grid-cols-1 gap-4">
              <!-- Płeć -->
              <div>
                <label class="block mb-1 text-sm font-medium">Płeć</label>
                <select v-model="filters.gender" class="w-full border rounded-lg p-2">
                  <option value="">Dowolna</option>
                  <option value="male">Mężczyzna</option>
                  <option value="female">Kobieta</option>
                </select>
              </div>

              <!-- Wiek -->
              <div class="flex gap-2">
                <div class="flex-1">
                  <label class="block mb-1 text-sm font-medium">Wiek od</label>
                  <input v-model.number="filters.ageMin" type="number" class="w-full border rounded-lg p-2" min="18"/>
                </div>
                <div class="flex-1">
                  <label class="block mb-1 text-sm font-medium">Wiek do</label>
                  <input v-model.number="filters.ageMax" type="number" class="w-full border rounded-lg p-2" min="18"/>
                </div>
              </div>

              <!-- Uczelnia -->
              <div>
                <label class="block mb-1 text-sm font-medium">Uczelnia</label>
                <input v-model="universityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..." class="w-full border rounded-lg p-2"/>
                <ul v-if="universitySuggestions.length > 0" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
                  <li v-for="u in universitySuggestions" :key="u.university_id" @click="selectUniversity(u)" class="p-2 hover:bg-gray-100 cursor-pointer">
                    {{ u.university_name }}
                  </li>
                </ul>
              </div>

              <!-- Wydział -->
              <div v-if="filters.universityId">
                <label class="block mb-1 text-sm font-medium">Wydział</label>
                <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border rounded-lg p-2">
                  <option value="">Wybierz...</option>
                  <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
                </select>
              </div>

              <!-- Kierunek -->
              <div v-if="filters.facultyId">
                <label class="block mb-1 text-sm font-medium">Kierunek</label>
                <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2">
                  <option value="">Wybierz...</option>
                  <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
                </select>
              </div>

              <!-- Zastosuj -->
              <div class="mt-4">
                <button @click="applyFilters(); showFilters = false;" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full">
                  Zastosuj filtry
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 🔹 Karta swipe -->
      <MatchProfileCard
        v-if="matches.length && currentIndex < matches.length"
        :profile="currentProfile"
        @swipe-left="swipeLeft"
        @swipe-right="swipeRight"
      />
      <p v-else-if="searched" class="text-center mt-6 text-gray-500">Brak dostępnych profili.</p>
    </div>

    <!-- 🔹 ChatBox fullscreen -->
    <ChatBox
      v-if="activeChat"
      :chat="activeChat"
      :userId="profile.user_id"
      @close="closeChat"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";
import MatchProfileCard from "../components/Match/MatchProfileCard.vue";

const profile = reactive({});
const filters = reactive({ gender:'', ageMin:'', ageMax:'', universityId:'', facultyId:'', disciplineId:'' });
const universityQuery = ref('');
const universitySuggestions = ref([]);
const faculties = ref([]);
const disciplines = ref([]);
const matches = ref([]);
const currentIndex = ref(0);
const searched = ref(false);
const showFilters = ref(true);

// 🔹 Chat
const isSidebarOpen = ref(false);
const activeChat = ref(null);

const currentProfile = computed(() => matches.value[currentIndex.value] || {});

// 🔹 Fetch profilu użytkownika
async function fetchUser() {
  const res = await fetch('http://localhost:3000/api/auth/me', { credentials:'include' });
  if (!res.ok) return;
  Object.assign(profile, await res.json());
}
onMounted(fetchUser);

function openChat(chat) { activeChat.value = chat; isSidebarOpen.value = false; }
function closeChat() { activeChat.value = null; }

// 🔹 Swipe
async function swipeLeft(){ await vote(false); nextProfile(); }
async function swipeRight(){ await vote(true); nextProfile(); }
async function vote(like){
  const userToVote = currentProfile.value;
  if(!userToVote) return;
  await fetch('http://localhost:3000/api/matches/vote', {
    method:'POST', credentials:'include',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ userId:userToVote.user_id, like })
  });
}
function nextProfile(){
  if(currentIndex.value < matches.value.length-1) currentIndex.value++;
  else matches.value = [];
}

// 🔹 Filtry i fetchy uczelni/fakultetów/kierunków
async function fetchUniversities() {
  if(universityQuery.value.length < 1){ universitySuggestions.value = []; return; }
  const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`);
  universitySuggestions.value = (await res.json()).slice(0,10);
}

async function selectUniversity(u){
  filters.universityId = u.university_id;
  universityQuery.value = u.university_name;
  universitySuggestions.value = [];
  filters.facultyId = '';
  filters.disciplineId = '';
  faculties.value = [];
  disciplines.value = [];
  await fetchFaculties();
}

async function fetchFaculties() {
  if(!filters.universityId) return;
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`);
  faculties.value = await res.json();
}

async function onFacultyChange() {
  filters.disciplineId = '';
  disciplines.value = [];
  await fetchDisciplines();
}

async function fetchDisciplines() {
  if(!filters.facultyId) return;
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`);
  disciplines.value = await res.json();
}

async function applyFilters(){
  const params = new URLSearchParams();
  for(const k in filters) if(filters[k]) params.append(k,filters[k]);
  const res = await fetch(`http://localhost:3000/api/matches/potential?${params.toString()}`, { credentials:'include' });
  matches.value = await res.json();
  currentIndex.value = 0;
  searched.value = true;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
