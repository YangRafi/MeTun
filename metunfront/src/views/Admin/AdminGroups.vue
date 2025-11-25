<template>
  <section class="animate-fade-in p-15">
    <div class="flex justify-between mb-6">
      <h2 class="text-2xl font-semibold">👥 Zarządzanie grupami</h2>
      <button @click="$emit('back')" class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded">
        ⬅ Wróć
      </button>
    </div>

    <!-- Dodaj grupę -->
    <div class="flex gap-2 mb-4">
      <input v-model="newGroup.name" placeholder="Nazwa grupy" class="px-4 py-2 rounded bg-gray-700 text-white w-1/3" />
      <input v-model="newGroup.discipline_id" placeholder="ID kierunku" class="px-4 py-2 rounded bg-gray-700 text-white w-1/6" />
      <button @click="addGroup" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Dodaj</button>
    </div>

    <div class="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
      <table class="min-w-full text-sm text-left">
        <thead class="bg-gray-700 text-gray-300 uppercase">
          <tr>
            <th class="py-3 px-4">ID</th>
            <th class="py-3 px-4">Nazwa</th>
            <th class="py-3 px-4">ID kierunku</th>
            <th class="py-3 px-4">Członkowie</th>
            <th class="py-3 px-4">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groups" :key="group.group_id">
            <tr class="border-b border-gray-700 hover:bg-gray-700">
              <td class="py-3 px-4">{{ group.group_id }}</td>
              <td class="py-3 px-4">{{ group.group_name }}</td>
              <td class="py-3 px-4">{{ group.discipline_id || '-' }}</td>
              <td class="py-3 px-4">
                <button @click="toggleMembers(group)" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">
                  {{ group.showMembers ? 'Ukryj członków' : 'Pokaż członków' }}
                </button>
              </td>
              <td class="py-3 px-4 space-x-2">
                <button @click="openEditDialog(group)" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Edytuj</button>
                <button @click="confirmDeleteGroup(group)" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Usuń</button>
              </td>
            </tr>
            <!-- Członkowie grupy -->
            <tr v-if="group.showMembers" class="bg-gray-700">
              <td colspan="5" class="px-4 py-2">
                <ul>
                  <li v-for="member in group.groupMembers" :key="member.user.user_id" class="flex justify-between items-center py-1">

                      <!-- Dane -->
                      <span>
                        {{ member.user.name }} {{ member.user.surname }}
                        <span class="italic text-sm">({{ member.role }})</span>
                      </span>

                      <!-- Zmiana roli + usuwanie -->
                      <div class="flex items-center gap-2">

                        <!-- Dropdown roli -->
                        <select
                          v-model="member.role"
                          class="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>

                        <!-- Zapisz zmianę -->
                        <button
                          @click="changeRole(group.group_id, member.user.user_id, member.role)"
                          class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm"
                        >
                          Zapisz
                        </button>

                        <!-- Usuń (można usuwać nawet admina i twórcę) -->
                        <button
                          @click="removeMember(group.group_id, member.user.user_id)"
                          class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                        >
                          Usuń
                        </button>

                      </div>

                    </li>
                  <li v-if="group.groupMembers.length === 0">Brak członków</li>
                </ul>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <h2 class="text-xl font-semibold mt-10 mb-4">📩 Oczekujące prośby o dołączenie</h2>

        <div class="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
          <table class="min-w-full text-sm text-left">
            <thead class="bg-gray-700 text-gray-300 uppercase">
              <tr>
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Użytkownik</th>
                <th class="py-3 px-4">Grupa</th>
                <th class="py-3 px-4">Typ</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Akcje</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="req in groupRequests" :key="req.request_id" class="border-b border-gray-700">
                <td class="px-4 py-3">{{ req.request_id }}</td>
                <td class="px-4 py-3">{{ req.user?.name }} {{ req.user?.surname }}</td>
                <td class="px-4 py-3">{{ req.group?.group_name }}</td>
                <td class="px-4 py-3">{{ req.type }}</td>
                <td class="px-4 py-3">{{ req.status }}</td>

                <td class="px-4 py-3 space-x-2">
                  <button
                    @click="respondToRequest(req.request_id, 'accept')"
                    class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                  >
                    ✔ Akceptuj
                  </button>

                  <button
                    @click="respondToRequest(req.request_id, 'rejected')"
                    class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                  >
                    ✖ Odrzuć
                  </button>

                  <button
                    @click="deleteRequest(req.request_id)"
                    class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded"
                  >
                    🗑 Usuń
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

    <!-- 🔔 Toasty -->
    <div class="fixed top-5 right-5 space-y-2 z-50">
      <transition-group name="toast" tag="div">
        <div
          v-for="(toast, i) in toasts"
          :key="toast.id"
          :class="[
            'px-4 py-3 rounded-lg shadow-lg text-white flex items-center space-x-3',
            toast.type==='success' ? 'bg-green-500' : 'bg-red-500'
          ]"
        >
          <span>{{ toast.message }}</span>
          <button @click="removeToast(toast.id)" class="ml-auto text-white font-bold">✕</button>
        </div>
      </transition-group>
    </div>

    <!-- 🔹 Dialog edycji grupy -->
    <Dialog header="Edytuj grupę" v-model:visible="editDialogVisible" modal>
      <div class="space-y-3">
        <label class="block">Nazwa grupy</label>
        <input v-model="editGroupData.name" type="text" class="w-full rounded p-2 bg-gray-100" />

        <label class="block">ID kierunku</label>
        <input v-model="editGroupData.discipline_id" type="number" class="w-full rounded p-2 bg-gray-100" />

        <div class="flex justify-end space-x-2 mt-4">
          <Button label="Anuluj" severity="secondary" @click="editDialogVisible = false" />
          <Button label="Zapisz" severity="success" @click="confirmEditGroup" />
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const groups = ref([])
const newGroup = ref({ name: '', discipline_id: null })
const toasts = ref([])
let toastIdCounter = 0

