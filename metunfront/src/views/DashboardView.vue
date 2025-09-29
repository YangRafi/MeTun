<template>
  <div class="min-h-screen flex flex-col items-center justify-start p-6 bg-gray-50">
    <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
    <p class="mb-4">Witaj, {{ user.email }}!</p>
    <Button label="Wyloguj się" @click="logout" />
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
const user = reactive({ email: '' })

const fetchUser = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Nie zalogowany')
    const data = await res.json()
    Object.assign(user, data)
  } catch {
    router.push('/login')
  }
}

const logout = async () => {
  try {
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (err) {
    console.error(err)
  } finally {
    router.push('/login')
  }
}

onMounted(fetchUser)
</script>
