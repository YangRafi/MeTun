<template>
  <div class="absolute right-0 top-0 h-full w-80 bg-white p-6 rounded-l-3xl shadow-xl overflow-y-auto z-20">
    <h2 class="text-2xl font-semibold mb-6 text-indigo-700 text-center">🎯 Filtry dopasowań</h2>

    <div class="grid grid-cols-1 gap-5">
      <!-- Płeć -->
      <div>
        <label class="block mb-2 text-sm font-medium text-indigo-700">Płeć</label>
        <div class="flex justify-between items-center bg-indigo-50 rounded-full p-2">
          <button
            v-for="(option, i) in genderOptions"
            :key="i"
            @click="filters.gender = option.value"
            :class="[filters.gender === option.value ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-indigo-700 hover:bg-indigo-100', 'flex-1 text-center rounded-full py-2 transition-all duration-200']"
          >
            <span class="text-lg mr-1">{{ option.icon }}</span> {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Wiek -->
      <div>
        <label class="block mb-2 text-sm font-medium text-indigo-700">Wiek</label>
        <div class="flex gap-2">
          <input type="number" v-model.number="filters.ageMin" :min="18" :max="filters.ageMax || 60" placeholder="Min"
            class="w-1/2 border rounded-lg p-2 focus:ring-indigo-300 focus:border-indigo-300" />
          <input type="number" v-model.number="filters.ageMax" :min="filters.ageMin || 18" :max="60" placeholder="Max"
            class="w-1/2 border rounded-lg p-2 focus:ring-indigo-300 focus:border-indigo-300" />
        </div>
      </div>

      <!-- Uczelnia -->
      <div>
        <label class="block mb-1 text-sm font-medium text-indigo-700">Uczelnia</label>
        <input v-model="localUniversityQuery" @input="fetchUniversities" type="text" placeholder="Wpisz nazwę uczelni..."
          class="w-full border rounded-lg p-2 focus:ring-indigo-300 focus:border-indigo-300"/>
        <ul v-if="universitySuggestions.length && localUniversityQuery.length" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
          <li v-for="u in universitySuggestions" :key="u.university_id" @click="selectUniversityLocal(u)"
            class="p-2 hover:bg-indigo-50 cursor-pointer">{{ u.university_name }}</li>
        </ul>
      </div>

      <!-- Wydział -->
      <div v-if="filters.universityId">
        <label class="block mb-1 text-sm font-medium text-indigo-700">Wydział</label>
        <select v-model="filters.facultyId" @change="onFacultyChange" class="w-full border rounded-lg p-2 focus:ring-indigo-300 focus:border-indigo-300">
          <option value="">Wybierz...</option>
          <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">{{ f.faculty_name }}</option>
        </select>
      </div>

      <!-- Kierunek -->
      <div v-if="filters.facultyId">
        <label class="block mb-1 text-sm font-medium text-indigo-700">Kierunek</label>
        <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2 focus:ring-indigo-300 focus:border-indigo-300">
          <option value="">Wybierz...</option>
          <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">{{ d.name }}</option>
        </select>
      </div>

      <!-- Zastosuj -->
      <div class="mt-6">
        <button @click="applyAndShowToast" class="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 w-full shadow-md transition">
          ✅ Zastosuj filtry
        </button>
      </div>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="showToast" class="fixed bottom-8 right-8 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg z-50">
        Filtry zastosowane ✅
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  filters: Object,
  faculties: Array,
  disciplines: Array,
});

const emit = defineEmits(["applyFilters", "fetchDisciplines", "selectUniversity"]);

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
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition: opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