const toast = useToast()
const confirm = useConfirm()
const groupRequests = ref([])
const editDialogVisible = ref(false)
const editGroupData = ref({ group_id: null, name: '', discipline_id: null })

const showToast = (severity, title, message) => {
  toast.add({ severity, summary: title, detail: message, life: 3000 })
}

// 🔹 Pobieranie grup + członków
const fetchGroups = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/groups', { credentials: 'include' })
    if (!res.ok) throw new Error('Błąd ładowania grup')
    const data = await res.json()
    groups.value = data.map(g => ({ ...g, groupMembers: [], showMembers: false }))
  } catch (err) {
    showToast('error', 'Błąd', err.message)
  }
}

// 🔹 Pobranie wszystkich requestów
const fetchGroupRequests = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/groupRequests/all', {
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Nie udało się pobrać próśb")
    
    const data = await res.json()
    groupRequests.value = data.requests.map(r => ({
      ...r,
      user: r.user || null,
      sender: r.sender || null,
      group: r.group || null
    }))
  } catch (err) {
    showToast('error', 'Błąd', err.message)
  }
}

// 🔹 Odpowiedź na request
const respondToRequest = async (requestId, action) => {
  try {
    const res = await fetch('http://localhost:3000/api/groupRequests/respond', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action })
    })

    if (!res.ok) throw new Error("Nie udało się zmienić statusu")

    showToast('success', 'OK', 'Status zmieniony')
    fetchGroupRequests() // odśwież wszystkie requesty
    fetchGroups() // odświeża listę członków w grupach
  } catch (err) {
    showToast('error', 'Błąd', err.message)
  }
}

