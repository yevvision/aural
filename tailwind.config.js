/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Orange-Red Gradient Colors
        'gradient': {
          'start': '#FFE7C2',    // Light apricot
          'warm': '#FFB27A',     // Warm orange
          'strong': '#FF6A3A',   // Strong orange
          'deep': '#E6452F',     // Deep red
          'fade': '#0A0A0B',     // Fade to black
        },
        
        // Surface Colors
        'surface': {
          'primary': 'rgba(15, 15, 20, 0.85)',
          'secondary': 'rgba(15, 15, 20, 0.75)',
          'glass': 'rgba(255, 255, 255, 0.1)',
          'glass-border': 'rgba(255, 255, 255, 0.2)',
        },
        
        // Text Colors
        'text': {
          'primary': '#FFFFFF',
          'secondary': '#B0B0C0',
          'tertiary': '#707080',
        },
        
        // Legacy compatibility
        'bg-primary': '#0A0A0B',
        'bg-secondary': '#1A1A1A',
        'accent-pink': '#FF006E',
        'accent-red': '#FF1744',
        'accent-violet': '#8338EC',
        'accent-turquoise': '#06FFA5',
        'accent-blue': '#3A86FF',
      },
      fontFamily: {
        'sans': ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Primary gradient variations
        'gradient-primary': 'linear-gradient(135deg, #FF6A3A, #E6452F)',
        'gradient-primary-hover': 'linear-gradient(135deg, #FF7A4A, #F6553F)',
        'gradient-full': 'linear-gradient(135deg, #FFE7C2 0%, #FFB27A 25%, #FF6A3A 50%, #E6452F 75%, #0A0A0B 100%)',
        
        // Legacy gradients
        'gradient-pink': 'linear-gradient(135deg, #FF006E, #8338EC)',
        'gradient-violet': 'linear-gradient(135deg, #8338EC, #FF006E)',
        'gradient-turquoise': 'linear-gradient(135deg, #06FFA5, #8338EC)',
        'gradient-neon': 'linear-gradient(135deg, #FF006E, #8338EC, #06FFA5)',
        'gradient-blue': 'linear-gradient(135deg, #3A86FF, #06FFA5)',
      },
      boxShadow: {
        // Design system shadows
        'glass': '0 12px 36px rgba(0, 0, 0, 0.45)',
        'glass-hover': '0 16px 48px rgba(0, 0, 0, 0.5)',
        'primary': '0 4px 12px rgba(230, 69, 47, 0.3)',
        'primary-hover': '0 6px 20px rgba(230, 69, 47, 0.4)',
        'voice': '0 8px 24px rgba(230, 69, 47, 0.4)',
        
        // Legacy shadows
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.6)',
        'neon-violet': '0 0 20px rgba(131, 56, 236, 0.6)',
        'neon-turquoise': '0 0 20px rgba(6, 255, 165, 0.6)',
        'glow-sm': '0 0 15px rgba(131, 56, 236, 0.4)',
        'glow-md': '0 0 20px rgba(255, 0, 110, 0.4)',
      },
      animation: {
        // Design system animations
        'breathe': 'breathe 8s ease-in-out infinite',
        'voice-pulse': 'voice-pulse 2s ease-in-out infinite',
        'button-press': 'button-press 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'particle-float': 'particle-float 4s ease-in-out infinite',
        
        // Legacy animations
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { 
            'background-position': '0% 50%',
            'filter': 'hue-rotate(0deg)'
          },
          '50%': { 
            'background-position': '100% 50%',
            'filter': 'hue-rotate(5deg)'
          }
        },
        'voice-pulse': {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.2)',
            opacity: '0.3'
          }
        },
        'button-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        },
        'particle-float': {
          '0%, 100%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: '0.3'
          },
          '50%': {
            transform: 'translateY(-20px) rotate(180deg)',
            opacity: '0.8'
          }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 0, 110, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 0, 110, 0.8), 0 0 30px rgba(131, 56, 236, 0.5)' }
        }
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      backdropBlur: {
        'xs': '2px',
        'strong': '20px',
        'light': '15px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}