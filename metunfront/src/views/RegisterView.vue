<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="card w-full max-w-md p-6 shadow-lg rounded-lg bg-white">
      <h2 class="text-2xl font-bold mb-6 text-center">Rejestracja</h2>

      <form @submit.prevent="onSubmit">
        <!-- Imię -->
        <div class="mb-4">
          <label class="block mb-1">Imię</label>
          <InputText v-model="form.firstName" class="w-full" placeholder="Podaj imię" />
          <span class="text-red-600 text-sm">{{ errors.firstName }}</span>
        </div>

        <!-- Nazwisko -->
        <div class="mb-4">
          <label class="block mb-1">Nazwisko</label>
          <InputText v-model="form.lastName" class="w-full" placeholder="Podaj nazwisko" />
          <span class="text-red-600 text-sm">{{ errors.lastName }}</span>
        </div>

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

        <!-- Powtórz hasło -->
        <div class="mb-4">
          <label class="block mb-1">Powtórz hasło</label>
          <Password v-model="form.confirmPassword" :feedback="false" toggleMask class="w-full" placeholder="Powtórz hasło" />
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
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

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
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Hasła muszą być takie same'
})

const onSubmit = () => {
  const result = schema.safeParse(form)
  if (!result.success) {
    Object.keys(errors).forEach(key => errors[key] = '')
    result.error.errors.forEach(err => {
      errors[err.path[0]] = err.message
    })
    return
  }

  console.log('✅ Rejestracja:', form)
}
</script>
