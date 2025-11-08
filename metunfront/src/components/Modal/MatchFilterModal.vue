<template>
  <div class="fixed right-0 top-40 z-40">

    <!-- 🔹 Panel filtrów -->
    <transition name="slide">
      <div v-if="isOpen" class="fixed right-0 top-40 w-96 bg-white/90 backdrop-blur-md p-6 rounded-l-3xl shadow-2xl border border-blue-200 overflow-y-auto h-[65vh]">
        <h2 class="text-2xl font-semibold mb-6 text-blue-800 text-center">🎯 Filtry dopasowań</h2>

        <!-- Płeć -->
        <div class="mb-4">
          <label class="block mb-2 text-sm font-medium text-blue-700">Płeć</label>
          <div class="flex justify-between items-center bg-blue-50 rounded-full p-2">
            <button
              v-for="(option, i) in genderOptions"
              :key="i"
              @click="filters.gender = option.value"
              :class="[filters.gender === option.value ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-blue-700 hover:bg-blue-100', 'flex-1 text-center rounded-full py-2 transition-all duration-200']"
            >
              <span class="text-lg mr-1">{{ option.icon }}</span> {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Wiek -->
        <div class="mb-4">
          <label class="block mb-2 text-sm font-medium text-blue-700">Wiek</label>
          <div class="flex gap-2">
            <input type="number" v-model.number="filters.ageMin" :min="18" :max="filters.ageMax || 60" placeholder="Min"
              class="w-1/2 border border-blue-200 rounded-lg p-2 text-blue-800 focus:ring-blue-300 focus:border-blue-300" />
            <input type="number" v-model.number="filters.ageMax" :min="filters.ageMin || 18" :max="60" placeholder="Max"
              class="w-1/2 border border-blue-200 rounded-lg p-2 text-blue-800 focus:ring-blue-300 focus:border-blue-300" />
          </div>
        </div>

        <!-- Uczelnia -->
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium text-blue-700">Uczelnia</label>
          <input v-model="localUniversityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..."
            class="w-full border border-blue-200 rounded-lg p-2 text-blue-800 focus:ring-blue-300 focus:border-blue-300"/>
          <ul
            v-if="universitySuggestions.length && localUniversityQuery.length"
            class="border border-blue-200 rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto text-blue-800"
          >
            <li
              v-for="u in universitySuggestions"
              :key="u.university_id"
              @click="selectUniversityLocal(u)"
              class="p-2 hover:bg-blue-50 cursor-pointer"
            >
              {{ u.university_name }}
            </li>
          </ul>
        </div>

        <!-- Wydział -->
        <div v-if="filters.universityId" class="mb-4">
          <label class="block mb-1 text-sm font-medium text-blue-700">Wydział</label>
          <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border border-blue-200 rounded-lg p-2 text-blue-800 focus:ring-blue-300 focus:border-blue-300">
            <option value="">Wybierz...</option>
            <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
          </select>
        </div>

        <!-- Kierunek -->
        <div v-if="filters.facultyId" class="mb-4">
          <label class="block mb-1 text-sm font-medium text-blue-700">Kierunek</label>
          <select v-model="filters.disciplineId" class="w-full border border-blue-200 rounded-lg p-2 text-blue-800 focus:ring-blue-300 focus:border-blue-300">
            <option value="">Wybierz...</option>
            <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
          </select>
        </div>

        <!-- Zastosuj -->
        <div class="mt-6">
          <button @click="applyAndShowToast" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full shadow-md transition">
            ✅ Zastosuj filtry
          </button>
        </div>
      </div>
    </transition>

    <!-- 🔹 Przycisk toggle -->
    <button
      @click="isOpen = !isOpen"
      class="fixed top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-l-3xl shadow-2xl flex items-center justify-center w-14 h-24 p-4 transition-all duration-300 hover:bg-blue-700 hover:scale-105"
      :style="{ right: isOpen ? '24rem' : '0rem' }"
    >
      <svg
        class="w-8 h-8 transition-transform duration-500"
        :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  filters: Object,
  faculties: Array,
  disciplines: Array,
});

const emit = defineEmits(["applyFilters", "fetchDisciplines", "selectUniversity"]);

const isOpen = ref(false);
const localUniversityQuery = ref("");
const universitySuggestions = ref([]);
const showToast = ref(false);

const genderOptions = [
  { value: "", label: "Dowolna", icon: "⚧️" },
  { value: "male", label: "Mężczyzna", icon: "🚹" },
  { value: "female", label: "Kobieta", icon: "🚺" },
];

let fetchTimeout;
function fetchUniversities() {
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async () => {
    if (!localUniversityQuery.value) {
      universitySuggestions.value = [];
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(localUniversityQuery.value)}`, { credentials: "include" });
      const data = await res.json();
      universitySuggestions.value = data.slice(0, 10);
    } catch {
      universitySuggestions.value = [];
    }
  }, 250);
}

function selectUniversityLocal(u) {
  localUniversityQuery.value = u.university_name;
  universitySuggestions.value = [];
  emit("selectUniversity", u);
}

function onFacultyChange() {
  emit("fetchDisciplines");
}

function applyAndShowToast() {
  emit("applyFilters");
  showToast.value = true;
  setTimeout(() => showToast.value = false, 2000);
}

// 🔹 Watcher – gdy zmienia się uczelnia, resetuj wydział i kierunek
watch(
  () => props.filters.universityId,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      props.filters.facultyId = "";
      props.filters.disciplineId = "";
    }
  }
);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from { transform: translateX(100%); }
.slide-enter-to { transform: translateX(0); }
.slide-leave-from { transform: translateX(0); }
.slide-leave-to { transform: translateX(100%); }

.rotate-0 { transform: rotate(0deg); }
.rotate-180 { transform: rotate(180deg); }
</style>
