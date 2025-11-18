<template>
  <transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/40 flex justify-center items-start z-50"
    >
      <div
        class="bg-white/90 backdrop-blur-md w-full max-w-md mx-auto mt-24 p-8 rounded-3xl shadow-2xl border border-blue-200 relative"
      >
        <!-- Zamknięcie -->
        <button
          @click="$emit('close')"
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        <!-- Nagłówek -->
        <h2
          class="text-2xl font-extrabold mb-6 text-center text-blue-800 flex items-center justify-center gap-2"
        >
          👥 Utwórz nową grupę
        </h2>

        <div class="grid grid-cols-1 gap-4">
          <!-- Nazwa grupy -->
          <div>
            <label class="block mb-1 text-sm font-semibold text-blue-800">
              Nazwa grupy
            </label>
            <input
              v-model="groupName"
              type="text"
              placeholder="Np. Matematyka 1A"
              class="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none"
            />
          </div>

          <!-- Uczelnia / Kierunek -->
          <div v-if="disciplines.length">
            <label class="block mb-1 text-sm font-semibold text-blue-800">
              Uczelnia / Wydział / Kierunek
            </label>
            <select
              v-model="selectedDiscipline"
              class="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none"
            >
              <option :value="null">Wybierz...</option>
              <option
                v-for="d in disciplines"
                :key="d.id"
                :value="d"
              >
                {{ d.university_name }} - {{ d.faculty_name || '' }} - {{ d.discipline_name }}
              </option>
            </select>
          </div>
          <div v-else class="text-gray-500 text-sm">
            Brak zatwierdzonych uczelni/kierunków.
          </div>

          <!-- Podgląd wybranej opcji -->
          <p v-if="selectedDiscipline" class="text-gray-700 text-sm mt-1">
            Wybrano: {{ selectedDiscipline.university_name }} - {{ selectedDiscipline.faculty_name }} - {{ selectedDiscipline.discipline_name }}
          </p>

          <!-- Przycisk -->
          <div class="mt-6">
            <button
              @click="submit"
              class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 w-full shadow-md transition-transform hover:scale-105"
            >
              Utwórz grupę
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
  <Toast />
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();

const props = defineProps({
  isOpen: Boolean,
  disciplines: Array, // [{ id, discipline_id, name, faculty_name, university_name }]
});
const emit = defineEmits(["close", "created"]);

const groupName = ref("");
const selectedDiscipline = ref(null);

async function submit() {
  if (!groupName.value || !selectedDiscipline.value) {
    toast.add({
      severity: "warn",
      summary: "Uwaga",
      detail: "Podaj nazwę grupy i wybierz uczelnię/kierunek.",
      life: 3000,
    });
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/groups", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_name: groupName.value,
        discipline_id: selectedDiscipline.value.discipline_id,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      emit("created", data);
      groupName.value = "";
      selectedDiscipline.value = null;
      emit("close");
      toast.add({
        severity: "success",
        summary: "Sukces!",
        detail: "Grupa została utworzona 🎉",
        life: 3000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "Błąd",
        detail: data.error || "Nie udało się utworzyć grupy.",
        life: 3000,
      });
    }
  } catch (err) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Błąd",
      detail: "Wystąpił problem podczas tworzenia grupy.",
      life: 3000,
    });
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
