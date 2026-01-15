<template>
  <section class="animate-fade-in p-15">
    <div class="flex justify-between mb-6">
      <h2 class="text-2xl font-semibold">👥 Zarządzanie użytkownikami</h2>
      <button @click="$emit('back')" class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded">
        ⬅ Wróć
      </button>
    </div>

    <div class="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
      <table class="min-w-full text-sm text-left">
        <thead class="bg-gray-700 text-gray-300 uppercase">
          <tr>
            <th class="py-3 px-4">ID</th>
            <th class="py-3 px-4">Imię</th>
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Rola</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.user_id" class="border-b border-gray-700 hover:bg-gray-700">
            <td class="py-3 px-4">{{ user.user_id }}</td>
            <td class="py-3 px-4">{{ user.name }} {{ user.surname }}</td>
            <td class="py-3 px-4">{{ user.email }}</td>
            <td class="py-3 px-4 capitalize">{{ user.role }}</td>
            <td class="py-3 px-4">
              {{ user.is_banned ? `Zbanowany do ${formatDate(user.banned_until)}` : 'Aktywny' }}
            </td>
            <td class="py-3 px-4 space-x-2">
              <button 
                @click.stop="changeRole(user)" 
                class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              >
                Zmień rolę
              </button>

              <button
                @click.stop="openBanDialog(user)"
                :class="user.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'"
                class="px-3 py-1 rounded"
              >
                {{ user.is_banned ? 'Odbanuj' : 'Zbanuj' }}
              </button>

              <button 
                @click.stop="confirmDeleteUser(user)" 
                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Usuń
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Dialog header="Zbanuj użytkownika" v-model:visible="banDialogVisible" modal>
      <div class="space-y-3">
        <p>Na ile dni chcesz zbanować użytkownika?</p>
        <input
          v-model="banDays"
          type="number"
          min="1"
          class="w-full rounded p-2 bg-gray-100"
        />
        <div class="flex justify-end space-x-2 mt-4">
          <Button label="Anuluj" severity="secondary" @click="banDialogVisible = false" />
          <Button label="Zbanuj" severity="danger" @click="confirmBan" />
        </div>
      </div>
    </Dialog>

  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const confirm = useConfirm()
const users = ref([])
const banDialogVisible = ref(false)
const banDays = ref(1)
const selectedUser = ref(null)

const showToast = (severity, title, message) => {
  toast.add({
    severity,
    summary: title,
    detail: message,
    life: 3000
  })
}

const fetchUsers = async () => {
  const res = await fetch('http://localhost:3000/api/users', { credentials: 'include' })
  if (res.ok) users.value = await res.json()
}

const changeRole = async (user) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  await fetch(`http://localhost:3000/api/users/${user.user_id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: newRole }),
    credentials: 'include'
  })
  user.role = newRole
  showToast('success', 'Zmieniono rolę', `Nowa rola: ${newRole}`)
}

const openBanDialog = (user) => {
  selectedUser.value = user
  banDays.value = 1

  if (user.is_banned) return unbanUser(user)
  banDialogVisible.value = true
}

const confirmBan = async () => {
  const user = selectedUser.value
  banDialogVisible.value = false

  const res = await fetch(`http://localhost:3000/api/users/${user.user_id}/ban`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days: Number(banDays.value) }),
    credentials: 'include'
  })

  if (res.ok) {
    const data = await res.json()
    user.is_banned = true
    user.banned_until = data.until
    showToast('warn', 'Użytkownik zbanowany', `Do ${formatDate(data.until)}`)
  }
}

const unbanUser = async (user) => {
  const res = await fetch(`http://localhost:3000/api/users/${user.user_id}/unban`, {
    method: 'PUT',
    credentials: 'include'
  })
  if (res.ok) {
    user.is_banned = false
    user.banned_until = null
    showToast('success', 'Odbanowano użytkownika', '')
  }
}

const confirmDeleteUser = (user) => {
  confirm.require({
    message: `Czy na pewno chcesz usunąć użytkownika ${user.email}?`,
    header: 'Potwierdź usunięcie',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteUser(user.user_id),
    reject: () => {}
  })
}

const deleteUser = async (id) => {
  await fetch(`http://localhost:3000/api/users/${id}`, { method: 'DELETE', credentials: 'include' })
  users.value = users.value.filter(u => u.user_id !== id)
  showToast('error', 'Użytkownik usunięty', '')
}

const formatDate = (isoDate) => {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleString()
}

onMounted(fetchUsers)
</script>
