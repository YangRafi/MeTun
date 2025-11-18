import { useUserStore } from '@/store/userStore';

export async function fetchWithRefresh(url, options = {}) {
  let res = await fetch(url, { ...options, credentials: 'include' });

  if (res.status === 401) {
    console.log("[API] Access token expired, trying refresh");

    const refresh = await fetch("http://localhost:3000/api/auth/refresh-token", { credentials: 'include' });
    if (!refresh.ok) throw new Error("Refresh token failed");

    const data = await refresh.json();
    // Aktualizujemy store po refresh token
    const userStore = useUserStore();
    Object.assign(userStore.user, data.user);
    userStore.user.isVerified = data.isVerified;

    // powtarzamy request
    res = await fetch(url, { ...options, credentials: 'include' });
  }

  return res;
}
