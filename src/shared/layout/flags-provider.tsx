"use client";

import React, { createContext, useContext } from 'react';

interface Flags {
  showBetaFeatures: boolean;
}

const FlagsContext = createContext<Flags>({
  showBetaFeatures: false,
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
