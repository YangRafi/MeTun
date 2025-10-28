<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 🔹 Tło -->
    <div
      class="absolute inset-0 bg-cover bg-center z-0"
      :style="{ backgroundImage: `url(${background})` }"
    >
      <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

      
    </div>

    <!-- 🔹 Zawartość -->
    <div class="relative z-10 text-white flex">
      <!-- Główna sekcja -->
      <div class="flex-1 max-w-3xl mx-auto p-6 relative">
        <UserHeader ref="header" :profile="profile" />
        <ChatSidebar
          v-model:isOpen="isSidebarOpen"
          @open-chat="openChat"
          :onlyPrivate="true"
        />

        <!-- Widok dopasowań -->
        <div v-if="!activeChat">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold flex-1 text-center text-white">
              Znajdź dopasowania
            </h1>
          </div>

          <MatchProfileCard
            v-if="matches.length && currentIndex < matches.length"
            :profile="currentProfile"
            @swipe-left="swipeLeft"
            @swipe-right="swipeRight"
            class="rounded-3xl shadow-2xl match-card"
          />
          <p
            v-else-if="searched"
            class="text-center mt-6 text-white/80"
          >
            Brak dostępnych profili.
          </p>
        </div>

        <!-- ChatBox -->
        <ChatBox class="z-50"
          v-if="activeChat"
          :chat="activeChat"
          :userId="profile.user_id"
          @close="closeChat"
        />
      </div>

      <!-- 🔹 Panel filtrów -->
      <div
        class="fixed right-6 w-80 bg-white/90 text-black rounded-l-3xl shadow-xl z-40 p-6 backdrop-blur-md"
        :style="{ top: '6rem', bottom: '10rem' }"
      >
        <MatchFilterModal
          :filters="filters"
          :faculties="faculties"
          :disciplines="disciplines"
          @applyFilters="applyFiltersWithAlert"
          @fetchDisciplines="onFacultyChange"
          @selectUniversity="selectUniversity"
          inline
          class="h-full overflow-y-auto"
        />
      </div>
    </div>

    <!-- 🔹 It's a Match -->
    <transition name="fade">
      <div
        v-if="showMatch"
        class="fixed inset-0 bg-black/50 flex flex-col justify-center items-center z-50"
      >
        <div class="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-xs">
          <h2 class="text-2xl font-bold text-pink-500 mb-2">It's a Match!</h2>
          <img
            v-if="matchProfile.profile_picture"
            :src="matchProfile.profile_picture"
            class="w-24 h-24 rounded-full mx-auto mb-2"
          />
          <p class="font-semibold text-indigo-700">{{ matchProfile.name }}</p>
        </div>
      </div>
    </transition>

    <!-- 🔹 Alert – filtry zastosowane -->
    <transition name="fade">
      <div
        v-if="showApplied"
        class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50"
      >
        Filtry zastosowane ✅
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import UserHeader from "../components/Layout/UserHeader.vue";
import ChatSidebar from "../components/Chat/ChatSidebar.vue";
import ChatBox from "../components/Chat/ChatBox.vue";
import MatchProfileCard from "../components/Match/MatchProfileCard.vue";
import MatchFilterModal from "../components/Modal/MatchFilterModal.vue";
import socket from "../socket";
import background from "@/assets/background.jpg";

const profile = reactive({});
const filters = reactive({
  gender: "",
  ageMin: "",
  ageMax: "",
  universityId: "",
  facultyId: "",
  disciplineId: "",
});
const matches = ref([]);
const currentIndex = ref(0);
const searched = ref(false);

const isSidebarOpen = ref(false);
const activeChat = ref(null);

function openChat(chat) {
  activeChat.value = chat;
}
function closeChat() {
  activeChat.value = null;
}

const faculties = ref([]);
const disciplines = ref([]);

const showMatch = ref(false);
const matchProfile = ref({});
const currentProfile = computed(
  () => matches.value[currentIndex.value] || {}
);

const showApplied = ref(false);

const header = ref(null);
const headerHeight = ref(0);

function updateSidebarHeight() {
  if (header.value) {
    headerHeight.value =
      header.value.$el?.offsetHeight || header.value.offsetHeight || 60;
  }
}

onMounted(() => {
  fetchUser();
  nextTick(updateSidebarHeight);
  window.addEventListener("resize", updateSidebarHeight);

  socket.on("match_created", (data) =>
    console.log("🔔 Nowy match!", data)
  );
  socket.on("match_deleted", (data) =>
    console.log("❌ Match usunięty:", data)
  );
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSidebarHeight);
  socket.off("match_created");
  socket.off("match_deleted");
});

async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me", {
    credentials: "include",
  });
  if (!res.ok) return;
  Object.assign(profile, await res.json());
}

async function swipeLeft() {
  await vote(false);
  nextProfile();
}
async function swipeRight() {
  await vote(true);
  nextProfile();
}

async function vote(like) {
  const otherUserId = currentProfile.value.user_id;
  const res = await fetch("http://localhost:3000/api/matches/vote", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: otherUserId, like }),
  });
  if (!res.ok) {
    console.error("❌ Błąd przy głosowaniu");
    return;
  }
  const data = await res.json();
  if (data.matchJustActivated) {
    showItsAMatchAnimation(currentProfile.value);
  }
}

function showItsAMatchAnimation(profile) {
  matchProfile.value = profile;
  showMatch.value = true;
  setTimeout(() => (showMatch.value = false), 3000);
}
function nextProfile() {
  if (currentIndex.value < matches.value.length - 1) currentIndex.value++;
  else matches.value = [];
}

async function applyFilters() {
  const params = new URLSearchParams();
  for (const k in filters) if (filters[k]) params.append(k, filters[k]);
  const res = await fetch(
    `http://localhost:3000/api/matches/potential?${params.toString()}`,
    { credentials: "include" }
  );
  matches.value = await res.json();
  currentIndex.value = 0;
  searched.value = true;
}

function applyFiltersWithAlert() {
  applyFilters();
  showApplied.value = true;
  setTimeout(() => (showApplied.value = false), 2000);
}

async function onFacultyChange() {
  if (!filters.facultyId) return;
  const res = await fetch(
    `http://localhost:3000/api/disciplines?facultyId=${filters.facultyId}`,
    { credentials: "include" }
  );
  disciplines.value = await res.json();
}

async function selectUniversity(u) {
  filters.universityId = u.university_id;
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

.match-card {
  background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
  color: white;
  border-radius: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
</style>
