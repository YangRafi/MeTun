<template>
  <div
    class="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl mx-auto border border-blue-200 mt-8"
  >
    <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center">
      ✏️ Edycja profilu
    </h2>

    <form @submit.prevent="saveProfile" class="grid gap-6">
      <!-- Zdjęcie profilowe -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <img
            v-if="previewImage || profile.profile_picture"
            :src="previewImage || getProfilePictureUrl(profile.profile_picture)"
            alt="Zdjęcie profilowe"
            class="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-blue-200"
          />
          <div
            v-else
            class="w-32 h-32 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 font-semibold shadow-inner"
          >
            Brak zdjęcia
          </div>
        </div>
        <input
          type="file"
          @change="handleFileUpload"
          class="mt-2 text-sm text-gray-700"
        />
      </div>

      <!-- Imię -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Imię</label>
        <input
          v-model="profile.name"
          type="text"
          placeholder="Twoje imię"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        />
      </div>

      <!-- Opis -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Opis</label>
        <textarea
          v-model="profile.bio"
          placeholder="Opisz siebie..."
          rows="3"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition resize-none"
        ></textarea>
      </div>

      <!-- Lokalizacja -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Lokalizacja</label>
        <input
          v-model="profile.location"
          type="text"
          placeholder="Twoje miasto"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        />
      </div>

      <!-- Data urodzenia -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Data urodzenia</label>
        <input
          v-model="profile.date_of_birth"
          type="date"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        />
      </div>

      <!-- Płeć -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Płeć</label>
        <select
          v-model="profile.gender"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        >
          <option value="">Wybierz...</option>
          <option value="male">Mężczyzna</option>
          <option value="female">Kobieta</option>
          <option value="other">Inna</option>
        </select>
      </div>

      <!-- Przycisk -->
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition-transform hover:scale-[1.02]"
      >
        💾 Zapisz zmiany
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/userstore";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const userStore = useUserStore();
const { profile, fetchUserAndProfile } = userStore;

const file = ref(null);
const previewImage = ref("");
const MIN_AGE = 16; // minimalny wiek

onMounted(async () => {
  await fetchUserAndProfile();
});

function handleFileUpload(event) {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    previewImage.value = URL.createObjectURL(selectedFile);
  }
}

function getProfilePictureUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `http://localhost:3000/${path}`;
}

// 🔹 Walidacja daty urodzenia
function validateDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return true;
  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (dob > today) {
    toast.error("❌ Data urodzenia nie może być z przyszłości.", { autoClose: 3000 });
    return false;
  }

  const age =
    today.getFullYear() -
    dob.getFullYear() -
    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

  if (age < MIN_AGE) {
    toast.error(`❌ Musisz mieć co najmniej ${MIN_AGE} lat.`, { autoClose: 3000 });
    return false;
  }

  return true;
}

async function saveProfile() {
  try {
    if (!validateDateOfBirth(profile.date_of_birth)) return;

    const formData = new FormData();
    formData.append("name", profile.name);
    formData.append("bio", profile.bio || "");
    formData.append("location", profile.location || "");
    formData.append("date_of_birth", profile.date_of_birth || "");
    formData.append("gender", profile.gender || "");
    if (file.value) formData.append("profile_picture", file.value);

    const method = profile.profile_id ? "PUT" : "POST";
    const url = profile.profile_id
      ? `http://localhost:3000/api/profiles/${profile.profile_id}`
      : `http://localhost:3000/api/profiles`;

    const res = await fetch(url, {
      method,
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Błąd podczas zapisu profilu");
    }

    const updated = await res.json();
    Object.assign(profile, updated);

    file.value = null;
    previewImage.value = "";

    toast.success("✅ Profil zapisany pomyślnie!", { autoClose: 2500 });
  } catch (err) {
    console.error("❌ Błąd podczas zapisu profilu:", err);
    toast.error(err.message || "❌ Nie udało się zapisać profilu.", { autoClose: 3000 });
  }
}
</script>
