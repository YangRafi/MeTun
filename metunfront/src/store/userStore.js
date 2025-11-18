import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { fetchWithRefresh } from '@/utils/api.js';

export const useUserStore = defineStore('user', () => {
  const user = reactive({});
  const profile = reactive({});
  const loaded = ref(false);

  async function fetchUserAndProfile() {
    if (loaded.value) return; // ✅ Nie pobieraj ponownie, jeśli już załadowano

    try {
      const resUser = await fetchWithRefresh('http://localhost:3000/api/auth/me');
      if (!resUser.ok) throw new Error('Nie zalogowany');
      const userData = await resUser.json();
      Object.assign(user, userData);

      const resProfile = await fetchWithRefresh(`http://localhost:3000/api/profiles/user/${user.user_id}`);
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
      await fetchWithRefresh('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      });
    } catch (err) {
      console.error('❌ Błąd podczas wylogowania:', err);
    } finally {
      Object.keys(user).forEach(k => delete user[k]);
      Object.keys(profile).forEach(k => delete profile[k]);
      loaded.value = false;

      if (router) router.push('/');
    }
  }

  return { user, profile, loaded, fetchUserAndProfile, logout };
});
