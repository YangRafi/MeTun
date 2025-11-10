<template>
  <div
    class="relative min-h-screen bg-cover bg-center flex flex-col"
    :style="{ backgroundImage: `url(${background})` }"
  >
    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

    <UserHeader :profile="userStore.profile" />

    <ChatSidebar
      v-model:isOpen="isSidebarOpen"
      @open-chat="openChat"
      :onlyGroups="true"
    />

    <div class="flex-1 flex flex-col px-6 pt-28 relative z-10" v-if="!activeChat">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
        <!-- Grupy kierunkowe -->
        <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-blue-200 flex flex-col">
          <div class="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl mb-4 shadow-sm">
            <h2 class="text-2xl font-bold text-blue-800">🎓 Grupy kierunkowe</h2>
            <div class="flex gap-2">
              <button @click="showFilters = !showFilters" class="text-blue-700 hover:text-blue-900 text-2xl font-bold">
                🔍
              </button>
              <button @click="showCreateModal = true" class="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700 shadow-md">+ Grupa</button>
            </div>
          </div>

          <div v-if="groups.length" class="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            <div
              v-for="g in groups"
              :key="g.group_id"
              class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all hover:scale-[1.02]"
            >
              <h3 class="text-lg font-semibold text-blue-800">{{ g.group_name }}</h3>
              <button
                @click="applyToGroup(g)"
                class="mt-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700"
              >
                Dołącz / Aplikuj
              </button>
            </div>
          </div>
          <p v-else-if="searched" class="text-center mt-4 text-gray-500">Brak grup dla wybranego kierunku.</p>
        </div>

        <!-- Moje grupy -->
        <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-blue-200 flex flex-col">
          <div class="sticky top-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl mb-4 shadow-sm">
            <h2 class="text-2xl font-bold text-blue-800 text-center">👥 Moje grupy</h2>
          </div>
          <div v-if="myGroups.length" class="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            <div
              v-for="g in myGroups"
              :key="g.group_id"
              class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all hover:scale-[1.02] relative"
            >
              <h3 class="text-lg font-semibold text-blue-800">{{ g.group_name }}</h3>
              <p class="text-gray-500">Rola: {{ g.role || 'member' }}</p>

              <button
                v-if="g.role === 'admin'"
                @click="openInviteModal(g)"
                class="absolute top-2 right-16 text-green-600 hover:text-green-800"
                title="Zaproś do grupy"
              >
                ➕
              </button>

              <button
                v-if="g.role !== 'creator'"
                @click="leaveGroup(g)"
                class="absolute top-2 right-10 text-red-600 hover:text-red-800" 
                title="Opuść grupę"
              >
                🚪
              </button>

              <button
                v-if="g.creator.user_id === userStore.profile.user_id"
                @click="deleteGroup(g)"
                class="absolute bottom-2 right-2 text-red-700 hover:text-red-900"
                title="Usuń grupę"
              >
                🗑️
              </button>

              <button
                @click="openChat(g)"
                class="mt-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700"
              >
                Chat grupowy
              </button>
            </div>
          </div>
          <p v-else class="text-center mt-4 text-gray-500">Nie należysz do żadnej grupy.</p>
        </div>

        <!-- Prośby / Zaproszenia -->
        <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-blue-200 flex flex-col">
          <div class="sticky top-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl mb-4 shadow-sm">
            <h2 class="text-2xl font-bold text-blue-800 text-center">📩 Prośby / Zaproszenia</h2>
          </div>
          <div v-if="requests.length" class="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            <div
              v-for="r in requests"
              :key="r.request_id"
              class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all hover:scale-[1.02]"
            >
              <p>
                <strong>{{ r.type === 'request' ? 'Prośba o dołączenie' : 'Zaproszenie' }}</strong>
                do grupy: {{ r.group.group_name }}
              </p>
              <p v-if="r.type === 'request'">Użytkownik: {{ r.user.name }} {{ r.user.surname }}</p>
              <div class="mt-2 flex gap-2">
                <button
                  @click="respondRequest(r, 'accept')"
                  class="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700"
                >
                  Akceptuj
                </button>
                <button
                  @click="respondRequest(r, 'reject')"
                  class="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700"
                >
                  Odrzuć
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-center mt-4 text-gray-500">Brak próśb lub zaproszeń.</p>
        </div>
      </div>
    </div>

    <!-- Modale i create -->
    <transition name="fade">
      <div v-if="showFilters" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50">
        <div class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-3xl shadow-xl relative border border-blue-200">
          <button
            @click="showFilters = false"
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          >✕</button>
          <h2 class="text-xl font-semibold mb-4 text-center text-blue-800">Filtry grup</h2>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block mb-1 text-sm font-medium text-blue-800">Uczelnia</label>
              <input
                v-model="universityQuery"
                @input="fetchUniversities"
                type="text"
                placeholder="Wpisz nazwę uczelni..."
                class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"
              />
              <ul v-if="universitySuggestions.length > 0" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
                <li
                  v-for="u in universitySuggestions"
                  :key="u.university_id"
                  @click="selectUniversity(u)"
                  class="p-2 hover:bg-blue-50 cursor-pointer"
                >
                  {{ u.university_name }}
                </li>
              </ul>
            </div>

            <div v-if="filters.universityId">
              <label class="block mb-1 text-sm font-medium text-blue-800">Wydział</label>
              <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border rounded-lg p-2">
                <option value="">Wybierz...</option>
                <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
              </select>
            </div>

            <div v-if="filters.facultyId">
              <label class="block mb-1 text-sm font-medium text-blue-800">Kierunek</label>
              <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2">
                <option value="">Wybierz...</option>
                <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
              </select>
            </div>

            <div class="mt-4">
              <button
                @click="applyFilters(); showFilters = false"
                class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full shadow-md"
              >
                Pokaż grupy
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <CreateGroupModal
      :isOpen="showCreateModal"
      :disciplines="userDisciplines"
      @close="showCreateModal = false"
      @created="groups.push($event)"
    />

    <ChatBox v-if="activeChat" :chat="activeChat" :userId="userStore.profile.user_id" @close="closeChat" />

    <!-- PrimeVue Toast -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useUserStore } from "@/store/userStore";

