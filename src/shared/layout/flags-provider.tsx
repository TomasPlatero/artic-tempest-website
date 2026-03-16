"use client";

import React, { createContext, useContext } from 'react';

interface Flags {
  showBetaFeatures: boolean;
  enableRoster: boolean;
  enableCalendar: boolean;
  enableWishlist: boolean;
  enablePlanner: boolean;
  enableStatsLogs: boolean;
  enableWeeklyVault: boolean;
  enableEconomy: boolean;
}

const FlagsContext = createContext<Flags>({
  showBetaFeatures: false,
  enableRoster: true,
  enableCalendar: true,
  enableWishlist: true,
  enablePlanner: true,
  enableStatsLogs: true,
  enableWeeklyVault: true,
  enableEconomy: true,
});

export const useFlags = () => useContext(FlagsContext);

export function FlagsProvider({ 
  children, 
  flags 
}: { 
  children: React.ReactNode; 
  flags: Flags;
}) {
  return (
    <FlagsContext.Provider value={flags}>
      {children}
    </FlagsContext.Provider>
  );
}
