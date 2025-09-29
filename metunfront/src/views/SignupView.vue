<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="card w-full max-w-md p-6 shadow-lg rounded-lg bg-white">
      <h2 class="text-2xl font-bold mb-6 text-center">Rejestracja</h2>

      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label class="block mb-1">Imię</label>
          <InputText v-model="form.firstName" class="w-full" />
          <span class="text-red-600 text-sm">{{ errors.firstName }}</span>
        </div>

        <div class="mb-4">
          <label class="block mb-1">Nazwisko</label>
          <InputText v-model="form.lastName" class="w-full" />
          <span class="text-red-600 text-sm">{{ errors.lastName }}</span>
        </div>

        <div class="mb-4">
          <label class="block mb-1">Email</label>
          <InputText v-model="form.email" class="w-full" />
          <span class="text-red-600 text-sm">{{ errors.email }}</span>
        </div>

        <div class="mb-4">
          <label class="block mb-1">Hasło</label>
          <Password v-model="form.password" :feedback="false" toggleMask class="w-full" />
          <span class="text-red-600 text-sm">{{ errors.password }}</span>
        </div>

        <div class="mb-4">
          <label class="block mb-1">Powtórz hasło</label>
          <Password v-model="form.confirmPassword" :feedback="false" toggleMask class="w-full" />
          <span class="text-red-600 text-sm">{{ errors.confirmPassword }}</span>
        </div>

        <Button type="submit" label="Zarejestruj się" class="w-full mt-4" />
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
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({})

const schema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Hasła muszą być takie same'
})

const onSubmit = async () => {
  const result = schema.safeParse(form)
  if (!result.success) {
    Object.keys(errors).forEach(key => errors[key] = '')
    result.error.errors.forEach(err => {
      errors[err.path[0]] = err.message
    })
    return
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.firstName,
        surname: form.lastName,
        email: form.email,
        password: form.password
      }),
      credentials: 'include'
    })

    if (!res.ok) throw new Error('Błąd rejestracji')
    alert('Rejestracja zakończona sukcesem! Możesz się zalogować.')
    router.push('/login')
  } catch (err) {
    console.error(err)
    alert(err.message)
  }
}
</script>
