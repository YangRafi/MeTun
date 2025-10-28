<template>
  <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-3xl border border-blue-200 grid gap-4">
    <p class="text-blue-800 font-semibold">
      Imię i nazwisko: {{ profile.firstName }} {{ profile.lastName }}
    </p>
    <p class="text-blue-800 font-semibold">E-mail: {{ profile.email }}</p>
    <p class="text-blue-800 font-semibold">
      Data rejestracji:
      {{ profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-" }}
    </p>
    <p class="text-blue-800 font-semibold">Liczba grup: {{ profile.groupsCount || 0 }}</p>
    <p class="text-blue-800 font-semibold">Status trial: {{ profile.hasTrial ? "aktywny" : "nieaktywny" }}</p>
  </div>
</template>

<script setup>
import { defineProps } from "vue";

const props = defineProps({
  profile: Object,
});
</script>
