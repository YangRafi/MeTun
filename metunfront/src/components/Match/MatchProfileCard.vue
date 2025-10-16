<template>
  <div class="max-w-md mx-auto relative select-none">
    <!-- 🖼️ Karta -->
    <div
      ref="card"
      class="bg-white rounded-2xl shadow-xl overflow-hidden relative cursor-grab active:cursor-grabbing transition-transform duration-200"
      :style="cardStyle"
      @pointerdown="onPointerDown"
    >
      <!-- 🔹 Zdjęcie -->
      <div class="relative">
        <img
          v-if="profile.profile_picture"
          :src="currentImage"
          alt="Profile Picture"
          class="w-full h-[500px] object-cover"
        />
        <div
          v-else
          class="w-full h-[500px] bg-gray-200 flex items-center justify-center text-gray-500 text-lg"
        >
          Brak zdjęcia
        </div>

        <!-- Gradient i opis -->
        <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div class="absolute bottom-4 left-4 text-white">
          <h2 class="text-2xl font-bold drop-shadow-md">
            {{ profile.name }}, {{ profile.age }} lat
          </h2>
          <p class="text-sm text-gray-200 mt-1 leading-tight">
            {{ profile.university_name }}<br />
            {{ profile.faculty_name }}<br />
            {{ profile.discipline_name }}
          </p>
        </div>
      </div>

      <!-- 🔹 Opis -->
      <div class="p-5">
        <p v-if="profile.bio" class="text-gray-700 leading-relaxed">
          {{ profile.bio }}
        </p>
        <p v-else class="text-gray-400 italic text-center">
          Użytkownik nie dodał jeszcze opisu.
        </p>
      </div>
    </div>

    <!-- 🔹 Przyciski (nadal działają jako alternatywa) -->
    <div class="flex justify-center gap-6 mt-6">
      <button
        @click="$emit('swipe-left')"
        class="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md transition transform active:scale-90"
      >
        ✖
      </button>

      <button
        @click="$emit('swipe-right')"
        class="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md transition transform active:scale-90"
      >
        ❤
      </button>
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
  () => Array.isArray(props.profile.images) && props.profile.images.length > 1
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
  const threshold = 150 // ile trzeba przeciągnąć w px

  if (offset.value.x > threshold) {
    animateOffScreen('right')
  } else if (offset.value.x < -threshold) {
    animateOffScreen('left')
  } else {
    offset.value = { x: 0, y: 0 } // wróć do środka
  }

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function animateOffScreen(direction) {
  const x = direction === 'right' ? window.innerWidth : -window.innerWidth
  offset.value = { x, y: offset.value.y }
  setTimeout(() => {
    offset.value = { x: 0, y: 0 }
    if (direction === 'right') emit('swipe-right')
    else emit('swipe-left')
  }, 300)
}
</script>

<style scoped>
div.max-w-md {
  transition: transform 0.3s ease;
}
</style>
