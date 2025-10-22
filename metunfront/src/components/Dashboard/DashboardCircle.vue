<template>
  <div
    class="w-40 h-40 rounded-full bg-black/30 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition transform shadow-lg"
    @click="goToRoute"
  >
    <component :is="iconComponent" class="w-12 h-12 mb-2" />
    <span class="text-lg font-semibold">{{ label }}</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import * as Icons from 'lucide-vue-next'
import { showVerifiedPopup } from '../../store/popupStore.js'

const props = defineProps({
  icon: String,
  label: String,
  route: String,
  profile: Object
})

const router = useRouter()
const iconComponent = Icons[props.icon]

const goToRoute = () => {
  console.log(`[DashboardCircle] Clicked ${props.label}, route: ${props.route}, isVerified: ${props.profile?.isVerified}`)
  const requiresVerifiedRoutes = ['/groups', '/matches']
  if (requiresVerifiedRoutes.includes(props.route) && !props.profile?.isVerified) {
    console.log(`[DashboardCircle] Blocking route because user is NOT verified`)
    showVerifiedPopup.value = true
    return
  }
  router.push(props.route)
}
</script>