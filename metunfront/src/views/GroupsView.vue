<template>
  <div class="p-8">
    <UserHeader :profile="profile" />
    <h1 class="text-3xl font-bold mb-6">Grupy</h1>
    <!-- Tu później lista grup i czaty grupowe -->
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserHeader from '../components/Layout/UserHeader.vue'

const router = useRouter()
const profile = reactive({})

const fetchUser = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Nie zalogowany')
    const data = await res.json()
    Object.assign(profile, data)
  } catch {
    router.push('/')
  }
}

onMounted(fetchUser)
</script>
