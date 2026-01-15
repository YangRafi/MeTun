<template>
  <div class="relative w-full max-w-4xl mx-auto select-none mt-10">

    <div
      ref="card"
      class="relative rounded-3xl backdrop-blur-md bg-white/80 border border-gray-200 shadow-2xl cursor-grab active:cursor-grabbing overflow-visible"
      :style="[cardStyle, { height: '650px' }]"
      @pointerdown="onPointerDown"
    >

      <div class="absolute top-4 right-4 z-30">
        <span
          v-if="profile.isVerified"
          class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold"
        >
          ✔ Zweryfikowany
        </span>
        <span
          v-else-if="profile.isTrial"
          class="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold"
        >
          🎁 Trial
        </span>
      </div>

      <div class="absolute top-4 left-4 z-40">
        <button
          @click="showMenu = !showMenu"
          class="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white text-2xl hover:bg-black/60"
        >
          ⋮
        </button>

        <div
          v-if="showMenu"
          class="absolute mt-2 w-48 bg-white rounded-2xl shadow-xl"
        >
          <button
            @click="openReportModal"
            class="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
          >
            🚩 Zgłoś profil
          </button>
        </div>
      </div>

      <div class="relative w-full h-full rounded-3xl overflow-hidden">
        <img
          v-if="currentImage"
          :src="currentImage"
          class="w-full h-full object-cover"
        />
      </div>

      <button
        @click="playDislike"
        class="absolute top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition z-55 ring-4 ring-white"
        :style="{ left: '-28px' }"
      >
        <Vue3Lottie
          ref="dislikeLottie"
          :animationData="dislikeAnimation"
          :autoplay="false"
          :loop="false"
          :width="300"
          :height="300"
        />
      </button>

      <button
        @click="playLike"
        class="absolute top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition z-55 ring-4 ring-white"
        :style="{ right: '-28px' }"
      >
        <Vue3Lottie
          ref="likeLottie"
          :animationData="likeAnimation"
          :autoplay="false"
          :loop="false"
          :width="200"
          :height="200"
        />
      </button>

      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/100 via-black/85 to-transparent pt-32 p-6 rounded-b-3xl z-50">
        <h2 class="text-3xl font-bold text-white">
          {{ profile.name }}, {{ profile.age }} lat
        </h2>
        <p class="text-sm text-gray-200 mt-1">
          {{ profile.university_name }}<br />
          {{ profile.faculty_name }}<br />
          {{ profile.discipline_name }}
        </p>

        <div class="mt-3 bg-white/10 backdrop-blur-md text-white p-4 rounded-3xl">
          <p v-if="profile.bio" class="">
            {{ profile.bio }}
          </p>
          <p v-else class="italic text-gray-200 text-center">
            Użytkownik nie dodał opisu.
          </p>
        </div>
      </div>
    </div>

    <ReportModal
      v-model="showReportModal"
      :reported-user-id="profile.user_id"
    />
  </div>
</template>


<script setup>
import { ref, computed } from "vue"
import { Vue3Lottie } from "vue3-lottie"
import { useToast } from "primevue/usetoast"

import ReportModal from "./ReportModal.vue"
import likeAnimation from "@/assets/animations/like.json"
import dislikeAnimation from "@/assets/animations/dislike.json"

const toast = useToast()

const props = defineProps({
  profile: { type: Object, required: true }
})
const emit = defineEmits(["swipe-left", "swipe-right"])

const currentImage = computed(() =>
  Array.isArray(props.profile.images) && props.profile.images.length
    ? props.profile.images[0]
    : props.profile.profile_picture
)

const start = ref({ x: 0, y: 0 })
const offset = ref({ x: 0, y: 0 })
const isDragging = ref(false)

const cardStyle = computed(() => ({
  transform: `translate(${offset.value.x}px, ${offset.value.y}px) rotate(${offset.value.x / 15}deg)`,
  transition: isDragging.value ? "none" : "transform 0.3s ease"
}))

function onPointerDown(e) {
  start.value = { x: e.clientX, y: e.clientY }
  isDragging.value = true
  window.addEventListener("pointermove", onPointerMove)
  window.addEventListener("pointerup", onPointerUp)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  offset.value = { x: e.clientX - start.value.x, y: e.clientY - start.value.y }
}

function onPointerUp() {
  isDragging.value = false
  const threshold = 150

  if (offset.value.x > threshold) playLike()
  else if (offset.value.x < -threshold) playDislike()
  else offset.value = { x: 0, y: 0 }

  window.removeEventListener("pointermove", onPointerMove)
  window.removeEventListener("pointerup", onPointerUp)
}

const likeLottie = ref(null)
const dislikeLottie = ref(null)

function playLike() {
  if (!likeLottie.value) return
  likeLottie.value.goToAndStop(0, true)
  likeLottie.value.play()
  setTimeout(() => emit("swipe-right"), 700)
}

function playDislike() {
  if (!dislikeLottie.value) return
  dislikeLottie.value.goToAndStop(0, true)
  dislikeLottie.value.play()
  setTimeout(() => emit("swipe-left"), 700)
}

const showMenu = ref(false)
const showReportModal = ref(false)

function openReportModal() {
  showMenu.value = false
  showReportModal.value = true
}
</script>


<style scoped>
</style>
