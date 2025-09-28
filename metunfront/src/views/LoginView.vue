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
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({})

const schema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków')
})

const onSubmit = () => {
  const result = schema.safeParse(form)
  if (!result.success) {
    errors.email = ''
    errors.password = ''
    result.error.errors.forEach(err => {
      errors[err.path[0]] = err.message
    })
    return
  }

  console.log('✅ Logowanie:', form)
}
</script>
