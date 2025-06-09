import { useEffect, useState } from "react";

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initialValue));
    }

    setValue(item ? JSON.parse(item) : initialValue);

    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;

      const lsi = localStorage.getItem(key);
      setValue(JSON.parse(lsi ?? ""));
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [initialValue, key]);

  const setValueWrap = (value: T) => {
    try {
      setValue(value);

      localStorage.setItem(key, JSON.stringify(value));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new StorageEvent("storage", { key }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return [value, setValueWrap];
};
