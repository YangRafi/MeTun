<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-4 w-full max-w-xs shadow-xl relative">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">Zgłoś profil</h3>

      <select
        v-model="reason"
        class="w-full border border-gray-300 rounded-lg p-2 mb-3 text-gray-800"
      >
        <option disabled value="">Wybierz powód</option>
        <option>Nieodpowiednie treści</option>
        <option>Fałszywy profil</option>
        <option>Spam</option>
        <option>Inne</option>
      </select>

      <textarea
        v-model="message"
        placeholder="Dodatkowy opis (opcjonalnie)"
        class="w-full border border-gray-300 rounded-lg p-2 mb-4 text-gray-800"
        rows="4"
      />

      <div class="flex justify-end gap-3">
        <button
          @click="close"
          class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Anuluj
        </button>
        <button
          @click="submitReport"
          class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Zgłoś
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  reportedUserId: { type: [String, Number], required: true }
})
const emit = defineEmits(['update:modelValue', 'submitted'])

const reason = ref('')
const message = ref('')

function close() {
  emit('update:modelValue', false)
  reason.value = ''
  message.value = ''
}

async function submitReport() {
  if (!reason.value) {
    toast.add({
        severity: 'warn',
        summary: 'Brak powodu',
        detail: 'Wybierz powód zgłoszenia',
        life: 3000
      })
    return
  }

  try {
    const res = await fetch(`http://localhost:3000/api/reports`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportedUserId: props.reportedUserId,
        subject: reason.value,
        message: message.value
      })
    })

    if (!res.ok) throw new Error('Błąd serwera')

    toast.add({
      severity: 'success',
      summary: 'Zgłoszenie wysłane',
      detail: 'Dziękujemy za pomoc',
      life: 3000
    })
    emit('submitted')
    close()
  } catch (err) {
    console.error('Błąd wysyłania zgłoszenia:', err)
    toast.add({
      severity: 'error',
      summary: 'Błąd',
      detail: 'Nie udało się wysłać zgłoszenia',
      life: 3000
    })
  }
}
</script>

<style scoped>
/* small safety: ensure modal content is readable on mobile */
.max-w-md { max-width: 95%; }
</style>
