import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = reactive({});
  const profile = reactive({});
  const loaded = ref(false);

  async function fetchUserAndProfile() {
    if (loaded.value) return; // ✅ Nie pobieraj ponownie, jeśli już załadowano

    try {
      const resUser = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
      if (!resUser.ok) throw new Error('Nie zalogowany');
      Object.assign(user, await resUser.json());

      const resProfile = await fetch(`http://localhost:3000/api/profiles/user/${user.user_id}`, { credentials: 'include' });
      if (resProfile.ok) {
        Object.assign(profile, await resProfile.json());
      } else {
        console.log('Brak profilu');
      }

      loaded.value = true;
    } catch (err) {
      console.error('❌ Błąd pobierania profilu:', err);
    }
  }

  async function logout(router = null) {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('❌ Błąd podczas wylogowania:', err);
    } finally {
      // Wyczyść lokalne dane
      Object.keys(user).forEach(k => delete user[k]);
      Object.keys(profile).forEach(k => delete profile[k]);
      loaded.value = false;

      if (router) router.push('/');
    }
  }

  return { user, profile, loaded, fetchUserAndProfile, logout };
});
