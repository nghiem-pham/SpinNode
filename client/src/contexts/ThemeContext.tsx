import { createContext, useContext, useEffect, type ReactNode } from 'react';

const ThemeContext = createContext({});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Remove any previously stored dark mode preference and ensure light mode
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
  }, []);

  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
