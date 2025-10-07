<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <h1 class="text-3xl font-bold mb-6">Uzupełnij swój profil</h1>
    <form @submit.prevent="onSubmit" class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <div class="mb-4">
        <label class="block mb-1 font-medium">Bio</label>
        <textarea v-model="bio" class="w-full border rounded-md p-2"></textarea>
      </div>

      <div class="mb-4">
        <label class="block mb-1 font-medium">Data urodzenia</label>
        <input type="date" v-model="date_of_birth" class="w-full border rounded-md p-2" />
      </div>

      <div class="mb-4">
        <label class="block mb-1 font-medium">Płeć</label>
        <select v-model="gender" class="w-full border rounded-md p-2">
          <option value="male">Mężczyzna</option>
          <option value="female">Kobieta</option>
          <option value="other">Inna</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block mb-1 font-medium">Lokalizacja</label>
        <input type="text" v-model="location" class="w-full border rounded-md p-2" />
      </div>

      <Button type="submit" label="Zapisz profil" class="w-full bg-blue-600 text-white" />
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const bio = ref('')
const date_of_birth = ref('')
const gender = ref('other')
const location = ref('')

const router = useRouter()

const onSubmit = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT', // albo POST jeśli tworzysz nowy
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bio: bio.value, date_of_birth: date_of_birth.value, gender: gender.value, location: location.value })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Błąd')
    alert('Profil zapisany!')
    router.push('/dashboard') // po uzupełnieniu przekierowanie do dashboard
  } catch (err) {
    alert(err.message)
  }
}
</script>
