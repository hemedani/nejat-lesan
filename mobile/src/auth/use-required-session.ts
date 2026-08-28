import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import type { Session } from '@/domain/types';

import { createSessionService } from './session-service';

const sessionService = createSessionService();

export function useRequiredSession(): Session | null {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;
    sessionService.restore().then(restoredSession => {
      if (!mounted) {
        return;
      }
      if (restoredSession) {
        setSession(restoredSession);
      } else {
        router.replace('/login');
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  return session;
}
