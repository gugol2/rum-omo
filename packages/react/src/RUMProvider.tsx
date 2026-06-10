import type { RUMConfig, RUMInstance, RUMMetric } from '@rum-omo/core';
import { createRUM } from '@rum-omo/core';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface RUMContextValue {
  metrics: RUMMetric[];
  instance: RUMInstance | null;
}

export const RUMContext = createContext<RUMContextValue>({
  metrics: [],
  instance: null,
});

interface RUMProviderProps {
  config: RUMConfig;
  children: React.ReactNode;
}

export function RUMProvider({ config, children }: RUMProviderProps) {
  const [metrics, setMetrics] = useState<RUMMetric[]>([]);
  const [instance, setInstance] = useState<RUMInstance | null>(null);

  useEffect(() => {
    const inst = createRUM({
      ...config,
      plugins: [
        ...(config.plugins ?? []),
        (metric) => setMetrics((prev) => [...prev, metric]),
      ],
    });
    setInstance(inst);
    inst.start();
    return () => inst.stop();
    // config is intentionally read once at mount — changes after mount are ignored
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RUMContext.Provider value={{ metrics, instance }}>
      {children}
    </RUMContext.Provider>
  );
}

export function useRUM(): RUMContextValue {
  return useContext(RUMContext);
}
