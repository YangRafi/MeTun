<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6 text-center">Znajdź dopasowania</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Płeć -->
      <div>
        <label class="block mb-1 text-sm font-medium">Płeć</label>
        <select v-model="filters.gender" class="w-full border rounded-lg p-2">
          <option value="">Dowolna</option>
          <option value="M">Mężczyzna</option>
          <option value="F">Kobieta</option>
        </select>
      </div>

      <!-- Wiek -->
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block mb-1 text-sm font-medium">Wiek od</label>
          <input v-model.number="filters.ageMin" type="number" class="w-full border rounded-lg p-2" min="18" />
        </div>
        <div class="flex-1">
          <label class="block mb-1 text-sm font-medium">Wiek do</label>
          <input v-model.number="filters.ageMax" type="number" class="w-full border rounded-lg p-2" min="18" />
        </div>
      </div>

      <!-- Uczelnia -->
      <div class="md:col-span-2">
        <label class="block mb-1 text-sm font-medium">Uczelnia</label>
        <input
          v-model="universityQuery"
          @input="fetchUniversities"
          type="text"
          placeholder="Wpisz nazwę uczelni..."
          class="w-full border rounded-lg p-2"
        />
        <ul v-if="universitySuggestions.length > 0" class="border rounded-lg bg-white shadow mt-1 max-h-40 overflow-y-auto">
          <li
            v-for="u in universitySuggestions"
            :key="u.university_id"
            @click="selectUniversity(u)"
            class="p-2 hover:bg-gray-100 cursor-pointer"
          >
            {{ u.university_name }}
          </li>
        </ul>
      </div>

      <!-- Wydział -->
      <div>
        <label class="block mb-1 text-sm font-medium">Wydział</label>
        <select v-model="filters.facultyId" @change="fetchDisciplines" class="w-full border rounded-lg p-2">
          <option value="">Wybierz...</option>
          <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">
            {{ f.faculty_name }}
          </option>
        </select>
      </div>

      <!-- Kierunek -->
      <div>
        <label class="block mb-1 text-sm font-medium">Kierunek</label>
        <select v-model="filters.disciplineId" class="w-full border rounded-lg p-2">
          <option value="">Wybierz...</option>
          <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">
            {{ d.name }}
          </option>
        </select>
      </div>
    </div>

    <button @click="fetchMatches" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full">
      Szukaj dopasowań
    </button>

    <!-- Wyniki -->
    <div v-if="matches.length > 0" class="mt-6">
      <h2 class="text-xl font-semibold mb-4">Znalezione osoby:</h2>
      <ul class="space-y-4">
        <li
          v-for="m in matches"
          :key="m.id"
          class="p-4 border rounded-lg shadow-sm hover:shadow-md transition"
        >
          <p class="font-bold">{{ m.name }} ({{ m.age }} lat)</p>
          <p class="text-sm text-gray-600">
            {{ m.university_name }} — {{ m.faculty_name }} — {{ m.discipline_name }}
          </p>
        </li>
      </ul>
    </div>

    <p v-else-if="searched" class="mt-6 text-gray-600 text-center">Brak wyników dopasowań.</p>
  </div>
</template>

<script setup>
import { ref } from "vue";

const filters = ref({
  gender: "",
  ageMin: "",
  ageMax: "",
  universityId: "",
  facultyId: "",
  disciplineId: "",
});

const universityQuery = ref("");
const universitySuggestions = ref([]);
const faculties = ref([]);
const disciplines = ref([]);
const matches = ref([]);
const searched = ref(false);

// 🔹 Dynamiczne podpowiedzi uczelni
async function fetchUniversities() {
  if (universityQuery.value.length < 1) {
    universitySuggestions.value = [];
    return;
  }

  const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`);
  const data = await res.json();
  universitySuggestions.value = data.slice(0, 10); // maks. 10 wyników
}

// 🔹 Po wybraniu uczelni
async function selectUniversity(u) {
  filters.value.universityId = u.university_id;
  universityQuery.value = u.university_name;
  universitySuggestions.value = [];
  await fetchFaculties();
}

// 🔹 Pobieranie wydziałów danej uczelni
async function fetchFaculties() {
  if (!filters.value.universityId) return;
  const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.value.universityId}`);
  faculties.value = await res.json();
  disciplines.value = []; // reset kierunków
  filters.value.facultyId = "";
  filters.value.disciplineId = "";
}

// 🔹 Pobieranie kierunków danego wydziału
async function fetchDisciplines() {
  if (!filters.value.facultyId) return;
  const res = await fetch(`http://localhost:3000/api/disciplines?facultyId=${filters.value.facultyId}`);
  disciplines.value = await res.json();
}

// 🔹 Pobieranie dopasowań
async function fetchMatches() {
  const params = new URLSearchParams(
    Object.entries(filters.value).filter(([_, v]) => v !== "" && v !== null)
  );

  const res = await fetch(`http://localhost:3000/api/matches?${params.toString()}`);
  matches.value = await res.json();
  searched.value = true;
}
</script>
