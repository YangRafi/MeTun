<template>
  <div class="bg-gray-800 p-6 rounded-2xl shadow-lg text-center">
    <div class="text-3xl font-bold mb-2">{{ value }}</div>
    <div class="text-gray-300">{{ title }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String
})
</script>
