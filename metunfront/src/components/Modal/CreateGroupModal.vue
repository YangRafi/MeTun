<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 bg-black/30 flex justify-center items-start z-50">
      <div class="bg-white w-full max-w-md mx-auto mt-24 p-6 rounded-3xl shadow-xl relative border border-green-200">
        <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h2 class="text-xl font-semibold mb-4 text-center text-green-800">Utwórz grupę</h2>

        <div class="grid grid-cols-1 gap-4">
          <!-- Nazwa grupy -->
          <div>
            <label class="block mb-1 text-sm font-medium text-green-800">Nazwa grupy</label>
            <input v-model="groupName" type="text" placeholder="Np. Matematyka 1A" 
                   class="w-full border rounded-lg p-2 focus:ring-green-300 focus:border-green-300"/>
          </div>

          <!-- Wybór uczelni/kierunku -->
          <div v-if="disciplines.length">
            <label class="block mb-1 text-sm font-medium text-green-800">Uczelnia / Kierunek</label>
            <select v-model="selectedDiscipline" class="w-full border rounded-lg p-2">
              <option value="">Wybierz...</option>
              <option v-for="d in disciplines" :key="d.id" :value="d.discipline_id">
                {{ d.university_name }} - {{ d.name }}
              </option>
            </select>
          </div>
          <div v-else class="text-gray-500 text-sm">
            Brak zatwierdzonych uczelni/kierunków.
          </div>

          <!-- Przycisk utworzenia grupy -->
          <div class="mt-4">
            <button @click="submit" 
                    class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 w-full shadow-md">
              Utwórz grupę
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  isOpen: Boolean,
  disciplines: Array // [{ id, discipline_id, name, university_name }]
});
const emit = defineEmits(["close", "created"]);

const groupName = ref("");
const selectedDiscipline = ref("");

async function submit() {
  if (!groupName.value || !selectedDiscipline.value) {
    alert("Podaj nazwę grupy i wybierz uczelnię/kierunek.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/groups", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_name: groupName.value,
        discipline_id: selectedDiscipline.value
      })
    });

    const data = await res.json();
    if (res.ok) {
      emit("created", data);
      groupName.value = "";
      selectedDiscipline.value = "";
      emit("close");
      alert("Grupa utworzona!");
    } else {
      alert(data.error || "Nie udało się utworzyć grupy.");
    }
  } catch (err) {
    console.error(err);
    alert("Błąd podczas tworzenia grupy.");
  }
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
