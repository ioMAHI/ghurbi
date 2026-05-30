const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect } from 'react';

import { getOutbox, removeFromOutbox } from '@/lib/offlineSync';
import { useQueryClient } from '@tanstack/react-query';

export default function OfflineSyncHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncOutbox = async () => {
      const outbox = getOutbox();
      if (!outbox.length) return;

      for (const item of outbox) {
        try {
          if (item.type === 'chat') {
            await db.entities.ChatMessage.create(item.data);
          } else if (item.type === 'expense') {
            await db.entities.Expense.create(item.data);
            if (item.tourId && item.addToTotal) {
              const tours = await db.entities.Tour.filter({ id: item.tourId });
              if (tours[0]) {
                await db.entities.Tour.update(item.tourId, {
                  total_cost: (tours[0].total_cost || 0) + item.addToTotal,
                });
              }
            }
          }
          removeFromOutbox(item._offlineId);
        } catch (e) {
          // Keep in outbox for retry
          console.error('Sync failed for item', item._offlineId, e);
        }
      }

      // Refresh queries
      queryClient.invalidateQueries();
    };

    const handleOnline = () => {
      syncOutbox();
    };

    window.addEventListener('online', handleOnline);

    // Also try sync on mount if online
    if (window.navigator.onLine) {
      syncOutbox();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [queryClient]);

  return null;
}