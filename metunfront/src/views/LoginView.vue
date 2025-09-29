<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="card w-full max-w-md p-6 shadow-lg rounded-lg bg-white">
      <h2 class="text-2xl font-bold mb-6 text-center">Logowanie</h2>

      <form @submit.prevent="onSubmit">
        <!-- Email -->
        <div class="mb-4">
          <label class="block mb-1">Email</label>
          <InputText v-model="form.email" class="w-full" placeholder="Podaj email" />
          <span class="text-red-600 text-sm">{{ errors.email }}</span>
        </div>

        <!-- Hasło -->
        <div class="mb-4">
          <label class="block mb-1">Hasło</label>
          <Password v-model="form.password" :feedback="false" toggleMask class="w-full" placeholder="Podaj hasło" />
          <span class="text-red-600 text-sm">{{ errors.password }}</span>
        </div>

        <Button type="submit" label="Zaloguj się" class="w-full mt-4" />
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { z } from 'zod'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({})

const schema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków')
})

const onSubmit = async () => {
  const result = schema.safeParse(form)
  if (!result.success) {
    errors.email = ''
    errors.password = ''
    result.error.errors.forEach(err => {
      errors[err.path[0]] = err.message
    })
    return
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include'
    })

    const data = await res.json()
    console.log('Login response:', data) // 🔹 tu zobaczysz backend message

    if (!res.ok) {
      alert(data.error || 'Nieprawidłowy login')
      return
    }

    // ✅ jeśli login OK, przekieruj na dashboard
    router.push('/dashboard')

  } catch (err) {
    console.error(err)
    alert(err.message)
  }
}
</script>
