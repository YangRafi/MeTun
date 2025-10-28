<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200">
    <form @submit.prevent="saveProfile" class="grid gap-6">
      <!-- Imię -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Imię</label>
        <input
          v-model="profile.firstName"
          type="text"
          placeholder="Twoje imię"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        />
      </div>

      <!-- Nazwisko -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Nazwisko</label>
        <input
          v-model="profile.lastName"
          type="text"
          placeholder="Twoje nazwisko"
          class="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        />
      </div>

      <!-- Avatar -->
      <div class="flex flex-col">
        <label class="text-blue-800 font-semibold mb-2">Zdjęcie profilowe</label>
        <input
          type="file"
          @change="onFileChange"
          class="w-full p-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        />
      </div>

      <!-- Przycisk -->
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold shadow-lg transition"
      >
        Zapisz zmiany
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { defineProps } from "vue";

const props = defineProps({
  profile: Object,
});

const profile = props.profile;
const file = ref(null);

function onFileChange(e) {
  file.value = e.target.files[0];
}

async function saveProfile() {
  const formData = new FormData();
  formData.append("firstName", profile.firstName);
  formData.append("lastName", profile.lastName);
  if (file.value) formData.append("avatar", file.value);

  try {
    const res = await fetch("http://localhost:3000/api/profile", {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
    if (res.ok) alert("Profil zaktualizowany!");
    else alert("Błąd podczas aktualizacji profilu.");
  } catch {
    alert("Nie udało się połączyć z serwerem.");
  }
}
</script>
