<template>
  <div
    class="relative min-h-screen bg-cover bg-center flex flex-col"
    :style="{ backgroundImage: `url(${background})` }"
  >
    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

    <UserHeader :profile="userStore.profile" />
    <ChatSidebar v-model:isOpen="isSidebarOpen" @open-chat="openChat" :onlyGroups="true" />

    <div class="flex-1 flex flex-col px-6 pt-28 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">

        <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-blue-200 flex flex-col h-[70vh]">
          <div class="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl mb-4 shadow-sm z-10">
            <h2 class="text-2xl font-bold text-blue-800">🎓 Grupy kierunkowe</h2>
            <button
              @click="showFilters = !showFilters"
              class="text-blue-700 hover:text-blue-900 text-2xl font-bold transition-transform"
              :class="{ 'rotate-90': showFilters }"
              title="Filtry"
            >
              🔍
            </button>
          </div>

          <transition name="slide-filters">
            <div v-show="showFilters" class="mb-4 space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-inner">

              <input
                v-model="universityQuery"
                @input="fetchUniversities"
                placeholder="Szukaj uczelni..."
                class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <ul v-if="universitySuggestions.length" class="border rounded-lg max-h-40 overflow-y-auto bg-white">
                <li
                  v-for="u in universitySuggestions"
                  :key="u.university_id"
                  @click="selectUniversity(u)"
                  class="p-2 hover:bg-blue-100 cursor-pointer"
                >
                  {{ u.university_name }}
                </li>
              </ul>

              <select v-if="filters.universityId" v-model="filters.facultyId" @change="onFacultyChange"
                      class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
                <option value="">Wybierz wydział</option>
                <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
              </select>

              <select v-if="filters.facultyId" v-model="filters.disciplineId"
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
              <option value="">Wybierz kierunek</option>
              <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
            </select>



              <div class="flex gap-2 mt-2">
                <button @click="applyFilters" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">Szukaj</button>
                <button @click="clearFilters" class="flex-1 bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition-colors">Wyczyść</button>
              </div>
            </div>
          </transition>

          <div v-if="groups.length" class="space-y-3 overflow-y-auto pr-1 flex-1">
            <div
              v-for="g in groups"
              :key="g.group_id"
              class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all hover:scale-[1.02]"
            >
              <h3 class="text-lg font-semibold text-blue-800">{{ g.group_name }}</h3>
              <button @click="applyToGroup(g)" class="mt-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700">
                Dołącz / Aplikuj
              </button>
            </div>
          </div>
          <p v-else-if="searched" class="text-center mt-4 text-gray-500 flex-1 flex items-center justify-center">
            Brak grup dla wybranego kierunku.
          </p>
        </div>

        <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-blue-200 flex flex-col h-[70vh]">
          <div class="sticky top-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl mb-4 shadow-sm z-10">
            <h2 class="text-2xl font-bold text-blue-800 text-center">👥 Moje grupy</h2>
          </div>

          <div v-if="myGroups.length" class="space-y-3 overflow-y-auto pr-1 flex-1">
            <div
              v-for="g in myGroups"
              :key="g.group_id"
              class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all hover:scale-[1.02] relative"
            >
              <h3 class="text-lg font-semibold text-blue-800">{{ g.group_name }}</h3>
              <p class="text-gray-500">Rola: {{ g.role || 'member' }}</p>
              <button v-if="g.role === 'admin'" @click="openInviteModal(g)"
                      class="absolute top-2 right-16 text-green-600 hover:text-green-800" title="Zaproś do grupy">
                ➕
              </button>
              <button v-if="g.role !== 'creator'" @click="confirmLeaveGroup(g)"
                      class="absolute top-2 right-10 text-red-600 hover:text-red-800" title="Opuść grupę">
                🏃
              </button>
              <button @click="confirmDeleteGroup(g)"
                      class="absolute bottom-2 right-2 text-red-700 hover:text-red-900" title="Usuń grupę">
                🗑️
              </button>
              <button @click="openChat(g)" class="mt-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700">
                Chat grupowy
              </button>
            </div>
          </div>
          <p v-else class="text-center mt-4 text-gray-500 flex-1 flex items-center justify-center">
            Nie należysz do żadnej grupy.
          </p>
        </div>

