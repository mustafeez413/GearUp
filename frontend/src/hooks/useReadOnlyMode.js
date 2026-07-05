'use client';

import { useAuth } from '@/context/AuthContext';
import { getReadOnlyActionMessage, getSuspensionReason, isUserReadOnly } from '@/lib/readOnlyMode';
import toast from 'react-hot-toast';

export function useReadOnlyMode() {
  const { user } = useAuth();
  const isReadOnlyMode = isUserReadOnly(user);
  const blockReason = getSuspensionReason(user);

  const guardAction = (action, message = getReadOnlyActionMessage()) => {
    if (!isReadOnlyMode) {
      if (typeof action === 'function') action();
      return true;
    }
    toast.error(message);
    return false;
  };

  return {
    isReadOnlyMode,
    blockReason,
    guardAction,
  };
}

export default useReadOnlyMode;
