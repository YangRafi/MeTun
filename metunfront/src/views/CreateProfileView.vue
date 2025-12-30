<template>
  <div
    class="relative min-h-screen bg-cover bg-center"
    :style="{ backgroundImage: `url(${background})` }"
  >
    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

    <!-- Main -->
    <main class="relative z-10 flex flex-col items-center pt-28 px-6 w-full">
      <div class="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-blue-200">
        <h1 class="text-3xl font-bold text-center mb-6 text-blue-800 drop-shadow-lg">
          Uzupełnij swój profil 💫
        </h1>

        <Toast />

        <form @submit.prevent="onSubmit" class="space-y-5">
          <!-- ZDJĘCIE PROFILOWE -->
          <div class="flex flex-col items-center">
            <div class="relative w-32 h-32">
              <img
                v-if="previewImage"
                :src="previewImage"
                alt="Podgląd zdjęcia"
                class="w-32 h-32 rounded-full object-cover shadow-md border border-blue-200"
              />
              <div
                v-else
                class="w-32 h-32 rounded-full flex items-center justify-center bg-blue-50 text-blue-300 text-sm border border-blue-200"
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
            <p class="text-xs text-blue-500 mt-2">Kliknij, aby dodać zdjęcie</p>
          </div>

          <!-- BIO -->
          <div>
            <label class="block text-sm font-medium text-blue-800 mb-1">O Tobie (Bio)</label>
            <textarea
              v-model="bio"
              class="w-full border border-blue-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows="3"
              placeholder="Napisz coś o sobie..."
            ></textarea>
          </div>

          <!-- DATA URODZENIA -->
          <div>
            <label class="block text-sm font-medium text-blue-800 mb-1">Data urodzenia</label>
            <input
              type="date"
              v-model="date_of_birth"
              class="w-full border border-blue-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <!-- PŁEĆ -->
          <div>
            <label class="block text-sm font-medium text-blue-800 mb-1">Płeć</label>
            <select
              v-model="gender"
              class="w-full border border-blue-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option disabled value="">Wybierz płeć</option>
              <option value="male">Mężczyzna</option>
              <option value="female">Kobieta</option>
              <option value="other">Inna</option>
            </select>
          </div>

          <!-- LOKALIZACJA -->
          <div>
            <label class="block text-sm font-medium text-blue-800 mb-1">Lokalizacja</label>
            <input
              type="text"
              v-model="location"
              class="w-full border border-blue-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Miasto / miejscowość"
            />
          </div>

          <!-- PRZYCISK -->
          <Button
            type="submit"
            label="Zapisz profil"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 rounded-2xl hover:opacity-90 transition shadow-lg"
          />
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import background from '@/assets/background.jpg'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'vue-router'

const toast = useToast()
const showToast = (severity, summary, detail) => toast.add({ severity, summary, detail, life: 3500 })

const userStore = useUserStore()
const router = useRouter()
const profile = reactive({})

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
    const resUser = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    const userData = await resUser.json()
    const user_id = userData?.user_id

    if (!user_id) {
      showToast("error", "Błąd", "Nie udało się pobrać danych użytkownika — zaloguj się ponownie.")
      return
    }

    const formData = new FormData()
    formData.append('user_id', user_id)
    formData.append('name', userData.name)
    formData.append('bio', bio.value)
    formData.append('date_of_birth', date_of_birth.value)
    formData.append('gender', gender.value)
    formData.append('location', location.value)
    if (profile_picture.value) formData.append('profile_picture', profile_picture.value)

    const res = await fetch('http://localhost:3000/api/profiles', { method: 'POST', credentials: 'include', body: formData })
    const data = await res.json()
    if (!res.ok) { showToast("error", "Błąd", data.error || "Nie udało się zapisać profilu."); return }

    showToast("success", "Profil utworzony 🎉", "Twój profil został zapisany.")
    await userStore.fetchUserAndProfile()

    await new Promise(resolve => setTimeout(resolve, 200))
    
    router.push('/dashboard')
  } catch (err) {
    showToast("error", "Błąd", err.message || "Wystąpił nieoczekiwany problem.")
  }
}
</script>

<style scoped>
form {
  animation: fadeIn 0.6s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