<div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-blue-200 flex flex-col h-[70vh]">
  <div class="sticky top-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl mb-4 shadow-sm z-10">
    <h2 class="text-2xl font-bold text-blue-800 text-center">📩 Prośby / Zaproszenia</h2>
  </div>

  <div v-if="requests.length" class="space-y-3 overflow-y-auto pr-1 flex-1">
    <div
      v-for="r in requests"
      :key="r.request_id"
      class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all hover:scale-[1.02]"
    >
      <p>
        <strong>{{ r.type === 'request' ? 'Prośba o dołączenie' : 'Zaproszenie' }}</strong>
        do grupy: {{ r.group.group_name }}
      </p>

      <p v-if="r.type === 'request'">
        Użytkownik: {{ r.user.name }} {{ r.user.surname }}
      </p>

      <div class="mt-2 flex gap-2">

        <template v-if="r.type === 'invite' && r.user_id === userStore.profile.user_id">
          <button @click="respondRequest(r, 'accept')" class="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700">Akceptuj</button>
          <button @click="respondRequest(r, 'reject')" class="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700">Odrzuć</button>
        </template>

        <template v-else-if="r.type === 'invite' && r.sender_id === userStore.profile.user_id">
          <p class="text-gray-600">Zaproszono: {{ r.user.name }} {{ r.user.surname }}</p>
          <button @click="deleteInvite(r)" class="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700">Usuń zaproszenie</button>
        </template>

        <template v-else-if="r.type === 'request' && r.user_id === userStore.profile.user_id">
          <p class="text-gray-600 text-sm italic">Oczekuje na akceptację administratora.</p>
          <button @click="deleteInvite(r)" class="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700">
            Usuń prośbę
          </button>
        </template>

        <template
  v-else-if="r.type === 'request' &&
             myGroups.some(g => g.group_id === r.group.group_id && (g.role === 'admin' || g.role === 'creator'))"
>
          <button @click="respondRequest(r, 'accept')" class="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700">Akceptuj</button>
          <button @click="respondRequest(r, 'reject')" class="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700">Odrzuć</button>
        </template>

      </div>
    </div>
  </div>

  <p v-else class="text-center mt-4 text-gray-500 flex-1 flex items-center justify-center">
    Brak próśb lub zaproszeń.
  </p>
</div>

      </div>

      <div class="w-full max-w-7xl mx-auto mt-10 bg-blue-50 border border-blue-200 rounded-2xl shadow-lg p-4">
        <button @click="showCreateModal = true"
                class="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded-xl shadow-md hover:bg-blue-700 hover:scale-[1.03] transition-transform">
          ➕ Utwórz nową grupę
        </button>
      </div>
    </div>

    <CreateGroupModal :isOpen="showCreateModal" :disciplines="userDisciplines" @close="showCreateModal = false" @created="onGroupCreated" />
    <ChatBox v-if="activeChat" :chat="activeChat" :userId="userStore.profile.user_id" @close="closeChat" />
    <Toast ref="toastRef" />
    <InviteModal
      :isOpen="showInviteModal"
      :group="inviteGroup"
      :matches="privateChats"
      @close="showInviteModal=false"
      @invited="fetchRequests()"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useUserStore } from "@/store/userStore";

import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";
import CreateGroupModal from "../components/Modal/CreateGroupModal.vue";
import background from "@/assets/background.jpg";

import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const userStore = useUserStore();

import { useConfirm } from 'primevue/useconfirm';
const confirm = useConfirm();

import InviteModal from "../components/Modal/InviteModal.vue";

const showInviteModal = ref(false);
const inviteGroup = ref(null);
const privateChats = ref([]);

async function openInviteModal(group) {
  inviteGroup.value = group;

  try {
    const res = await fetch("http://localhost:3000/api/chats/private", { credentials: "include" });
    if(res.ok) {
      const allMatches = await res.json();

      privateChats.value = allMatches.filter(u => 
        !group.members?.some(m => m.user_id === u.user_id)
      );
    }
  } catch(err) { console.error(err); }

  showInviteModal.value = true;
}

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

async function initialize() {
  await userStore.fetchUserAndProfile();
  await fetchMyGroups();
  await fetchRequests();
  await fetchUserDisciplines();
  await applyFilters();
}
onMounted(initialize);