import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";
import CreateGroupModal from "../components/modal/CreateGroupModal.vue";
import background from "@/assets/background.jpg";

import Toast from "primevue/toast"; // komponent
import { useToast } from "primevue/usetoast"; // composable

const toast = useToast();
const userStore = useUserStore();
const groups = ref([]);
const myGroups = ref([]);
const requests = ref([]);
const activeChat = ref(null);
const isSidebarOpen = ref(false);
const showFilters = ref(false);
const showCreateModal = ref(false);
const searched = ref(false);

const filters = reactive({ universityId: "", facultyId: "", disciplineId: "" });
const universityQuery = ref("");
const universitySuggestions = ref([]);
const faculties = ref([]);
const disciplines = ref([]);
const userDisciplines = ref([]);

// 🔹 Initialize
async function initialize() {
  await userStore.fetchUserAndProfile();
  await fetchMyGroups();
  await fetchRequests();
}
onMounted(initialize);

// 🔹 Fetch moje grupy
async function fetchMyGroups() {
  try {
    const res = await fetch("http://localhost:3000/api/groups/mine", { credentials: "include" });
    if (res.ok) myGroups.value = await res.json();
  } catch (err) { console.error(err); }
}

// 🔹 Fetch requests
async function fetchRequests() {
  try {
    const res = await fetch("http://localhost:3000/api/groupRequests/pending", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      requests.value = data.requests || [];
    }
  } catch (err) { console.error(err); }
}

