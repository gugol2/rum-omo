import { createRUM } from '@rum-omo/core';
import type { RUMConfig, RUMInstance, RUMMetric } from '@rum-omo/core';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface RUMContextValue {
  metrics: RUMMetric[];
  instance: RUMInstance | null;
}

export const RUMContext = createContext<RUMContextValue>({ metrics: [], instance: null });

interface RUMProviderProps {
  config: RUMConfig;
  children: React.ReactNode;
}

export function RUMProvider({ config, children }: RUMProviderProps) {
  const [metrics, setMetrics] = useState<RUMMetric[]>([]);
  const instanceRef = useRef<RUMInstance | null>(null);

  useEffect(() => {
    const instance = createRUM({
      ...config,
      plugins: [
        ...(config.plugins ?? []),
        (metric) => setMetrics((prev) => [...prev, metric]),
      ],
    });
    instanceRef.current = instance;
    instance.start();
    return () => instance.stop();
  // config is intentionally read once at mount — changes after mount are ignored
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RUMContext.Provider value={{ metrics, instance: instanceRef.current }}>
      {children}
    </RUMContext.Provider>
  );
}

export function useRUM(): RUMContextValue {
  return useContext(RUMContext);
}
