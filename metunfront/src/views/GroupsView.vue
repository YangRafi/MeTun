<template>
  <div
    class="relative min-h-screen bg-cover bg-center flex flex-col"
    :style="{ backgroundImage: `url(${background})` }"
  >
    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

    <UserHeader :profile="profile" />
    <ChatSidebar
      v-model:isOpen="isSidebarOpen"
      @open-chat="openChat"
      :onlyGroups="true"
    />

    <div
      class="flex-1 flex flex-col justify-center items-center px-6 pt-28 relative z-10"
      v-if="!activeChat"
    >
      <div
        class="w-full max-w-3xl bg-white/85 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-blue-200"
      >
        <div class="flex flex-col items-center mb-6">
          <h1 class="text-3xl font-bold text-blue-800 mb-4 text-center">
            Grupy kierunkowe
          </h1>

          <div class="flex gap-4">
            <button
              @click="showFilters = !showFilters"
              class="text-blue-700 hover:text-blue-900 text-3xl font-bold"
            >
              ⋮
            </button>
            <button
              @click="showCreateModal = true"
              class="bg-green-600 text-white py-2 px-5 rounded-lg hover:bg-green-700 shadow-md"
            >
              Utwórz grupę
            </button>
          </div>
        </div>

        <!-- Lista grup -->
        <div v-if="groups.length" class="grid grid-cols-1 gap-4">
          <div
            v-for="g in groups"
            :key="g.group_id"
            class="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 transition-all"
          >
            <h3 class="text-lg font-semibold text-blue-800">
              {{ g.group_name }}
            </h3>
            <button
              @click="applyToGroup(g)"
              class="mt-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700"
            >
              Dołącz / Aplikuj
            </button>
          </div>
        </div>
        <p v-else-if="searched" class="text-center mt-6 text-gray-500">
          Brak grup dla wybranego kierunku.
        </p>
      </div>
    </div>

    <!-- Modal filtrów -->
    <transition name="fade">
      <div
        v-if="showFilters"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50"
      >
        <div
          class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-3xl shadow-xl relative border border-blue-200"
        >
          <button
            @click="showFilters = false"
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
          <h2 class="text-xl font-semibold mb-4 text-center text-blue-800">
            Filtry grup
          </h2>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block mb-1 text-sm font-medium text-blue-800"
                >Uczelnia</label
              >
              <input
                v-model="universityQuery"
                @input="fetchUniversities"
                type="text"
                placeholder="Wpisz nazwę uczelni..."
                class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"
              />
              <ul
                v-if="universitySuggestions.length > 0"
                class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto"
              >
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
              <label class="block mb-1 text-sm font-medium text-blue-800"
                >Wydział</label
              >
              <select
                v-model="filters.facultyId"
                @change="onFacultyChange"
                class="w-full border rounded-lg p-2"
              >
                <option value="">Wybierz...</option>
                <option
                  v-for="f in faculties"
                  :key="f.faculty_id"
                  :value="f.faculty_id"
                >
                  {{ f.faculty_name }}
                </option>
              </select>
            </div>

            <div v-if="filters.facultyId">
              <label class="block mb-1 text-sm font-medium text-blue-800"
                >Kierunek</label
              >
              <select
                v-model="filters.disciplineId"
                class="w-full border rounded-lg p-2"
              >
                <option value="">Wybierz...</option>
                <option
                  v-for="d in disciplines"
                  :key="d.discipline_id"
                  :value="d.discipline_id"
                >
                  {{ d.name }}
                </option>
              </select>
            </div>

            <div class="mt-4">
              <button
                @click="applyFilters(); showFilters = false;"
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

    <ChatBox
      v-if="activeChat"
      :chat="activeChat"
      :userId="profile.user_id"
      @close="closeChat"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";
import CreateGroupModal from "../components/modal/CreateGroupModal.vue";
import background from "@/assets/background.jpg"; // ✅ import tła

const profile = reactive({});
const filters = reactive({ universityId: "", facultyId: "", disciplineId: "" });
const groups = ref([]);
const searched = ref(false);
const showFilters = ref(false);
const showCreateModal = ref(false);
const isSidebarOpen = ref(false);
const activeChat = ref(null);

function openChat(chat) {
  activeChat.value = chat;
}
function closeChat() {
  activeChat.value = null;
}

// Fetch user info
async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me", {
    credentials: "include",
  });
  if (res.ok) Object.assign(profile, await res.json());
}
onMounted(fetchUser);

// Filtry uczelni, wydziałów i kierunków
const universityQuery = ref("");
const universitySuggestions = ref([]);
const faculties = ref([]);
const disciplines = ref([]);

let fetchTimeout;
async function fetchUniversities() {
  if (universityQuery.value.length < 1) {
    universitySuggestions.value = [];
    return;
  }
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async () => {
    const res = await fetch(
      `http://localhost:3000/api/universities?query=${encodeURIComponent(
        universityQuery.value
      )}`,
      { credentials: "include" }
    );
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
  const res = await fetch(
    `http://localhost:3000/api/faculties?universityId=${filters.universityId}`,
    { credentials: "include" }
  );
  faculties.value = await res.json();
}
async function onFacultyChange() {
  const res = await fetch(
    `http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`,
    { credentials: "include" }
  );
  disciplines.value = await res.json();
}

async function applyFilters() {
  const params = new URLSearchParams();
  if (filters.universityId)
    params.append("university_id", filters.universityId);
  if (filters.facultyId) params.append("faculty_id", filters.facultyId);
  if (filters.disciplineId)
    params.append("discipline_id", filters.disciplineId);

  const res = await fetch(
    `http://localhost:3000/api/groups?${params.toString()}`,
    { credentials: "include" }
  );
  groups.value = await res.json();
  searched.value = true;
}

async function applyToGroup(group) {
  try {
    const res = await fetch(`http://localhost:3000/api/groups/request-join`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.group_id }),
    });
    const data = await res.json();
    if (res.ok) alert("Wysłano prośbę o dołączenie do grupy!");
    else alert(data.message || data.error || "Nie udało się aplikować do grupy.");
  } catch (err) {
    console.error(err);
    alert("Błąd podczas aplikowania do grupy.");
  }
}

// Fetch user disciplines
const userDisciplines = ref([]);
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
