/**
 * Device Storage & Cookie Repository
 * Manages unique device identification, role segregation, and local session persistence across multiple devices.
 */

export interface DeviceProfile {
  deviceId: string;
  role: 'EMPRESA' | 'FREELANCER';
  userId: string;
  userName: string;
  deviceName: string;
  avatar?: string;
  lastActive: string;
}

const COOKIE_KEYS = {
  DEVICE_ID: 'chefmatch_device_id',
  ROLE: 'chefmatch_role',
  USER_ID: 'chefmatch_user_id',
  USER_NAME: 'chefmatch_user_name',
  DEVICE_NAME: 'chefmatch_device_name',
};

const LOCAL_KEYS = {
  PROFILE: 'chefmatch_device_profile_v1',
  DEVICE_ID: 'chefmatch_device_id_v1',
};

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function detectDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo Web';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Aparelho Android';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'PC Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Navegador Web';
}

/**
 * Retrieves the device's persistent ID, or generates a fresh unique ID.
 */
export function getDeviceId(): string {
  let id = getCookie(COOKIE_KEYS.DEVICE_ID);
  if (!id) {
    try {
      id = localStorage.getItem(LOCAL_KEYS.DEVICE_ID);
    } catch {}
  }

  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCookie(COOKIE_KEYS.DEVICE_ID, id, 365);
    try {
      localStorage.setItem(LOCAL_KEYS.DEVICE_ID, id);
    } catch {}
  }

  return id;
}

/**
 * Loads the active device profile from Cookies / LocalStorage.
 */
export function getSavedDeviceProfile(): DeviceProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEYS.PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const deviceId = getDeviceId();
  const role = getCookie(COOKIE_KEYS.ROLE) as 'EMPRESA' | 'FREELANCER' | null;
  const userId = getCookie(COOKIE_KEYS.USER_ID);
  const userName = getCookie(COOKIE_KEYS.USER_NAME);

  if (role && userId) {
    return {
      deviceId,
      role,
      userId,
      userName: userName || 'Usuário ChefMatch',
      deviceName: detectDeviceName(),
      lastActive: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Saves device profile into both Cookies and LocalStorage, and registers it with the server.
 */
export function persistDeviceProfile(profile: Partial<DeviceProfile>): DeviceProfile {
  const deviceId = getDeviceId();
  const fullProfile: DeviceProfile = {
    deviceId,
    role: profile.role || 'EMPRESA',
    userId: profile.userId || 'default',
    userName: profile.userName || 'Usuário',
    deviceName: profile.deviceName || detectDeviceName(),
    avatar: profile.avatar || '',
    lastActive: new Date().toISOString(),
  };

  // 1. Save in Cookies
  setCookie(COOKIE_KEYS.DEVICE_ID, fullProfile.deviceId, 365);
  setCookie(COOKIE_KEYS.ROLE, fullProfile.role, 365);
  setCookie(COOKIE_KEYS.USER_ID, fullProfile.userId, 365);
  setCookie(COOKIE_KEYS.USER_NAME, fullProfile.userName, 365);
  setCookie(COOKIE_KEYS.DEVICE_NAME, fullProfile.deviceName, 365);

  // 2. Save in LocalStorage
  try {
    localStorage.setItem(LOCAL_KEYS.PROFILE, JSON.stringify(fullProfile));
    localStorage.setItem(LOCAL_KEYS.DEVICE_ID, fullProfile.deviceId);
  } catch {}

  // 3. Sync with backend asynchronously
  syncDeviceSessionWithServer(fullProfile).catch(() => {});

  return fullProfile;
}

/**
 * Syncs the device profile to the server backend.
 */
export async function syncDeviceSessionWithServer(profile: DeviceProfile): Promise<void> {
  try {
    await fetch('/api/device/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch (err) {
    // offline or silent error
  }
}