async function fetchMyGroups() {
  try {
    const res = await fetch("http://localhost:3000/api/groups/mine", { credentials: "include" });
    if (res.ok) myGroups.value = await res.json();
  } catch (err) { console.error(err); }
}

async function fetchRequests() {
  try {
    const resMine = await fetch("http://localhost:3000/api/groupRequests/mine", { credentials: "include" });
    const dataMine = resMine.ok ? await resMine.json() : { requests: [] };

    const resPending = await fetch("http://localhost:3000/api/groupRequests/pending", { credentials: "include" });
    const dataPending = resPending.ok ? await resPending.json() : { requests: [] };

    requests.value = [...dataMine.requests, ...dataPending.requests];
  } catch (err) {
    console.error(err);
  }
}

function confirmLeaveGroup(group) {
  confirm.require({
    message: `Czy na pewno chcesz opuścić grupę "${group.group_name}"?`,
    header: 'Potwierdź opuszczenie',
    icon: 'pi pi-exclamation-triangle text-yellow-500',
    acceptLabel: 'Tak, opuść',
    rejectLabel: 'Anuluj',
    acceptClass: 'bg-red-600 border-none hover:bg-red-700 font-semibold text-white rounded-xl px-4 py-2 transition',
    rejectClass: 'bg-gray-300 border-none hover:bg-gray-400 font-semibold text-gray-800 rounded-xl px-4 py-2 transition',
    accept: () => leaveGroup(group),
    reject: () => {
    }
  });
}


let fetchTimeout;
async function fetchUniversities() {
  if (universityQuery.value.length < 1) return (universitySuggestions.value = []);
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`, { credentials: "include" });
      if (res.ok) universitySuggestions.value = await res.json();
    } catch (err) { console.error(err); }
  }, 250);
}
async function selectUniversity(u) {
  filters.universityId = u.university_id;
  universityQuery.value = u.university_name;
  universitySuggestions.value = [];
  await fetchFaculties();
}
async function fetchFaculties() {
  if (!filters.universityId) return (faculties.value = []);
  try {
    const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`, { credentials: "include" });
    if (res.ok) faculties.value = await res.json();
  } catch (err) { console.error(err); }
}

async function onFacultyChange() {
  filters.disciplineId = "";
  disciplines.value = [];

  if (!filters.facultyId) return;

  try {
    const res = await fetch(`http://localhost:3000/api/disciplines/byFaculty/${filters.facultyId}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      disciplines.value = Array.isArray(data) ? data : [];
    } else {
      disciplines.value = [];
      console.error('Błąd fetch disciplines:', res.statusText);
    }
  } catch (err) {
    disciplines.value = [];
    console.error(err);
  }
}

async function applyFilters(showToast = true) {
  const params = new URLSearchParams();
  if (filters.universityId) params.append("university_id", filters.universityId);
  if (filters.facultyId) params.append("faculty_id", filters.facultyId);
  if (filters.disciplineId) params.append("discipline_id", filters.disciplineId);

  try {
    const url = `http://localhost:3000/api/groups?${params.toString()}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Błąd pobierania grup");
    }
    groups.value = await res.json();
    searched.value = true;
    if(showToast) toast.add({ severity: 'success', summary: 'Filtry', detail: 'Grupy zostały zaktualizowane', life: 3000 });
  } catch (err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się pobrać grup', life: 3000 });
  }
}

function clearFilters() {
  filters.universityId = "";
  filters.facultyId = "";
  filters.disciplineId = "";
  universityQuery.value = "";
  universitySuggestions.value = [];
  faculties.value = [];
  disciplines.value = [];
  applyFilters();
}

async function applyToGroup(group) {
  try {
    const res = await fetch("http://localhost:3000/api/groupRequests/join", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.group_id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.add({ severity: 'success', summary: 'Dołączono', detail: 'Wysłano prośbę o dołączenie', life: 3000 });
      await fetchRequests();
    }
    else toast.add({ severity: 'warn', summary: 'Błąd', detail: data.error || data.message || 'Nie udało się wysłać prośby', life: 3000 });
  } catch (err) { console.error(err); toast.add({ severity: 'error', summary: 'Błąd', detail: 'Błąd podczas wysyłania prośby', life: 3000 }); }
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
      toast.add({ severity: 'success', summary: 'Prośba', detail: `Prośba została ${action === 'accept' ? 'zaakceptowana' : 'odrzucona'}`, life: 3000 });
      await fetchMyGroups();
      await fetchRequests();
    }
  } catch (err) { console.error(err); toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się przetworzyć prośby', life: 3000 }); }
}

