<template>
  <div class="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
    <div class="bg-white w-96 p-4 rounded-2xl shadow-lg">
      <h2 class="text-lg font-bold mb-4">Członkowie grupy</h2>
      <ul>
        <li v-for="m in members" :key="m.user_id" class="flex justify-between items-center mb-2">
          <span>
            {{ m.User?.Profile?.name || m.User?.name }} 
            {{ m.User?.Profile?.surname || m.User?.surname }} 
            ({{ m.role }})
          </span>
          <div v-if="isAdmin">
            <button @click="$emit('remove', m.user_id)" class="bg-red-500 text-white py-1 px-2 rounded">Usuń</button>
            <button @click="$emit('changeRole', m.user_id)" class="bg-blue-500 text-white py-1 px-2 rounded ml-1">Zmień rolę</button>
          </div>
          <button v-else @click="$emit('viewProfile', m.user_id)" class="bg-gray-200 py-1 px-2 rounded ml-1">Profil</button>
        </li>
      </ul>
      <button @click="$emit('close')" class="mt-4 bg-gray-300 py-2 px-4 rounded w-full">Zamknij</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  members: {
    type: Array,
    default: () => []
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});
</script>
