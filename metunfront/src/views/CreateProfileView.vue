<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-blue-100 to-purple-100">
    <div class="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">
        Uzupełnij swój profil 💫
      </h1>

      <form @submit.prevent="onSubmit" class="space-y-5">
        <!-- ZDJĘCIE PROFILOWE -->
        <div class="flex flex-col items-center">
          <div class="relative w-32 h-32">
            <img
              v-if="previewImage"
              :src="previewImage"
              alt="Podgląd zdjęcia"
              class="w-32 h-32 rounded-full object-cover shadow-md border border-gray-300"
            />
            <div
              v-else
              class="w-32 h-32 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-gray-300"
            >
              Brak zdjęcia
            </div>
            <input
              type="file"
              accept="image/*"
              @change="onFileChange"
              class="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <p class="text-xs text-gray-500 mt-2">Kliknij, aby dodać zdjęcie</p>
        </div>

        <!-- BIO -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">O Tobie (Bio)</label>
          <textarea
            v-model="bio"
            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="3"
            placeholder="Napisz coś o sobie..."
          ></textarea>
        </div>

        <!-- DATA URODZENIA -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data urodzenia</label>
          <input
            type="date"
            v-model="date_of_birth"
            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <!-- PŁEĆ -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Płeć</label>
          <select
            v-model="gender"
            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option disabled value="">Wybierz płeć</option>
            <option value="male">Mężczyzna</option>
            <option value="female">Kobieta</option>
            <option value="other">Inna</option>
          </select>
        </div>

        <!-- LOKALIZACJA -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
          <input
            type="text"
            v-model="location"
            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Miasto / miejscowość"
          />
        </div>

        <!-- PRZYCISK -->
        <Button
          type="submit"
          label="Zapisz profil"
          class="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold py-2 rounded-md hover:opacity-90 transition"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()

// Dane formularza
const bio = ref('')
const date_of_birth = ref('')
const gender = ref('')
const location = ref('')
const profile_picture = ref(null)
const previewImage = ref(null)

// Obsługa wyboru pliku
const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    profile_picture.value = file
    previewImage.value = URL.createObjectURL(file)
  }
}

// Wysyłka formularza
const onSubmit = async () => {
  try {
    // Pobranie aktualnie zalogowanego użytkownika
    const resUser = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include'
    })
    const userData = await resUser.json()
    const user_id = userData?.user_id

    if (!user_id) throw new Error('Nie udało się pobrać danych użytkownika — zaloguj się ponownie.')

    // Tworzymy FormData, by móc wysłać plik
    const formData = new FormData()
    formData.append('user_id', user_id)
    formData.append('name', userData.name || userData.email.split('@')[0])
    formData.append('bio', bio.value)
    formData.append('date_of_birth', date_of_birth.value)
    formData.append('gender', gender.value)
    formData.append('location', location.value)
    if (profile_picture.value) {
      formData.append('profile_picture', profile_picture.value)
    }

    // Wysyłamy dane do backendu
    const res = await fetch('http://localhost:3000/api/profiles', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Nie udało się zapisać profilu.')

    alert('Profil został pomyślnie utworzony! 🎉')
    router.push('/dashboard')
  } catch (err) {
    alert(err.message)
  }
}
</script>

<style scoped>
form {
  animation: fadeIn 0.6s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
