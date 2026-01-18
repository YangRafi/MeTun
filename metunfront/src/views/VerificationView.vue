<template>
  <div
    class="relative min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center"
    :style="{ backgroundImage: `url(${background})` }"
  >
  <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
    <UserHeader :profile="profile" />

    <div class="w-full max-w-3xl mx-auto p-6 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl mt-10 border border-blue-200">
      <h1 class="text-3xl font-bold text-center mb-8 text-blue-800 drop-shadow-lg">
        Weryfikacja studenta
      </h1>

      <div class="bg-white/80 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-md border border-blue-100">
        <h2 class="text-xl font-semibold mb-4 text-blue-800">Złóż wniosek o weryfikację</h2>

        <div class="mb-4 relative">
          <label class="block mb-1 text-sm font-medium text-blue-800">Uczelnia</label>
          <input
            v-model="universityQuery"
            @input="fetchUniversities"
            type="text"
            placeholder="Wpisz nazwę uczelni..."
            class="w-full border rounded-xl p-3 focus:ring-blue-300 focus:border-blue-300"
          />
          <ul
            v-if="universitySuggestions.length > 0"
            class="absolute w-full bg-white border rounded-xl shadow mt-1 max-h-40 overflow-y-auto z-10"
          >
            <li
              v-for="u in universitySuggestions"
              :key="u.university_id"
              @click="selectUniversity(u)"
              class="p-2 hover:bg-blue-50 cursor-pointer rounded-md"
            >
              {{ u.university_name }}
            </li>
          </ul>
        </div>

        <div v-if="faculties.length > 0" class="mb-4">
          <label class="block mb-1 text-sm font-medium text-blue-800">Wydział</label>
          <select
            v-model="selectedFaculty"
            @change="fetchDisciplines"
            class="w-full border rounded-xl p-3 focus:ring-blue-300 focus:border-blue-300"
          >
            <option value="">Wybierz...</option>
            <option v-for="f in faculties" :key="f.faculty_id" :value="f.faculty_id">
              {{ f.faculty_name }}
            </option>
          </select>
        </div>

        <div v-if="disciplines.length > 0" class="mb-4">
          <label class="block mb-1 text-sm font-medium text-blue-800">Kierunek</label>
          <select
            v-model="selectedDiscipline"
            class="w-full border rounded-xl p-3 focus:ring-blue-300 focus:border-blue-300"
          >
            <option value="">Wybierz...</option>
            <option v-for="d in disciplines" :key="d.discipline_id" :value="d.discipline_id">
              {{ d.name }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium text-blue-800">Załącz dokument</label>
          <input
            type="file"
            @change="onFileChange"
            class="w-full border rounded-xl p-2 focus:ring-blue-300 focus:border-blue-300"
          />
          <p v-if="!file" class="text-gray-500 text-sm italic mt-1">
            Nie dołączono pliku. Wniosek może być złożony bez dokumentu.
          </p>
          <p v-else class="text-gray-600 text-sm mt-1">Wybrano plik: {{ file.name }}</p>
        </div>

        <button
          @click="submitVerification"
          class="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-2xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg font-semibold"
        >
          Wyślij wniosek o weryfikację
        </button>
      </div>

      <div class="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-md border border-blue-100">
        <h2 class="text-xl font-semibold mb-4 text-blue-800">Twoje wnioski</h2>

        <div v-if="applications.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="a in applications"
            :key="a.id"
            class="bg-gradient-to-br from-white to-blue-50 p-5 rounded-3xl shadow-lg hover:shadow-2xl transition relative border border-blue-100"
          >
            <h3 class="font-semibold text-blue-800 text-lg">
              {{ a.university_name || 'Trial (bez uczelni)' }}
            </h3>
            <p class="text-gray-600">{{ a.faculty_name }} / {{ a.discipline_name }}</p>
            <span
              :class="statusColor(a.status)"
              class="absolute top-4 right-4 px-3 py-1 rounded-xl text-xs font-semibold"
            >
              {{ a.status }}
            </span>

            <p class="text-gray-400 text-sm mt-3">
              Złożono: {{ a.join_date ? new Date(a.join_date).toLocaleDateString() : '-' }}
            </p>

            <div v-if="a.trial" class="mt-2 text-sm text-green-700">
              Trial: {{ a.trial_start_date ? new Date(a.trial_start_date).toLocaleDateString() : '-' }}
              – {{ a.trial_end_date ? new Date(a.trial_end_date).toLocaleDateString() : '-' }}
              <span v-if="a.trial_end_date">
                (pozostało {{ remainingTrialDays(a.trial_end_date) }} dni)
              </span>
            </div>

            <div class="mt-3">
              <template v-if="a.document_url">
                <a :href="a.document_url" target="_blank" class="text-blue-600 hover:underline text-sm">📄 Zobacz dokument</a>
                <img :src="a.document_url" alt="Dokument" class="w-32 h-auto rounded shadow mt-1" />
                <div v-if="a.status === 'pending'" class="mt-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Zmień dokument</label>
                  <input
                    type="file"
                    @change="e => uploadDocument(a.id, e)"
                    class="w-full max-w-xs border rounded-md px-2 py-1 text-xs focus:ring-blue-300 focus:border-blue-300"
                  />
                </div>
              </template>
              <template v-else>
                <p class="text-gray-500 text-sm italic">
                  Brak dokumentu. Możesz dołączyć plik, aby przyspieszyć weryfikację.
                </p>
                <input
                  type="file"
                  @change="e => uploadDocument(a.id, e)"
                  class="mt-1 border rounded-lg px-2 py-1 text-xs w-full max-w-xs focus:ring-blue-300 focus:border-blue-300"
                />
              </template>
            </div>

            <div v-if="a.status === 'pending' && !a.trial && !profile.hasTrial" class="mt-3">
              <button
                @click="activateTrialForApplication(a.id)"
                class="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
              >
                Aktywuj darmowy trial (14 dni)
              </button>
            </div>

            <button
              @click="deleteApplication(a.id)"
              class="text-red-600 hover:text-red-800 text-sm mt-3"
            >
              🗑 Usuń
            </button>
          </div>
        </div>

        <p v-else class="text-gray-500 text-center mt-6">Nie masz jeszcze żadnych wniosków.</p>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted } from "vue";
