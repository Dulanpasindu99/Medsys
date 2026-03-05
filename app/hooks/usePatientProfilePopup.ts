import { useCallback, useState } from "react";

export function usePatientProfilePopup() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const openProfile = useCallback((profileId?: string | null) => {
    if (!profileId) return;
    setSelectedProfileId(profileId);
  }, []);

  const closeProfile = useCallback(() => {
    setSelectedProfileId(null);
  }, []);

  return {
    selectedProfileId,
    openProfile,
    closeProfile,
  };
}