function openChat(chat) { activeChat.value = chat; }
function closeChat() { activeChat.value = null; }

async function leaveGroup(group) {
  try {
    const res = await fetch(`http://localhost:3000/api/group-members/${group.group_id}/leave`, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      myGroups.value = myGroups.value.filter(g => g.group_id !== group.group_id);
      toast.add({ severity: 'success', summary: 'Opuszczono grupę', detail: '', life: 3000 });
    } else {
      const errData = await res.json().catch(()=>({}));
      toast.add({ severity: 'error', summary: 'Błąd', detail: errData.error || 'Nie udało się opuścić grupy', life: 3000 });
    }
  } catch (err) { console.error(err); toast.add({ severity: 'error', summary: 'Błąd', detail: 'Błąd podczas opuszczania grupy', life: 3000 }); }
}

async function deleteGroup(group) {
  try {
    const res = await fetch(`http://localhost:3000/api/groups/${group.group_id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      myGroups.value = myGroups.value.filter(g => g.group_id !== group.group_id);
      groups.value = groups.value.filter(g => g.group_id !== group.group_id);
      toast.add({ severity: 'success', summary: 'Usunięto grupę', detail: '', life: 3000 });
    }
  } catch (err) { console.error(err); toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się usunąć grupy', life: 3000 }); }
}
async function deleteInvite(r) {
  try {
    const endpoint =
      r.type === "invite"
        ? `invite/${r.request_id}`
        : `request/${r.request_id}`;

    const res = await fetch(`http://localhost:3000/api/groupRequests/${endpoint}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      requests.value = requests.value.filter(req => req.request_id !== r.request_id);

      toast.add({
        severity: 'success',
        summary: r.type === "invite" ? 'Zaproszenie' : 'Prośba',
        detail: `${r.type === "invite" ? "Zaproszenie" : "Prośba"} zostało usunięte`,
        life: 3000
      });
      await fetchRequests();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.add({
        severity: 'error',
        summary: 'Błąd',
        detail: data.error || 'Nie udało się usunąć',
        life: 3000
      });
    }
  } catch (err) {
    console.error(err);
    toast.add({
      severity: 'error',
      summary: 'Błąd',
      detail: 'Błąd podczas usuwania',
      life: 3000
    });
  }
}

function confirmDeleteGroup(group) {
  confirm.require({
    message: `Czy na pewno chcesz usunąć grupę "${group.group_name}"? Tej operacji nie można cofnąć.`,
    header: 'Potwierdź usunięcie',
    icon: 'pi pi-exclamation-triangle text-yellow-500',
    acceptLabel: 'Tak, usuń',
    rejectLabel: 'Anuluj',
    acceptClass: 'bg-red-600 border-none hover:bg-red-700 font-semibold text-white rounded-xl px-4 py-2 transition',
    rejectClass: 'bg-gray-300 border-none hover:bg-gray-400 font-semibold text-gray-800 rounded-xl px-4 py-2 transition',
    accept: async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/groups/${group.group_id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          myGroups.value = myGroups.value.filter(g => g.group_id !== group.group_id);
          groups.value = groups.value.filter(g => g.group_id !== group.group_id);
          toast.add({ severity: 'success', summary: 'Usunięto grupę', detail: '', life: 3000 });
        }
      } catch (err) {
        console.error(err);
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się usunąć grupy', life: 3000 });
      }
    },
    reject: () => {
    }
  });
}

async function fetchUserDisciplines() {
  try {
    const res = await fetch("http://localhost:3000/api/userUniversity/my?status=approved", { credentials: "include" });
    if (res.ok) userDisciplines.value = await res.json();
  } catch (err) { console.error(err); }
}

function onGroupCreated(newGroup) {
  showCreateModal.value = false;
  myGroups.value.unshift(newGroup);
  applyFilters(false);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
