/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Semantic System (Mapped to CSS Variables)
                bg: {
                    app: 'var(--color-bg-app)',
                    surface: 'var(--color-bg-surface)',
                    subtle: 'var(--color-bg-subtle)',
                },
                glass: {
                    panel: 'var(--color-glass-panel)',
                    border: 'var(--color-glass-border)',
                    highlight: 'var(--color-glass-highlight)',
                },
                accent: {
                    primary: 'var(--color-accent-primary)',
                    glow: 'var(--color-accent-glow)',
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    muted: 'var(--color-text-muted)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'pulse-glow': 'pulseGlow 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' },
                    '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}
