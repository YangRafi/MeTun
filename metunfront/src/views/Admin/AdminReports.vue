<template>
  <section class="animate-fade-in p-15 relative">
    <!-- Nagłówek z ikoną i przyciskiem powrotu -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🛠️</span>
        <h2 class="text-2xl font-semibold">Zgłoszenia użytkowników</h2>
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
        {{ tab.name }} ({{ reports[tab.key]?.length || 0 }})
      </button>
    </div>

    <!-- Lista zgłoszeń -->
    <div v-if="reports[activeTab]?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="r in reports[activeTab]"
        :key="r.id"
        class="bg-gray-800 text-white p-5 rounded-3xl shadow hover:shadow-xl transition relative border border-gray-700"
      >
        <h3 class="font-semibold text-lg text-blue-400">{{ r.user_name }} ({{ r.user_email }})</h3>
        <p class="text-gray-300">{{ r.subject }}</p>
        <p class="text-gray-400 text-sm mt-2">{{ r.message }}</p>
        <p v-if="r.reportedUserId" class="text-gray-400 text-sm mt-1">Zgłoszony użytkownik ID: {{ r.reportedUserId }}</p>

        <div class="flex gap-2 mt-4">
          <button
            v-if="r.status !== 'resolved'"
            @click="updateStatus(r.id, 'resolved')"
            class="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition font-semibold"
          >
            ✅ Rozwiązany
          </button>
          <button
            v-if="r.status !== 'closed'"
            @click="updateStatus(r.id, 'closed')"
            class="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition font-semibold"
          >
            ❌ Zamknij
          </button>
        </div>

        <span
          :class="statusColor(r.status)"
          class="absolute top-4 right-4 px-3 py-1 rounded-xl text-xs font-semibold"
        >
          {{ r.status || 'pending' }}
        </span>
      </div>
    </div>

    <p v-else class="text-gray-400 text-center mt-6">Brak zgłoszeń w tej kategorii.</p>

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

const reports = ref({ pending: [], resolved: [], closed: [] })
const activeTab = ref('pending')
const tabs = [
  { key: 'pending', name: 'Oczekujące' },
  { key: 'resolved', name: 'Rozwiązane' },
  { key: 'closed', name: 'Zamknięte' }
]

// 🌟 Toasty
const toasts = ref([])
const showToast = (message, type='success', duration=3000) => {
  toasts.value.push({ message, type })
  setTimeout(() => {
    toasts.value.shift()
  }, duration)
}

const fetchReports = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/reports', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      reports.value.pending = data.pending || []
      reports.value.resolved = data.resolved || []
      reports.value.closed = data.closed || []
    }
  } catch (err) {
    console.error('Błąd pobierania zgłoszeń:', err)
    showToast('Błąd pobierania zgłoszeń', 'error')
  }
}

const updateStatus = async (id, status) => {
  try {
    const res = await fetch(`http://localhost:3000/api/reports/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      fetchReports()
      showToast(`Status zgłoszenia zaktualizowany na "${status}"`)
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
    case 'resolved': return 'bg-green-100 text-green-700'
    case 'closed': return 'bg-red-100 text-red-700'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

onMounted(fetchReports)
</script>
