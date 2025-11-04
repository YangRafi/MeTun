<template>
  <router-view v-slot="{ Component }">
  <keep-alive include="DashboardView,HomeView">
    <component :is="Component" />
  </keep-alive>
</router-view>
<Toast />
<ConfirmDialog />
</template>

<script setup>
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
</script>
