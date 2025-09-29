<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/60"
        @click="close"
      ></div>

      <!-- Modal -->
      <transition name="scale">
        <div
          class="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10"
          @click.stop
        >
          <h2 class="text-2xl font-bold mb-6 text-center">
            {{ type === 'signup' ? 'Rejestracja' : 'Logowanie' }}
          </h2>

          <form @submit.prevent="onSubmit">
            <!-- Signup -->
            <template v-if="type === 'signup'">
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
            </template>

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

            <!-- Confirm password (signup only) -->
            <div v-if="type === 'signup'" class="mb-4">
              <label class="block mb-1">Powtórz hasło</label>
              <Password v-model="form.confirmPassword" :feedback="false" toggleMask class="w-full" />
              <span class="text-red-600 text-sm">{{ errors.confirmPassword }}</span>
            </div>

            <Button
              type="submit"
              :label="type === 'signup' ? 'Zarejestruj się' : 'Zaloguj się'"
              class="w-full mt-4"
            />
          </form>

          <!-- Zamknij -->
          <button
            class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            @click="close"
          >✕</button>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { reactive, watch, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { z } from 'zod'

const props = defineProps({
  type: { type: String, default: 'signup' }, // 'signup' lub 'login'
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const router = useRouter()
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const errors = reactive({})

// Schemat walidacji
const schema = props.type === 'signup'
  ? z.object({
      firstName: z.string().min(1, 'Imię jest wymagane'),
      lastName: z.string().min(1, 'Nazwisko jest wymagane'),
      email: z.string().email('Nieprawidłowy email'),
      password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Hasła muszą być takie same'
    })
  : z.object({
      email: z.string().email('Nieprawidłowy email'),
      password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków')
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
    const url = props.type === 'signup'
      ? 'http://localhost:3000/api/auth/signup'
      : 'http://localhost:3000/api/auth/login'

    const body = props.type === 'signup'
      ? {
          name: form.firstName,
          surname: form.lastName,
          email: form.email,
          password: form.password
        }
      : {
          email: form.email,
          password: form.password
        }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Błąd')

    if (props.type === 'signup') alert('Rejestracja zakończona sukcesem!')
    router.push(props.type === 'signup' ? '/login' : '/dashboard')
    close()
  } catch (err) {
    alert(err.message)
  }
}

const close = () => emit('update:visible', false)
</script>

<style>
/* Animacje */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active { transition: transform 0.3s ease; }
.scale-enter-from { transform: scale(0.8); }
.scale-leave-active { transition: transform 0.2s ease; }
.scale-leave-to { transform: scale(0.8); }
</style>
