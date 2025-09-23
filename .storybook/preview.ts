import type { Preview } from '@storybook/react-vite'
import React from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#000000',
        },
        {
          name: 'gradient',
          value: 'linear-gradient(135deg, #FFE7C2 0%, #FFB27A 25%, #FF6A3A 50%, #E6452F 75%, #0A0A0B 100%)',
        },
      ],
    },
  },
  decorators: [
    (Story) => React.createElement('div', { 
      style: { 
        fontFamily: 'Inter, Manrope, system-ui, sans-serif',
        color: '#FFFFFF',
        minHeight: '100vh',
        padding: '1rem'
      }
    }, React.createElement(Story)),
  ],
};

export default preview;