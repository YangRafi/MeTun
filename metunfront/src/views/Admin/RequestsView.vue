<template>
  <section class="animate-fade-in">
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
            <td class="py-3 px-4">{{ user.isBanned ? 'Zbanowany' : 'Aktywny' }}</td>
            <td class="py-3 px-4 space-x-2">
              <button @click="changeRole(user)" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Zmień rolę</button>
              <button @click="banUser(user)" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">Zbanuj</button>
              <button @click="deleteUser(user.user_id)" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])

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
}

const banUser = async (user) => {
  const days = parseInt(prompt("Na ile dni zbanować użytkownika?", "1"))
  if (!days) return
  await fetch(`http://localhost:3000/api/users/${user.user_id}/ban`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
    credentials: 'include'
  })
  user.isBanned = true
}

const deleteUser = async (id) => {
  if (!confirm("Na pewno usunąć użytkownika?")) return
  await fetch(`http://localhost:3000/api/users/${id}`, { method: 'DELETE', credentials: 'include' })
  users.value = users.value.filter(u => u.user_id !== id)
}

onMounted(fetchUsers)
</script>
