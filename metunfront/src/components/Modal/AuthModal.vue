<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        @click="close"
      ></div>

      <!-- Modal -->
      <transition name="scale-up">
        <div
          class="relative bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md z-10 text-gray-900"
          @click.stop
        >
          <h2 class="text-3xl font-bold mb-6 text-center text-blue-800 drop-shadow-lg">
            {{ type === 'signup' ? 'Rejestracja' : 'Logowanie' }}
          </h2>

          <form @submit.prevent="onSubmit">
            <!-- Signup -->
            <template v-if="type === 'signup'">
              <div class="mb-4">
                <label class="block mb-1 font-medium text-blue-800">Imię</label>
                <InputText
                  v-model="form.firstName"
                  class="w-full rounded-xl px-3 py-2 border border-blue-300 shadow-inner focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
                <span class="text-red-600 text-sm">{{ errors.firstName }}</span>
              </div>

              <div class="mb-4">
                <label class="block mb-1 font-medium text-blue-800">Nazwisko</label>
                <InputText
                  v-model="form.lastName"
                  class="w-full rounded-xl px-3 py-2 border border-blue-300 shadow-inner focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
                <span class="text-red-600 text-sm">{{ errors.lastName }}</span>
              </div>
            </template>

            <!-- Email -->
            <div class="mb-4">
              <label class="block mb-1 font-medium text-blue-800">Email</label>
              <InputText
                v-model="form.email"
                placeholder="Podaj email"
                class="w-full rounded-xl px-3 py-2 border border-blue-300 shadow-inner focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <span class="text-red-600 text-sm">{{ errors.email }}</span>
            </div>

            <!-- Hasło -->
            <div class="mb-4">
              <label class="block mb-1 font-medium text-blue-800">Hasło</label>
              <Password
                v-model="form.password"
                :feedback="false"
                toggleMask
                placeholder="Podaj hasło"
                class="w-full rounded-xl px-3 py-2 border border-blue-300 shadow-inner focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <span class="text-red-600 text-sm">{{ errors.password }}</span>
            </div>

            <!-- Confirm password (signup only) -->
            <div v-if="type === 'signup'" class="mb-4">
              <label class="block mb-1 font-medium text-blue-800">Powtórz hasło</label>
              <Password
                v-model="form.confirmPassword"
                :feedback="false"
                toggleMask
                class="w-full rounded-xl px-3 py-2 border border-blue-300 shadow-inner focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <span class="text-red-600 text-sm">{{ errors.confirmPassword }}</span>
            </div>

            <Button
              type="submit"
              :label="type === 'signup' ? 'Zarejestruj się' : 'Zaloguj się'"
              class="w-full mt-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white py-3 rounded-2xl hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 shadow-lg font-semibold transition"
            />
          </form>

          <!-- Zamknij -->
          <button
            class="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-xl font-bold"
            @click="close"
          >✕</button>
        </div>
      </transition>

      <!-- Toast -->
      <Toast position="top-right" />
    </div>
  </transition>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { z } from 'zod'

const userStore = useUserStore()
const toast = useToast()

const props = defineProps({
  type: { type: String, default: 'signup' },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'open-login'])
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
      ? { name: form.firstName, surname: form.lastName, email: form.email, password: form.password }
      : { email: form.email, password: form.password }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Błąd')

    if (props.type === 'signup') {
      toast.add({ severity: 'success', summary: 'Sukces', detail: 'Rejestracja zakończona pomyślnie!', life: 5000 })
      close()
      emit('open-login')
    } else {
      const checkProfileRes = await fetch('http://localhost:3000/api/profiles/check', { credentials: 'include' })
      const checkData = await checkProfileRes.json()
      
      if (checkProfileRes.ok) {
        if (checkData.hasProfile) {
          await userStore.fetchUserAndProfile()
          router.push('/dashboard')
        } else {
          router.push('/create-profile')
        }
      } else throw new Error(checkData.error || 'Nie udało się sprawdzić profilu użytkownika')

      close()
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Błąd', detail: err.message, life: 5000 })
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
