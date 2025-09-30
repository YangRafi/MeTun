<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        @click="close"
      ></div>

      <!-- Modal -->
      <transition name="scale-up">
        <div
          class="relative bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700 rounded-2xl shadow-2xl p-8 w-full max-w-md z-10 text-white"
          @click.stop
        >
          <h2 class="text-3xl font-bold mb-6 text-center drop-shadow-lg">
            {{ type === 'signup' ? 'Rejestracja' : 'Logowanie' }}
          </h2>

          <form @submit.prevent="onSubmit">
            <!-- Signup -->
            <template v-if="type === 'signup'">
              <div class="mb-4">
                <label class="block mb-1 font-medium">Imię</label>
                <InputText
                  v-model="form.firstName"
                  class="w-full rounded-md px-3 py-2 text-gray-900 bg-white/90 border border-orange-300 shadow-inner"
                />
                <span class="text-red-200 text-sm">{{ errors.firstName }}</span>
              </div>

              <div class="mb-4">
                <label class="block mb-1 font-medium">Nazwisko</label>
                <InputText
                  v-model="form.lastName"
                  class="w-full rounded-md px-3 py-2 text-gray-900 bg-white/90 border border-orange-300 shadow-inner"
                />
                <span class="text-red-200 text-sm">{{ errors.lastName }}</span>
              </div>
            </template>

            <!-- Email -->
            <div class="mb-4">
              <label class="block mb-1 font-medium">Email</label>
              <InputText
                v-model="form.email"
                class="w-full rounded-md px-3 py-2 text-gray-900 bg-white/90 border border-orange-300 shadow-inner"
                placeholder="Podaj email"
              />
              <span class="text-red-200 text-sm">{{ errors.email }}</span>
            </div>

            <!-- Hasło -->
            <div class="mb-4">
              <label class="block mb-1 font-medium">Hasło</label>
              <Password
                v-model="form.password"
                :feedback="false"
                toggleMask
                class="w-full rounded-md px-3 py-2 text-gray-900 bg-white/90 border border-orange-300 shadow-inner"
                placeholder="Podaj hasło"
              />
              <span class="text-red-200 text-sm">{{ errors.password }}</span>
            </div>

            <!-- Confirm password (signup only) -->
            <div v-if="type === 'signup'" class="mb-4">
              <label class="block mb-1 font-medium">Powtórz hasło</label>
              <Password
                v-model="form.confirmPassword"
                :feedback="false"
                toggleMask
                class="w-full rounded-md px-3 py-2 text-gray-900 bg-white/90 border border-orange-300 shadow-inner"
              />
              <span class="text-red-200 text-sm">{{ errors.confirmPassword }}</span>
            </div>

            <Button
              type="submit"
              :label="type === 'signup' ? 'Zarejestruj się' : 'Zaloguj się'"
              class="w-full mt-4 bg-gradient-to-r from-orange-600 via-red-700 to-yellow-600 hover:from-yellow-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg"
            />
          </form>

          <!-- Zamknij -->
          <button
            class="absolute top-3 right-3 text-white hover:text-gray-200 text-xl font-bold"
            @click="close"
          >✕</button>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { z } from 'zod'

const props = defineProps({
  type: { type: String, default: 'signup' },
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-up-enter-active { transition: all 0.35s cubic-bezier(0.68,-0.55,0.27,1.55); }
.scale-up-enter-from { opacity: 0; transform: scale(0); }
.scale-up-leave-active { transition: all 0.2s ease-in; }
.scale-up-leave-to { opacity: 0; transform: scale(0); }
</style>
