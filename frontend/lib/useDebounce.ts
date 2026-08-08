import { useEffect, useState } from "react";

/**
 * useDebounce — delay propagation of a frequently-changing value
 * (search input, filter select) until the user pauses typing.
 * Prevents firing an API request on every keystroke, reducing
 * spurts of requests that can trigger the 429 rate limiter.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;

