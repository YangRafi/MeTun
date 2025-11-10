<template>
  <div class="relative w-full max-w-4xl mx-auto select-none mt-30">
    <!-- 🖼️ Karta -->
    <div
      ref="card"
      class="relative rounded-3xl overflow-hidden backdrop-blur-md bg-white/70 border border-blue-200 shadow-xl cursor-grab active:cursor-grabbing"
      :style="[cardStyle, { height: '650px' }]"
      @pointerdown="onPointerDown"
    >
      <!-- 🔹 Overlay: verified / trial -->
      <div class="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
        <span
          v-if="profile.isVerified"
          class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md"
        >
          ✔ Zweryfikowany
        </span>
        <span
          v-else-if="profile.isTrial"
          class="bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md"
        >
          🎁 Trial
        </span>
      </div>

      <!-- 🔹 Zdjęcie -->
      <div class="relative w-full h-full">
        <img
          v-if="currentImage"
          :src="currentImage"
          alt="Profile Picture"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg"
        >
          Brak zdjęcia
        </div>

        <!-- ❤️ Po bokach zdjęcia -->
        <button
          @click="$emit('swipe-left')"
          class="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition active:scale-90 z-30"
        >
          ✖
        </button>
        <button
          @click="$emit('swipe-right')"
          class="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition active:scale-90 z-30"
        >
          ❤
        </button>

        <!-- 🔹 Gradient na dole i opis -->
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h2 class="text-3xl font-bold text-white drop-shadow-md">
            {{ profile.name }}, {{ profile.age }} lat
          </h2>
          <p class="text-sm text-gray-200 mt-1 leading-tight">
            {{ profile.university_name }}<br />
            {{ profile.faculty_name }}<br />
            {{ profile.discipline_name }}
          </p>
          <div class="mt-3 bg-white/30 backdrop-blur-md p-4 rounded-2xl shadow-inner">
            <p v-if="profile.bio" class="text-gray-800 leading-relaxed text-sm md:text-base">
              {{ profile.bio }}
            </p>
            <p v-else class="text-gray-500 italic text-center text-sm md:text-base">
              Użytkownik nie dodał jeszcze opisu.
            </p>
          </div>
        </div>

        <!-- 🔹 Serce i online status w rogach -->
        <div class="absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg z-40">
          <i class="fas fa-heart text-pink-500 text-2xl"></i>
        </div>
        <div class="absolute -bottom-3 -right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg z-40">
          <div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  profile: { type: Object, required: true }
})
const emit = defineEmits(['swipe-left', 'swipe-right'])

const currentImageIndex = ref(0)
const hasMultipleImages = computed(
  () => Array.isArray(props.profile.images) && props.profile.images.length > 0
)
const currentImage = computed(() =>
  hasMultipleImages.value
    ? props.profile.images[currentImageIndex.value]
    : props.profile.profile_picture
)

// 🔹 Swipe / Drag logika
const card = ref(null)
const start = ref({ x: 0, y: 0 })
const offset = ref({ x: 0, y: 0 })
const isDragging = ref(false)

const cardStyle = computed(() => ({
  transform: `translate(${offset.value.x}px, ${offset.value.y}px) rotate(${offset.value.x / 15}deg)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s ease-out'
}))

function onPointerDown(e) {
  start.value = { x: e.clientX, y: e.clientY }
  isDragging.value = true
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  offset.value = {
    x: e.clientX - start.value.x,
    y: e.clientY - start.value.y
  }
}

function onPointerUp() {
  isDragging.value = false
  const threshold = 150
  if (offset.value.x > threshold) animateOffScreen('right')
  else if (offset.value.x < -threshold) animateOffScreen('left')
  else offset.value = { x: 0, y: 0 }

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function animateOffScreen(direction) {
  const x = direction === 'right' ? window.innerWidth : -window.innerWidth
  offset.value = { x, y: offset.value.y }
  setTimeout(() => {
    offset.value = { x: 0, y: 0 }
    direction === 'right' ? emit('swipe-right') : emit('swipe-left')
  }, 300)
}
</script>

<style scoped>
div.max-w-4xl {
  transition: transform 0.3s ease;
}
</style>
