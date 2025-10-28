<template>
  <div
    class="w-full h-full bg-black/30 backdrop-blur-md cursor-pointer overflow-hidden relative flex items-center justify-center"
    @click="goToRoute"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Video / GIF w tle -->
    <video
      v-if="videoSrc"
      :src="videoSrc"
      muted
      loop
      class="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-300"
      ref="videoEl"
    ></video>

    <!-- Etykieta -->
    <span class="relative text-white text-2xl font-bold z-10 text-center px-2">
      {{ label }}
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showVerifiedPopup } from '../../store/popupStore.js'

const props = defineProps({
  label: String,
  route: String,
  profile: Object,
  videoSrc: String
})

const router = useRouter()
const videoEl = ref(null)

const goToRoute = () => {
  const requiresVerifiedRoutes = ['/groups', '/matches']
  if (requiresVerifiedRoutes.includes(props.route) && !props.profile?.isVerified) {
    showVerifiedPopup.value = true
    return
  }
  router.push(props.route)
}

const handleMouseEnter = () => {
  if (videoEl.value) {
    videoEl.value.play()
    videoEl.value.style.opacity = 0.8
  }
}

const handleMouseLeave = () => {
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.currentTime = 0
    videoEl.value.style.opacity = 0.5
  }
}
</script>
