/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                sm: '2rem',
                lg: '4rem',
                xl: '5rem',
                '2xl': '6rem',
            },
            screens: {
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
                '2xl': '1536px',
            },
        },
        extend: {
            fontFamily: {
                sans: ['"Titillium Web"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                heading: ['Rajdhani', 'sans-serif']
            },
            colors: {
                // Brand Colors
                brand: {
                    dark: '#172625',    // Dark background color
                    primary: '#01C0C9', // Main teal
                    secondary: '#00FCB0', // Light teal/green
                    accent: '#1B3B3B',  // Dark teal accent
                },
                // Theme Colors
                background: {
                    DEFAULT: '#172625', // Main background
                    secondary: '#09181B', // Secondary background
                },
                foreground: {
                    DEFAULT: '#FFFFFF',
                    secondary: '#A1A1AA',
                },
                // UI Elements
                primary: {
                    DEFAULT: '#01C0C9',
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#00FCB0',
                    foreground: '#121B1B',
                },
                muted: {
                    DEFAULT: '#27353A',
                    foreground: '#A1A1AA',
                },
                accent: {
                    DEFAULT: '#1B3B3B',
                    foreground: '#FFFFFF',
                },
                destructive: {
                    DEFAULT: '#FF5555',
                    foreground: '#FFFFFF',
                },
                // Borders and inputs
                border: '#27353A',
                input: '#27353A',
                ring: {
                    DEFAULT: '#01C0C9',
                    focus: '#01C0C9',
                },
                // Chart colors
                chart: {
                    1: '#01C0C9', // Teal
                    2: '#00FCB0', // Light teal/green
                    3: '#39D8E1', // Light teal
                    4: '#172625', // Dark teal background
                    5: '#78C001', // Accent green
                },
            },
            borderRadius: {
                lg: "0.75rem",
                md: "0.5rem",
                sm: "0.25rem",
            },
        },
    },
    plugins: [animate],
};
