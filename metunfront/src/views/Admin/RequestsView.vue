<template>
  <section class="animate-fade-in p-15 relative">
    <!-- Nagłówek z ikoną i przyciskiem powrotu -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-2">
        <span class="text-2xl">📝</span>
        <h2 class="text-2xl font-semibold">Wnioski do weryfikacji</h2>
      </div>
      <button
        @click="$emit('back')"
        class="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-3 py-1 rounded relative z-10 transition"
      >
        ⬅ Wróć
      </button>
    </div>

    <!-- Zakładki -->
    <div class="flex gap-4 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="activeTab === tab.key ? 'bg-blue-600' : 'bg-gray-700'"
        class="px-4 py-2 rounded-lg font-semibold transition"
      >
        {{ tab.name }} ({{ requests[tab.key]?.length || 0 }})
      </button>
    </div>

    <!-- Lista wniosków -->
    <div v-if="requests[activeTab]?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="r in requests[activeTab]"
        :key="r.id"
        class="bg-gray-800 text-white p-5 rounded-3xl shadow hover:shadow-xl transition relative border border-gray-700"
      >
        <h3 class="font-semibold text-lg text-blue-400">{{ r.user_name }} ({{ r.user_email }})</h3>
        <p class="text-gray-300">{{ r.university_name }} / {{ r.faculty_name }} / {{ r.discipline_name }}</p>
        <p class="text-gray-400 text-sm mt-2">Złożono: {{ formatDate(r.join_date) }}</p>
        <p class="text-gray-400 text-sm mt-1">Wygasa: {{ r.expiry_date ? formatDate(r.expiry_date) : '-' }}</p>

        <div class="mt-3">
          <template v-if="r.document_url">
            <a :href="r.document_url" target="_blank" class="text-blue-400 hover:underline text-sm">📄 Zobacz dokument</a>
          </template>
          <template v-else>
            <p class="text-gray-500 text-sm italic">Brak dokumentu.</p>
          </template>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            v-if="r.status !== 'approved'"
            @click="updateStatus(r.id, 'approved')"
            class="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition font-semibold"
          >
            ✅ Zaakceptuj
          </button>
          <button
            v-if="r.status !== 'rejected'"
            @click="updateStatus(r.id, 'rejected')"
            class="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition font-semibold"
          >
            ❌ Odrzuć
          </button>
          <button
            v-if="r.status === 'rejected'"
            @click="updateStatus(r.id, 'pending')"
            class="flex-1 bg-yellow-600 text-white py-2 rounded-xl hover:bg-yellow-700 transition font-semibold"
          >
            ⏳ Wznów
          </button>
        </div>

        <span
          :class="r.trial ? 'bg-purple-100 text-purple-700' : statusColor(r.status)"
          class="absolute top-4 right-4 px-3 py-1 rounded-xl text-xs font-semibold"
        >
          {{ r.status || 'pending' }}
          <template v-if="r.trial">
            🌟 Trial
            <span v-if="r.trial_end_date">({{ remainingTrialTime(r.trial_end_date) }})</span>
          </template>
        </span>
      </div>
    </div>

    <p v-else class="text-gray-400 text-center mt-6">Brak wniosków w tej kategorii.</p>

    <!-- 🔔 Toasty -->
    <div class="fixed top-5 right-5 space-y-2 z-50">
      <div
        v-for="(toast, i) in toasts"
        :key="i"
        :class="['px-4 py-2 rounded shadow text-white', toast.type==='success' ? 'bg-green-500' : 'bg-red-500']"
      >
        {{ toast.message }}
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const requests = ref({ pending: [], approved: [], rejected: [], expired: [], trial: [] })
const activeTab = ref('pending')
const tabs = [
  { key: 'pending', name: 'Oczekujące' },
  { key: 'approved', name: 'Zaakceptowane' },
  { key: 'rejected', name: 'Odrzucone' },
  { key: 'expired', name: 'Wygasłe' },
  { key: 'trial', name: 'Aktywny Trial' }
]

// 🌟 Toasty
const toasts = ref([])
const showToast = (message, type='success', duration=3000) => {
  toasts.value.push({ message, type })
  setTimeout(() => {
    toasts.value.shift()
  }, duration)
}

const fetchRequests = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/userUniversity/requests/status', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      requests.value.pending = data.pending || []
      requests.value.approved = data.approved || []
      requests.value.rejected = data.rejected || []
      requests.value.expired = data.expired || []
      requests.value.trial = data.trial || []
    }
  } catch (err) {
    console.error('Błąd pobierania wniosków:', err)
    showToast('Błąd pobierania wniosków', 'error')
  }
}

const updateStatus = async (id, status) => {
  try {
    const res = await fetch(`http://localhost:3000/api/userUniversity/${id}/status`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      fetchRequests()
      showToast(`Status wniosku zaktualizowany na "${status}"`)
    } else {
      showToast('Błąd aktualizacji statusu', 'error')
    }
  } catch (err) {
    console.error('Błąd aktualizacji statusu:', err)
    showToast('Błąd aktualizacji statusu', 'error')
  }
}

const statusColor = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-700'
    case 'rejected': return 'bg-red-100 text-red-700'
    case 'expired': return 'bg-gray-100 text-gray-700'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-'

const remainingTrialTime = (endDate) => {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end - now
  if (diff <= 0) return '0d 0h 0m'
  const days = Math.floor(diff / (1000*60*60*24))
  const hours = Math.floor((diff / (1000*60*60)) % 24)
  const minutes = Math.floor((diff / (1000*60)) % 60)
  return `${days}d ${hours}h ${minutes}m`
}

onMounted(fetchRequests)
</script>
