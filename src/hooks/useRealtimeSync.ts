import { useEffect, useRef } from 'react';
import { getDeviceId } from '../utils/deviceStorage';

interface UseRealtimeSyncProps {
  onSync: () => void | Promise<void>;
  enabled?: boolean;
}

export function useRealtimeSync({ onSync, enabled = true }: UseRealtimeSyncProps) {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let fallbackTimer: any = null;
    const deviceId = getDeviceId();

    const connectSSE = () => {
      try {
        const url = `/api/events?deviceId=${encodeURIComponent(deviceId)}`;
        eventSource = new EventSource(url);

        eventSource.addEventListener('sync', (e) => {
          try {
            // Trigger refresh immediately
            onSyncRef.current();
          } catch (err) {
            console.error('Error handling SSE sync event', err);
          }
        });

        eventSource.addEventListener('message', () => {
          onSyncRef.current();
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Try reconnecting after 5 seconds
          setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn('Failed to initialize EventSource:', err);
      }
    };

    connectSSE();

    // Secondary fallback polling every 3.5 seconds
    fallbackTimer = setInterval(() => {
      onSyncRef.current();
    }, 3500);

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [enabled]);
}
