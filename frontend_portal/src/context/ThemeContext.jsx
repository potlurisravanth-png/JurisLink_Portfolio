import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Options: 'system', 'dark', 'light', 'high-contrast'
    const [theme, setTheme] = useState(() => localStorage.getItem('jurislink_theme') || 'system');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light', 'high-contrast');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
        localStorage.setItem('jurislink_theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
