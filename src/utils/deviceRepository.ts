/**
 * Device Repository: Cookie & Cache Storage Engine
 * Manages unique device identification, multi-tier cookies, local & server cache ("cash"),
 * and real-time live synchronization between multiple devices running simultaneously.
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  role: 'EMPRESA' | 'FREELANCER';
  userId: string;
  userName: string;
  avatar?: string;
  lastActive: string;
  isOnline?: boolean;
  ip?: string;
  userAgent?: string;
}

export interface DeviceCacheData {
  contracts: any[];
  opportunities: any[];
  offlineQueue: any[];
  lastSyncedAt: string;
  devicePreferences: {
    theme?: string;
    notifications?: boolean;
    soundEnabled?: boolean;
    cameraFacingMode?: 'environment' | 'user';
    autoScan?: boolean;
  };
}

const COOKIE_KEYS = {
  DEVICE_ID: 'turnoextra_device_id',
  DEVICE_NAME: 'turnoextra_device_name',
  ROLE: 'turnoextra_device_role',
  USER_ID: 'turnoextra_user_id',
  USER_NAME: 'turnoextra_user_name',
  LAST_SYNC: 'turnoextra_last_sync',
  DEVICE_CASH: 'turnoextra_device_cash',
};

const LOCAL_STORAGE_KEYS = {
  DEVICE_INFO: 'turnoextra_device_info_v3',
  DEVICE_CACHE: 'turnoextra_device_cache_v3',
  OFFLINE_QUEUE: 'turnoextra_offline_queue_v3',
};

// ==========================================
// 1. Cookie Repository
// ==========================================
export const CookieRepository = {
  get(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + encodeURIComponent(name) + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  },

  set(name: string, value: string, days = 365): void {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },

  delete(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  },

  getAll(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    const cookies: Record<string, string> = {};
    const pairs = document.cookie.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > -1) {
        const key = decodeURIComponent(pair.slice(0, idx).trim());
        const val = decodeURIComponent(pair.slice(idx + 1).trim());
        if (key) cookies[key] = val;
      }
    }
    return cookies;
  },
};

// ==========================================
// 2. Cache / Cash Repository (Tiered: Cookie + LocalStorage + Server)
// ==========================================
export const DeviceCacheRepository = {
  /**
   * Loads the device cache from local storage or cookies
   */
  getLocalCache(): DeviceCacheData {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_CACHE);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[CacheRepository] Failed to read from localStorage', e);
    }

    return {
      contracts: [],
      opportunities: [],
      offlineQueue: [],
      lastSyncedAt: new Date().toISOString(),
      devicePreferences: {
        soundEnabled: true,
        cameraFacingMode: 'environment',
        autoScan: true,
      },
    };
  },

  /**
   * Saves cache to local storage and updates cookie timestamp
   */
  saveLocalCache(cache: Partial<DeviceCacheData>): DeviceCacheData {
    const current = this.getLocalCache();
    const updated: DeviceCacheData = {
      ...current,
      ...cache,
      lastSyncedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.DEVICE_CACHE, JSON.stringify(updated));
    } catch (e) {
      console.warn('[CacheRepository] LocalStorage quota exceeded, pruning', e);
    }

    CookieRepository.set(COOKIE_KEYS.LAST_SYNC, updated.lastSyncedAt);
    return updated;
  },

  /**
   * Syncs local device cache with backend server repository
   */
  async syncWithServer(deviceId: string): Promise<DeviceCacheData> {
    const local = this.getLocalCache();
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(deviceId)}/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(local),
      });

      if (res.ok) {
        const serverCache = await res.json();
        return this.saveLocalCache(serverCache);
      }
    } catch (e) {
      console.warn('[CacheRepository] Offline: using local cache only', e);
    }
    return local;
  },

  /**
   * Clears device cache across all storage layers
   */
  clearAll(deviceId?: string): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DEVICE_CACHE);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.OFFLINE_QUEUE);
    } catch {}

    CookieRepository.delete(COOKIE_KEYS.DEVICE_CASH);
    CookieRepository.delete(COOKIE_KEYS.LAST_SYNC);

    if (deviceId) {
      fetch(`/api/devices/${encodeURIComponent(deviceId)}/clear-cache`, { method: 'POST' }).catch(() => {});
    }
  },
};

// ==========================================
// 3. Device Identification & Handshake Manager
// ==========================================
function detectFriendlyDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo Web';
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  if (/iPhone/i.test(ua)) return 'iPhone (Mobile)';
  if (/iPad/i.test(ua)) return 'iPad (Tablet)';
  if (/Android/i.test(ua)) return isMobile ? 'Smartphone Android' : 'Tablet Android';
  if (/Mac/i.test(ua)) return 'MacBook / Mac OS';
  if (/Windows/i.test(ua)) return 'PC Windows';
  if (/Linux/i.test(ua)) return 'Linux PC';
  return isMobile ? 'Celular Web' : 'Computador Web';
}

