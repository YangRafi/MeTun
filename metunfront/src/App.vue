<template>
  <router-view v-slot="{ Component }">
  <keep-alive include="DashboardView,HomeView">
    <component :is="Component" />
  </keep-alive>
</router-view>
</template>

<script setup>
</script>
