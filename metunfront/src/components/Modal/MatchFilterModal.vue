<template>
  <transition name="fade">
    <div v-if="showFilters" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start z-50">
      <div class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-3xl shadow-2xl border border-blue-200 relative">
        <!-- Zamknij -->
        <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>

        <h2 class="text-2xl font-semibold mb-6 text-center text-blue-800">🎯 Filtry dopasowań</h2>

        <div class="grid grid-cols-1 gap-5">
          <!-- Płeć -->
          <div>
            <label class="block mb-2 text-sm font-medium text-blue-800">Płeć</label>
            <div class="flex justify-between items-center bg-blue-50 rounded-full p-2">
              <button
                v-for="(option, i) in genderOptions"
                :key="i"
                @click="filters.gender = option.value"
                :class="[filters.gender === option.value ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-blue-800 hover:bg-blue-100', 'flex-1 text-center rounded-full py-2 transition-all duration-200']"
              >
                <span class="text-lg mr-1">{{ option.icon }}</span> {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Wiek -->
          <div>
            <label class="block mb-2 text-sm font-medium text-blue-800">Wiek</label>
            <div class="flex gap-2">
              <input type="number" v-model.number="filters.ageMin" :min="18" :max="filters.ageMax || 60" placeholder="Min"
                class="w-1/2 border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300" />
              <input type="number" v-model.number="filters.ageMax" :min="filters.ageMin || 18" :max="60" placeholder="Max"
                class="w-1/2 border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300" />
            </div>
          </div>

          <!-- Uczelnia -->
          <div>
            <label class="block mb-1 text-sm font-medium text-blue-800">Uczelnia</label>
            <input v-model="localUniversityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..."
              class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300"/>
            <ul v-if="universitySuggestions.length > 0 && localUniversityQuery.length > 0" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
              <li v-for="u in universitySuggestions" :key="u.university_id" @click="selectUniversityLocal(u)"
                class="p-2 hover:bg-blue-50 cursor-pointer">{{ u.university_name }}</li>
            </ul>
          </div>

          <!-- Wydział -->
          <div v-if="filters.universityId">
            <label class="block mb-1 text-sm font-medium text-blue-800">Wydział</label>
            <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300">
              <option value="">Wybierz...</option>
              <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
            </select>
          </div>

          <!-- Kierunek -->
          <div v-if="filters.facultyId">
            <label class="block mb-1 text-sm font-medium text-blue-800">Kierunek</label>
            <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2 focus:ring-blue-300 focus:border-blue-300">
              <option value="">Wybierz...</option>
              <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
            </select>
          </div>

          <!-- Zastosuj -->
          <div class="mt-6">
            <button @click="applyAndClose" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full shadow-md">
              ✅ Zastosuj filtry
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  showFilters: Boolean,
  filters: Object,
  faculties: Array,
  disciplines: Array,
});

const emit = defineEmits(["close", "applyFilters", "fetchDisciplines", "selectUniversity"]);

const localUniversityQuery = ref("");
const universitySuggestions = ref([]);

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

function applyAndClose() {
  emit("applyFilters");
  emit("close");
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition: opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