import UserHeader from "../components/Layout/UserHeader.vue";
import background from '@/assets/background.jpg'
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

const toast = useToast();
const confirm = useConfirm();

function showToast(severity, summary, detail) {
  toast.add({
    severity,
    summary,
    detail,
    life: 4000,
  });
}

const profile = reactive({});
const universityQuery = ref("");
const universitySuggestions = ref([]);
const selectedUniversity = ref(null);
const faculties = ref([]);
const selectedFaculty = ref("");
const disciplines = ref([]);
const selectedDiscipline = ref("");
const file = ref(null);
const applications = ref([]);

async function fetchUser() {
  const res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" });
  if (res.ok) Object.assign(profile, await res.json());
}
onMounted(fetchUser);

async function fetchUniversities() {
  if (universityQuery.value.length < 1) {
    universitySuggestions.value = [];
    return;
  }
  const res = await fetch(
    `http://localhost:3000/api/universities?query=${encodeURIComponent(universityQuery.value)}`,
    { credentials: "include" }
  );
  universitySuggestions.value = (await res.json()).slice(0, 10);
}

function selectUniversity(u) {
  selectedUniversity.value = u;
  universityQuery.value = u.university_name;
  universitySuggestions.value = [];
  fetchFaculties(u.university_id);
}

async function fetchFaculties(universityId) {
  const res = await fetch(
    `http://localhost:3000/api/faculties?universityId=${universityId}`,
    { credentials: "include" }
  );
  faculties.value = await res.json();
  disciplines.value = [];
  selectedFaculty.value = "";
  selectedDiscipline.value = "";
}

async function fetchDisciplines() {
  if (!selectedFaculty.value) return;
  const res = await fetch(
    `http://localhost:3000/api/disciplines/byFaculty/${selectedFaculty.value}`,
    { credentials: "include" }
  );
  disciplines.value = await res.json();
}

function onFileChange(e) {
  file.value = e.target.files[0];
}

