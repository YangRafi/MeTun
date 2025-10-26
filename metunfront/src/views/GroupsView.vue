<template>
  <div class="relative min-h-screen bg-blue-50">
    <UserHeader :profile="profile" />
    <ChatSidebar v-model:isOpen="isSidebarOpen" @open-chat="openChat" />

    <div class="max-w-3xl mx-auto p-6 relative" v-if="!activeChat">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-center flex-1 text-blue-800">Grupy kierunkowe</h1>
        <button @click="showFilters = !showFilters" class="text-blue-600 hover:text-blue-800 text-2xl font-bold ml-4">⋮</button>
      </div>

      <!-- Filtry (te same co w MatchView) -->
      <transition name="fade">
        <div v-if="showFilters" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start z-50">
          <div class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-3xl shadow-xl relative border border-blue-200">
            <button @click="showFilters=false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>
            <h2 class="text-xl font-semibold mb-4 text-center text-blue-800">Filtry grup</h2>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-blue-800">Uczelnia</label>
                <input v-model="universityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..." class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"/>
                <ul v-if="universitySuggestions.length>0" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
                  <li v-for="u in universitySuggestions" :key="u.university_id" @click="selectUniversity(u)" class="p-2 hover:bg-blue-50 cursor-pointer">{{u.university_name}}</li>
                </ul>
              </div>
              <div v-if="filters.universityId">
                <label class="block mb-1 text-sm font-medium text-blue-800">Wydział</label>
                <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border rounded-lg p-2">
                  <option value="">Wybierz...</option>
                  <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{f.faculty_name}}</option>
                </select>
              </div>
              <div v-if="filters.facultyId">
                <label class="block mb-1 text-sm font-medium text-blue-800">Kierunek</label>
                <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2">
                  <option value="">Wybierz...</option>
                  <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{d.name}}</option>
                </select>
              </div>
              <div class="mt-4">
                <button @click="applyFilters(); showFilters=false;" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full shadow-md">Pokaż grupy</button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Lista grup -->
      <div v-if="groups.length" class="grid grid-cols-1 gap-4">
        <div v-for="g in groups" :key="g.group_id" @click="openGroupChat(g)" class="p-4 bg-white rounded-2xl shadow hover:shadow-lg cursor-pointer border border-blue-100 transition-all">
          <h3 class="text-lg font-semibold text-blue-800">{{ g.group_name }}</h3>
          <p class="text-sm text-gray-500">Założyciel: {{ g.creator?.name }} {{ g.creator?.surname }}</p>
        </div>
      </div>

      <p v-else-if="searched" class="text-center mt-6 text-gray-500">Brak grup dla wybranego kierunku.</p>
    </div>

    <!-- ChatBox -->
    <ChatBox v-if="activeChat" :chat="activeChat" :userId="profile.user_id" @close="closeChat"/>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";

const profile = reactive({});
const filters = reactive({ universityId: "", facultyId: "", disciplineId: "" });
const groups = ref([]);
const searched = ref(false);
const showFilters = ref(false);

const isSidebarOpen = ref(false);
const activeChat = ref(null);

function openChat(chat){ activeChat.value = chat; }
function closeChat(){ activeChat.value = null; }

async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" });
  if (res.ok) Object.assign(profile, await res.json());
}
onMounted(fetchUser);

// Uczelnie, wydziały, kierunki (tak samo jak w MatchView)
const universityQuery = ref("");
const universitySuggestions = ref([]);
const faculties = ref([]);
const disciplines = ref([]);

let fetchTimeout;
async function fetchUniversities() {
  if(universityQuery.value.length<1){ universitySuggestions.value=[]; return; }
  clearTimeout(fetchTimeout);
  fetchTimeout=setTimeout(async()=>{
    const res=await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`,{credentials:"include"});
    universitySuggestions.value=await res.json();
  },250);
}
async function selectUniversity(u){ filters.universityId=u.university_id; universityQuery.value=u.university_name; universitySuggestions.value=[]; await fetchFaculties(); }
async function fetchFaculties(){ if(!filters.universityId) return; const res=await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`,{credentials:"include"}); faculties.value=await res.json(); }
async function onFacultyChange(){ const res=await fetch(`http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`,{credentials:"include"}); disciplines.value=await res.json(); }

async function applyFilters(){
  if(!filters.disciplineId) return;
  const res = await fetch(`http://localhost:3000/api/groups?disciplineId=${filters.disciplineId}`, { credentials:"include" });
  groups.value = await res.json();
  searched.value = true;
}

function openGroupChat(group){
  activeChat.value = { id: group.group_id, name: group.group_name, type: "group" };
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
