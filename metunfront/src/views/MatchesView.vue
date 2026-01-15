<template>
  <div class="relative min-h-screen overflow-hidden">
    <div
      class="absolute inset-0 bg-cover bg-center z-0"
      :style="{ backgroundImage: `url(${background})` }"
    >
      <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
    </div>

    <div class="relative z-10 text-white flex">
      <div class="flex-1 max-w-3xl mx-auto p-6 relative">
        <UserHeader ref="header" :profile="profile" />
        <ChatSidebar
          v-model:isOpen="isSidebarOpen"
          @open-chat="openChat"
          :onlyPrivate="true"
        />

        <div class="relative">
          <MatchProfileCard
            v-if="matches.length && currentIndex < matches.length"
            :profile="currentProfile"
            @swipe-left="swipeLeft"
            @swipe-right="swipeRight"
            class="rounded-3xl shadow-2xl match-card mt-8"
          />

          <div
            v-else-if="searched && matches.length === 0"
            class="flex justify-center items-center min-h-[45rem]"
          >
            <div class="bg-white/20 backdrop-blur-md px-12 py-10 rounded-3xl shadow-lg text-center">
              <h2 class="text-3xl font-semibold mb-3 text-white">To koniec poszukiwań na dziś 💫</h2>
              <p class="text-white text-lg">Wróć później, by zobaczyć nowe dopasowania!</p>
            </div>
          </div>

          <div
            v-else-if="!searched"
            class="flex justify-center items-center min-h-[45rem]"
          >
            <div class="bg-white/20 backdrop-blur-md px-12 py-10 rounded-3xl shadow-lg text-center animate-fade-in">
              <h2 class="text-4xl font-bold mb-4 text-white">Wybierz filtry 🎯</h2>
              <p class="text-white text-lg max-w-md mx-auto">
                Skorzystaj z panelu po prawej stronie, aby zobaczyć swoje potencjalne dopasowania.
              </p>
            </div>
          </div>
        </div>

        <ChatBox
          v-if="activeChat"
          :chat="activeChat"
          :userId="profile.user_id"
          @close="closeChat"
          class="z-50 bottom-10 right-10 w-[400px]"
        />
      </div>

      <MatchFilter
        :filters="filters"
        :faculties="faculties"
        :disciplines="disciplines"
        @applyFilters="applyFiltersWithAlert"
        @fetchDisciplines="onFacultyChange"
        @selectUniversity="selectUniversity"
      />
    </div>

    <transition name="fade">
      <div
        v-if="showMatch"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col justify-center items-center z-50 p-4"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl text-center max-w-xs w-full p-6 relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-pink-200/20 animate-pulse rounded-3xl -z-10"></div>
          <h2 class="text-3xl font-bold text-pink-500 mb-4 drop-shadow-lg">It's a Match!</h2>
          <Vue3Lottie
            v-if="matchAnimation"
            :animationData="matchAnimation"
            :width="220"
            :height="220"
            :loop="true"
            :autoplay="true"
            class="mx-auto mb-4"
          />
          <img
            v-if="matchProfile.profile_picture"
            :src="matchProfile.profile_picture"
            class="w-28 h-28 rounded-full mx-auto mb-3 border-4 border-pink-400 shadow-lg"
          />
          <p class="font-semibold text-blue-800 text-lg drop-shadow-md">
            {{ matchProfile.name }}
          </p>

          <div class="absolute inset-0 pointer-events-none">
            <div
              v-for="n in 8"
              :key="n"
              class="absolute w-3 h-3 bg-pink-400 rounded-full animate-fall"
              :style="{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${1 + Math.random() * 1.5}s`
              }"
            ></div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="showApplied"
        class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50"
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
import MatchFilter from "../components/Modal/MatchFilterModal.vue";
import socket from "../socket";
import background from "@/assets/background.jpg";
import { Vue3Lottie } from "vue3-lottie";
import handshakeAnimation from "@/assets/animations/handshake.json";

const profile = reactive({});
const filters = reactive({
  gender: "",
  ageMin: "",
  ageMax: "",
  universityId: "",
  facultyId: "",
  disciplineId: "",
});
const faculties = ref([]);
const disciplines = ref([]);
const matches = ref([]);
const currentIndex = ref(0);
const searched = ref(false);
const activeChat = ref(null);
const isSidebarOpen = ref(false);
const showMatch = ref(false);
const matchProfile = ref({});
const matchAnimation = ref(handshakeAnimation);
const showApplied = ref(false);

onMounted(() => {
  fetchUser();
  socket.on("match_created", (data) => console.log("🔔 Nowy match!", data));
  socket.on("match_deleted", (data) => console.log("❌ Match usunięty:", data));
});
onUnmounted(() => {
  socket.off("match_created");
  socket.off("match_deleted");
});

async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" });
  if (res.ok) Object.assign(profile, await res.json());
}

const currentProfile = computed(() => matches.value[currentIndex.value] || {});

function openChat(chat) {
  activeChat.value = chat;
}
function closeChat() {
  activeChat.value = null;
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
  if (!res.ok) return;
  const data = await res.json();
  if (data.matchJustActivated) showItsAMatchAnimation(currentProfile.value);
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
  const res = await fetch(`http://localhost:3000/api/matches/potential?${params.toString()}`, {
    credentials: "include",
  });
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
  const res = await fetch(`http://localhost:3000/api/disciplines/byFaculty/${filters.facultyId}`, {
    credentials: "include",
  });
  disciplines.value = await res.json();
}

async function selectUniversity(u) {
  filters.universityId = u.university_id;
  await fetchFaculties();
}
async function fetchFaculties() {
  if (!filters.universityId) return;
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`, {
    credentials: "include",
  });
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

.animate-fade-in {
  animation: fade-in 0.5s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(80px) rotate(360deg);
    opacity: 0;
  }
}
.animate-fall {
  animation-name: fall;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in;
}
</style>
