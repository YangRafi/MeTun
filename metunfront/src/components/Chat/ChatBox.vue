<template>
  <div class="flex-1 flex flex-col border rounded-lg p-4 bg-black/20 backdrop-blur-sm">
    <header class="flex items-center mb-4 border-b pb-2">
      <img
        v-if="match.profile_picture"
        :src="'http://localhost:3000' + match.profile_picture"
        class="w-10 h-10 rounded-full mr-2 object-cover"
      />
      <h2 class="text-lg font-bold">{{ match.name }}</h2>
    </header>

    <div class="flex-1 overflow-y-auto mb-4 space-y-2">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['p-2 rounded', msg.sender === 'me' ? 'bg-yellow-400/40 self-end' : 'bg-white/20 self-start']"
      >
        {{ msg.text }}
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="flex gap-2">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Napisz wiadomość..."
        class="flex-1 px-3 py-2 rounded bg-black/30 text-white placeholder-white/50"
      />
      <button type="submit" class="px-4 py-2 bg-yellow-400 text-black rounded">Wyślij</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  match: Object
})

const messages = reactive([])
const newMessage = ref('')

// TODO: podpiąć websocket / fetch z backendem
watch(() => props.match, () => {
  messages.length = 0 // czyścimy poprzednie wiadomości przy zmianie match
})
const sendMessage = () => {
  if (!newMessage.value.trim()) return
  messages.push({ text: newMessage.value, sender: 'me' })
  newMessage.value = ''
  // TODO: wysłać na backend / websocket
}
</script>