async function submitVerification() {
  if (!selectedUniversity.value || !selectedFaculty.value || !selectedDiscipline.value) {
    showToast("warn", "Brak danych", "Uzupełnij wszystkie pola przed wysłaniem wniosku.");
    return;
  }

  if (applications.value.length >= 2) {
    showToast("error", "Limit", "Nie możesz mieć więcej niż 2 wnioski.");
    return;
  }

  const exists = applications.value.some(
    (a) =>
      a.university_name === selectedUniversity.value.university_name &&
      a.faculty_id === selectedFaculty.value &&
      a.discipline_id === selectedDiscipline.value
  );
  if (exists) {
  showToast(
    "warn",
    "Duplikat wniosku",
    "Masz już złożony wniosek lub jesteś studentem tej uczelni/kierunku."
  );
  return;
}

  const formData = new FormData();
  formData.append("universityId", selectedUniversity.value.university_id);
  formData.append("facultyId", selectedFaculty.value);
  formData.append("disciplineId", selectedDiscipline.value);
  if (file.value) formData.append("document", file.value);

  const res = await fetch("http://localhost:3000/api/userUniversity", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (res.ok) {
    showToast("success", "Sukces", "Wniosek wysłany!");
    fetchApplications();
    file.value = null;
  } else {
    const err = await res.json();
    showToast("error", "Błąd", err.error || res.statusText);
  }
}

async function fetchApplications() {
  const res = await fetch("http://localhost:3000/api/userUniversity/my", {
    credentials: "include",
  });
  if (res.ok) {
    const data = await res.json();
    applications.value = data.map((a) => (a.trial ? { ...a, status: "trial" } : a));
  }
}

function deleteApplication(id) {
  confirm.require({
    message: "Na pewno usunąć wniosek?",
    header: "Potwierdź usunięcie",
    icon: "pi pi-exclamation-triangle text-yellow-500",
    acceptLabel: "Tak, usuń",
    rejectLabel: "Anuluj",
    acceptClass:
      "bg-red-600 border-none hover:bg-red-700 font-semibold text-white rounded-xl px-4 py-2 transition",
    rejectClass:
      "bg-gray-300 border-none hover:bg-gray-400 font-semibold text-gray-800 rounded-xl px-4 py-2 transition",
    accept: async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/userUniversity/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          showToast("success", "Usunięto", "Wniosek został pomyślnie usunięty.");
          fetchApplications();
        } else {
          const err = await res.json();
          showToast("error", "Błąd", err.error || res.statusText);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Błąd", "Wystąpił problem z połączeniem.");
      }
    },
    reject: () => {
      showToast("info", "Anulowano", "Usunięcie wniosku zostało anulowane.");
    },
  });
}

async function uploadDocument(applicationId, event) {
  const fileToUpload = event.target.files[0];
  if (!fileToUpload) return;

  const formData = new FormData();
  formData.append("document", fileToUpload);

  const res = await fetch(`http://localhost:3000/api/userUniversity/${applicationId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  if (res.ok) {
      showToast("success", "Zaktualizowano", "Dokument został pomyślnie zaktualizowany.");
      fetchApplications();
    } else {
      const err = await res.json();
      showToast("error", "Błąd", err.error || res.statusText);
    }
}

const activatingTrial = ref(false);
function activateTrialForApplication(applicationId) {
  if (activatingTrial.value) return; 
  activatingTrial.value = true;
  confirm.require({
    message: "Aktywować darmowy trial (14 dni) dla tego wniosku?",
    header: "Potwierdzenie aktywacji triala",
    icon: "pi pi-exclamation-triangle text-yellow-500",
    acceptLabel: "Tak, aktywuj",
    rejectLabel: "Anuluj",
    acceptClass:
      "bg-green-600 border-none hover:bg-green-700 font-semibold text-white rounded-xl px-4 py-2 transition",
    rejectClass:
      "bg-gray-300 border-none hover:bg-gray-400 font-semibold text-gray-800 rounded-xl px-4 py-2 transition",
    accept: async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/userUniversity/${applicationId}/activateTrial`,
          { method: "POST", credentials: "include" }
        );

        const data = await res.json();

        if (res.ok) {
          showToast(
            "success",
            "Trial aktywowany 🎉",
            "Darmowy okres próbny został uruchomiony."
          );
          fetchApplications();
          fetchUser();
        } else {
          let message = "";
          switch (data.error) {
            case "TRIAL_ALREADY_USED":
              message = "Trial został już wykorzystany.";
              break;
            case "USER_NOT_ELIGIBLE":
              message = "Nie możesz aktywować triala dla tego wniosku.";
              break;
            default:
              message = data.error || "Nie udało się aktywować triala.";
          }

          showToast("error", "Błąd", message);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Błąd", "Wystąpił problem z połączeniem.");
      }
    },
    reject: () => {
      showToast(
        "info",
        "Trial nie został aktywowany",
        "Nie zatwierdzono aktywacji triala."
      );
    },
  });
}


function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "-";
}

function statusColor(status) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "trial":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function remainingTrialDays(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
}

onMounted(fetchApplications);
</script>

<style scoped>
ul li { transition: background-color 0.2s; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
</style>