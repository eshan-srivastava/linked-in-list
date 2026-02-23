/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{html,ts,js}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Define semantic colors for easier theming later
                background: 'var(--color-background)',
                surface: 'var(--color-surface)',
                text: 'var(--color-text)',
            }
        },
    },
    plugins: [],
}