// 🔹 Grupy kierunkowe
let fetchTimeout;
async function fetchUniversities() {
  if (universityQuery.value.length < 1) return (universitySuggestions.value = []);
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async () => {
    const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`, { credentials: "include" });
    universitySuggestions.value = await res.json();
  }, 250);
}
async function selectUniversity(u) {
  filters.universityId = u.university_id;
  universityQuery.value = u.university_name;
  universitySuggestions.value = [];
  await fetchFaculties();
}
async function fetchFaculties() {
  if (!filters.universityId) return;
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`, { credentials: "include" });
  faculties.value = await res.json();
}
async function onFacultyChange() {
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`, { credentials: "include" });
  disciplines.value = await res.json();
}
async function applyFilters() {
  const params = new URLSearchParams();
  if (filters.universityId) params.append("university_id", filters.universityId);
  if (filters.facultyId) params.append("faculty_id", filters.facultyId);
  if (filters.disciplineId) params.append("discipline_id", filters.disciplineId);

  try {
    const res = await fetch(`http://localhost:3000/api/groups?${params.toString()}`, { credentials: "include" });
    if (res.ok) {
      groups.value = await res.json();
      searched.value = true;
      toast.add({ severity: 'success', summary: 'Filtry', detail: 'Grupy zostały zaktualizowane', life: 3000 });
    }
  } catch (err) { console.error(err); }
}

// 🔹 Join / respond
async function applyToGroup(group) {
  try {
    const res = await fetch("http://localhost:3000/api/groupRequests/join", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.group_id }),
    });
    if (res.ok) toast.add({ severity: 'success', summary: 'Dołączono', detail: 'Wysłano prośbę o dołączenie', life: 3000 });
  } catch (err) { console.error(err); }
}

async function respondRequest(r, action) {
  try {
    const res = await fetch("http://localhost:3000/api/groupRequests/respond", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: r.request_id, action }),
    });
    if (res.ok) {
      requests.value = requests.value.filter(req => req.request_id !== r.request_id);
      fetchMyGroups();
      toast.add({ severity: 'success', summary: 'Prośba', detail: `Prośba została ${action === 'accept' ? 'zaakceptowana' : 'odrzucona'}`, life: 3000 });
    }
  } catch (err) { console.error(err); }
}

// 🔹 Chat
function openChat(chat) { activeChat.value = chat; }
function closeChat() { activeChat.value = null; }

// 🔹 Moje grupy: akcje admin/creator/member
function openInviteModal(group) {
  toast.add({ severity: 'info', summary: 'Zaproszenia', detail: `Otwieramy modal zaproszeń dla grupy: ${group.group_name}`, life: 3000 });
}
async function leaveGroup(group) {
  try {
    const res = await fetch(`http://localhost:3000/api/group-members/${group.group_id}/leave`, {
      method: 'POST',
      credentials: 'include'
    });
    if (res.ok) {
      myGroups.value = myGroups.value.filter(g => g.group_id !== group.group_id);
      toast.add({ severity: 'success', summary: 'Opuszczono grupę', detail: '', life: 3000 });
    } else {
      const errData = await res.json();
      toast.add({ severity: 'error', summary: 'Błąd', detail: errData.error, life: 3000 });
    }
  } catch (err) { console.error(err); }
}

async function deleteGroup(group) {
  if (!confirm(`Na pewno chcesz usunąć grupę "${group.group_name}"?`)) return;
  try {
    const res = await fetch(`http://localhost:3000/api/groups/${group.group_id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      myGroups.value = myGroups.value.filter(g => g.group_id !== group.group_id);
      toast.add({ severity: 'success', summary: 'Usunięto grupę', detail: '', life: 3000 });
    }
  } catch (err) { console.error(err); }
}

async function fetchUserDisciplines() {
  const res = await fetch(
    "http://localhost:3000/api/userUniversity/my?status=approved",
    { credentials: "include" }
  );
  userDisciplines.value = await res.json();
}
onMounted(fetchUserDisciplines);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
