import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useUniversityStore = defineStore('university', () => {
  const universityQuery = ref('');
  const universitySuggestions = ref([]);
  const faculties = ref([]);
  const disciplines = ref([]);
  const filters = reactive({
    universityId: '',
    facultyId: '',
    disciplineId: ''
  });

  let fetchTimeout;

  async function fetchUniversities() {
    if (universityQuery.value.length < 1) {
      universitySuggestions.value = [];
      return;
    }
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`, { credentials: 'include' });
        if(res.ok) universitySuggestions.value = await res.json();
      } catch (err) {
        console.error(err);
      }
    }, 250);
  }

  async function selectUniversity(u) {
    filters.universityId = u.university_id;
    universityQuery.value = u.university_name;
    universitySuggestions.value = [];
    await fetchFaculties();
  }

  async function fetchFaculties() {
    if (!filters.universityId) {
      faculties.value = [];
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/faculties?universityId=${filters.universityId}`, { credentials: 'include' });
      if(res.ok) faculties.value = await res.json();
    } catch(err) { console.error(err); }
  }

  async function onFacultyChange() {
    filters.disciplineId = '';
    disciplines.value = [];
    if (!filters.facultyId) return;
    try {
      const res = await fetch(`http://localhost:3000/api/disciplines/byFaculty/${filters.facultyId}`, { credentials: 'include' });
      if(res.ok) disciplines.value = await res.json();
    } catch(err) { console.error(err); }
  }

  function clearFilters() {
    filters.universityId = '';
    filters.facultyId = '';
    filters.disciplineId = '';
    universityQuery.value = '';
    universitySuggestions.value = [];
    faculties.value = [];
    disciplines.value = [];
  }

  return {
    universityQuery,
    universitySuggestions,
    faculties,
    disciplines,
    filters,
    fetchUniversities,
    selectUniversity,
    fetchFaculties,
    onFacultyChange,
    clearFilters
  };
});