export const DeviceManager = {
  /**
   * Retrieves or initializes persistent device ID
   */
  getDeviceId(): string {
    let id = CookieRepository.get(COOKIE_KEYS.DEVICE_ID);
    if (!id) {
      try {
        id = localStorage.getItem('turnoextra_device_id_persisted');
      } catch {}
    }

    if (!id) {
      const randomPart = Math.random().toString(36).substring(2, 8);
      const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
      id = `dev_${isMobile ? 'mobile' : 'desk'}_${Date.now().toString(36)}_${randomPart}`;
      CookieRepository.set(COOKIE_KEYS.DEVICE_ID, id, 365);
      try {
        localStorage.setItem('turnoextra_device_id_persisted', id);
      } catch {}
    }

    return id;
  },

  /**
   * Gets device nickname or generates one
   */
  getDeviceName(): string {
    const fromCookie = CookieRepository.get(COOKIE_KEYS.DEVICE_NAME);
    if (fromCookie) return fromCookie;

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_INFO);
      if (raw) {
        const info = JSON.parse(raw);
        if (info.deviceName) return info.deviceName;
      }
    } catch {}

    const generated = detectFriendlyDeviceName();
    CookieRepository.set(COOKIE_KEYS.DEVICE_NAME, generated, 365);
    return generated;
  },

  setDeviceName(name: string): void {
    CookieRepository.set(COOKIE_KEYS.DEVICE_NAME, name, 365);
    const info = this.getLocalDeviceInfo();
    info.deviceName = name;
    this.saveLocalDeviceInfo(info);
  },

  /**
   * Gets the preferred role for this specific device
   */
  getDeviceRole(): 'EMPRESA' | 'FREELANCER' {
    const roleCookie = CookieRepository.get(COOKIE_KEYS.ROLE);
    if (roleCookie === 'EMPRESA' || roleCookie === 'FREELANCER') return roleCookie;

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_INFO);
      if (raw) {
        const info = JSON.parse(raw);
        if (info.role === 'EMPRESA' || info.role === 'FREELANCER') return info.role;
      }
    } catch {}

    return 'EMPRESA';
  },

  setDeviceRole(role: 'EMPRESA' | 'FREELANCER'): void {
    CookieRepository.set(COOKIE_KEYS.ROLE, role, 365);
    const info = this.getLocalDeviceInfo();
    info.role = role;
    this.saveLocalDeviceInfo(info);
  },

  getLocalDeviceInfo(): DeviceInfo {
    const deviceId = this.getDeviceId();
    const deviceName = this.getDeviceName();
    const role = this.getDeviceRole();
    const userId = CookieRepository.get(COOKIE_KEYS.USER_ID) || 'user-1';
    const userName = CookieRepository.get(COOKIE_KEYS.USER_NAME) || (role === 'FREELANCER' ? 'Carlos Silva' : 'Izakaya Matsu');

    return {
      deviceId,
      deviceName,
      role,
      userId,
      userName,
      lastActive: new Date().toISOString(),
    };
  },

  saveLocalDeviceInfo(info: Partial<DeviceInfo>): DeviceInfo {
    const current = this.getLocalDeviceInfo();
    const updated: DeviceInfo = {
      ...current,
      ...info,
      lastActive: new Date().toISOString(),
    };

    CookieRepository.set(COOKIE_KEYS.DEVICE_ID, updated.deviceId, 365);
    CookieRepository.set(COOKIE_KEYS.DEVICE_NAME, updated.deviceName, 365);
    CookieRepository.set(COOKIE_KEYS.ROLE, updated.role, 365);
    CookieRepository.set(COOKIE_KEYS.USER_ID, updated.userId, 365);
    CookieRepository.set(COOKIE_KEYS.USER_NAME, updated.userName, 365);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.DEVICE_INFO, JSON.stringify(updated));
    } catch {}

    return updated;
  },

  /**
   * Registers/handshakes this device with the backend server
   */
  async handshake(override?: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const current = this.saveLocalDeviceInfo(override || {});
    try {
      const res = await fetch('/api/devices/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });

      if (res.ok) {
        const confirmed: DeviceInfo = await res.json();
        return this.saveLocalDeviceInfo(confirmed);
      }
    } catch (e) {
      console.warn('[DeviceManager] Handshake running offline', e);
    }
    return current;
  },

  /**
   * Sends heartbeat ping to server
   */
  async ping(): Promise<void> {
    const deviceId = this.getDeviceId();
    try {
      await fetch(`/api/devices/${encodeURIComponent(deviceId)}/ping`, { method: 'POST' });
    } catch {}
  },
};

// ==========================================
// 4. Real-Time Multi-Device Live Stream (SSE)
// ==========================================
export type RealtimeEventHandler = (event: string, payload: any) => void;

class RealtimeConnection {
  private eventSource: EventSource | null = null;
  private listeners: Set<RealtimeEventHandler> = new Set();
  private isConnected = false;
  private reconnectTimer: any = null;

  connect() {
    if (typeof window === 'undefined') return;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const deviceId = DeviceManager.getDeviceId();
    const role = DeviceManager.getDeviceRole();
    const url = `/api/realtime/stream?deviceId=${encodeURIComponent(deviceId)}&role=${encodeURIComponent(role)}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notify('connection_status', { connected: true, deviceId });
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notify('connection_status', { connected: false });
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      // Custom SSE Events
      const registerEvent = (name: string) => {
        this.eventSource?.addEventListener(name, (evt: MessageEvent) => {
          try {
            const data = JSON.parse(evt.data);
            this.notify(name, data);
          } catch {
            this.notify(name, evt.data);
          }
        });
      };

      registerEvent('contract_updated');
      registerEvent('qr_scanned');
      registerEvent('chat_message');
      registerEvent('devices_changed');
      registerEvent('opportunity_created');
      registerEvent('system_notice');
    } catch (e) {
      console.warn('[RealtimeConnection] EventSource init failed', e);
    }
  }

  subscribe(handler: RealtimeEventHandler): () => void {
    this.listeners.add(handler);
    if (!this.eventSource && typeof window !== 'undefined') {
      this.connect();
    }
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notify(event: string, payload: any) {
    this.listeners.forEach((fn) => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('[RealtimeConnection] Listener error:', err);
      }
    });
  }

  getIsConnected() {
    return this.isConnected;
  }
}

export const RealtimeHub = new RealtimeConnection();