// 🔹 Usuwanie requesta
const deleteRequest = async (requestId) => {
  console.log('Request ID do usunięcia:', requestId);
  try {
    const res = await fetch(`http://localhost:3000/api/groupRequests/request/${requestId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Odpowiedź z serwera:', data);
    if (!res.ok) throw new Error(data.error || "Nie udało się usunąć requesta");

    showToast('success', 'Usunięto', 'Request usunięty');
    fetchGroupRequests();
  } catch (err) {
    showToast('error', 'Błąd', err.message);
  }
}

const toggleMembers = async (group) => {
  group.showMembers = !group.showMembers
  if (group.showMembers && group.groupMembers.length === 0) {
    try {
      const res = await fetch(`http://localhost:3000/api/group-members/${group.group_id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Błąd ładowania członków')
      group.groupMembers = await res.json()
    } catch (err) {
      showToast('error', 'Błąd', err.message)
    }
  }
}

const removeMember = async (groupId, userId) => {
  try {
    const res = await fetch(`http://localhost:3000/api/group-members/${groupId}/member/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Nie udało się usunąć członka')
    const group = groups.value.find(g => g.group_id === groupId)
    group.groupMembers = group.groupMembers.filter(m => m.user.user_id !== userId)
    showToast('success', 'Sukces', 'Członek usunięty')
  } catch (err) {
    showToast('error', 'Błąd', err.message)
  }
}

// 🔹 Dodawanie grupy
const addGroup = async () => {
  if (!newGroup.value.name) return showToast('error', 'Błąd', 'Podaj nazwę grupy')
  try {
    const res = await fetch('http://localhost:3000/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        group_name: newGroup.value.name,
        discipline_id: newGroup.value.discipline_id,
        creator_user_id: 1
      })
    })
    if (!res.ok) throw new Error('Nie udało się utworzyć grupy')
    const group = await res.json()
    group.groupMembers = []
    group.showMembers = false
    groups.value.push(group)
    newGroup.value = { name: '', discipline_id: null }
    showToast('success', 'Sukces', 'Grupa utworzona')
  } catch (err) {
    showToast('error', 'Błąd', err.message)
  }
}

// 🔹 Edycja grupy
const openEditDialog = (group) => {
  editGroupData.value = { group_id: group.group_id, name: group.group_name, discipline_id: group.discipline_id }
  editDialogVisible.value = true
}

const confirmEditGroup = async () => {
  try {
    const { group_id, name, discipline_id } = editGroupData.value
    const res = await fetch(`http://localhost:3000/api/groups/${group_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ group_name: name, discipline_id })
    })
    if (!res.ok) throw new Error('Nie udało się zaktualizować grupy')
    const group = groups.value.find(g => g.group_id === group_id)
    group.group_name = name
    group.discipline_id = discipline_id
    editDialogVisible.value = false
    showToast('success', 'Sukces', 'Grupa zaktualizowana')
  } catch (err) {
    showToast('error', 'Błąd', err.message)
  }
}

// 🔹 Usuwanie grupy
const confirmDeleteGroup = (group) => {
  confirm.require({
    message: `Czy na pewno chcesz usunąć grupę ${group.group_name}?`,
    header: 'Potwierdź usunięcie',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/groups/${group.group_id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (!res.ok) throw new Error('Nie udało się usunąć grupy')
        groups.value = groups.value.filter(g => g.group_id !== group.group_id)
        showToast('success', 'Sukces', 'Grupa usunięta')
      } catch (err) {
        showToast('error', 'Błąd', err.message)
      }
    },
    reject: () => {}
  })
}

const changeRole = async (groupId, userId, role) => {
  try {
    const res = await fetch(`http://localhost:3000/api/group-members/${groupId}/member/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role })
    });

    if (!res.ok) throw new Error("Nie udało się zmienić roli");

    showToast('success', 'Sukces', 'Rola zmieniona');
  } catch (err) {
    showToast('error', 'Błąd', err.message);
  }
};

onMounted(() => {
  fetchGroups()
  fetchGroupRequests()  
})
</script>
