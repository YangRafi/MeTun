<template>
  <Dialog v-model:visible="localVisible" :modal="true" :closable="true" :style="{ width: '400px' }">
    <template #header>
      <h3 class="text-lg font-semibold text-blue-800">Zaproszenia do {{ group?.group_name }}</h3>
    </template>

    <div class="space-y-3 max-h-96 overflow-y-auto p-2 bg-white/90 backdrop-blur-md rounded-xl border border-blue-200">
      <div v-if="loading" class="text-center text-gray-500">Ładowanie...</div>
      <div v-else-if="users.length === 0" class="text-center text-gray-400 italic">Brak dostępnych osób</div>

      <div v-else v-for="u in users" :key="u.user_id" 
           class="flex justify-between items-center p-3 border rounded-lg hover:bg-blue-50 transition-colors">
        <div class="text-blue-800 font-medium">{{ u.name }} {{ u.surname }}</div>
        <button v-if="!u.invited" 
                @click="inviteUser(u)" 
                class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
          ➕ Zaproś
        </button>
        <div v-else class="flex items-center gap-1 text-green-700 font-semibold">
          ✅ Zaproszona
        </div>
      </div>
    </div>

    <template #footer>
      <button @click="localVisible = false" 
              class="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors">
        Zamknij
      </button>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import { useToast } from "primevue/usetoast";

const props = defineProps({
  isOpen: Boolean,
  group: Object,
  matches: Array
});
const emit = defineEmits(["close"]);

const users = ref([]);
const loading = ref(false);
const toast = useToast();

// lokalny stan widoczności
const localVisible = ref(props.isOpen);

// synchronizacja z props.isOpen
watch(() => props.isOpen, (val) => {
  localVisible.value = val;
  if (val) loadUsers();
});

// powiadamianie rodzica przy zamknięciu
watch(localVisible, (val) => {
  if (!val) emit('close');
});

async function loadUsers() {
  loading.value = true;

  try {
    if (!props.group || !props.group.group_id) {
      console.warn("Brak danych grupy przy ładowaniu użytkowników");
      loading.value = false;
      return;
    }

    const res = await fetch(`http://localhost:3000/api/groupRequests/${props.group.group_id}/invites`, {
      credentials: "include"
    });

    const { invites } = await res.json();
    const invitedIds = invites.map(i => i.user.user_id);

    users.value = (props.matches || [])
      .filter(u => !(props.group?.members || []).some(m => m.user_id === u.user_id))
      .map(u => ({
        ...u,
        invited: invitedIds.includes(u.user_id)
      }));

  } catch (err) {
    console.error(err);
  }

  loading.value = false;
}

async function inviteUser(user) {
  try {
    const res = await fetch("http://localhost:3000/api/groupRequests/invite", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: props.group.group_id, userId: user.user_id })
    });

    if (res.ok) {
      user.invited = true;
      toast.add({ severity: 'success', summary: 'Sukces', detail: `Zaproszono ${user.name}`, life: 3000 });

      // 🔹 Odśwież listę wszystkich zaproszeń w modalu
      await loadUsers();

      // 🔹 Jeśli chcesz też powiadomić rodzica, żeby odświeżył requests
      emit('invited', user);
    } else {
      const data = await res.json();
      toast.add({ severity: 'warn', summary: 'Błąd', detail: data.message || 'Nie udało się wysłać zaproszenia', life: 3000 });
    }
  } catch(err) { 
    console.error(err); 
    toast.add({ severity: 'error', summary: 'Błąd', detail: 'Wystąpił problem z serwerem', life: 3000 });
  }
}
</script>
