import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Einfache Background-Demo-Komponente
const BackgroundDemo = ({ stateIndex = 2 }: { stateIndex?: number }) => {
  const getBackgroundStyle = () => {
    switch (stateIndex) {
      case 0:
        return { background: '#000000' };
      case 1:
        return { 
          background: 'linear-gradient(135deg, #FF6A3A 0%, #E6452F 50%, #000000 100%)' 
        };
      case 2:
        return { 
          background: 'linear-gradient(135deg, #FFE7C2 0%, #FFB27A 25%, #FF6A3A 50%, #E6452F 75%, #0A0A0B 100%)' 
        };
      default:
        return { 
          background: 'linear-gradient(135deg, #FFE7C2 0%, #FFB27A 25%, #FF6A3A 50%, #E6452F 75%, #0A0A0B 100%)' 
        };
    }
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      style={getBackgroundStyle()}
    >
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold mb-2">
          Background State {stateIndex}
        </h2>
        <p className="text-gray-300">
          {stateIndex === 0 && 'Schwarzer Hintergrund'}
          {stateIndex === 1 && 'Profile State - Orange Gradient'}
          {stateIndex === 2 && 'Startseite State - Vollständiger Gradient'}
        </p>
      </div>
    </div>
  );
};

const meta: Meta<typeof BackgroundDemo> = {
  title: 'Layout/OrganicOrangeMorphBackground',
  component: BackgroundDemo,
  parameters: {
    docs: {
      description: {
        component: `
Das OrganicOrangeMorphBackground ist eine dynamische Hintergrund-Komponente mit 3 verschiedenen States:

## States
- **State 0**: Schwarzer Hintergrund (für Record, Audio Editor, Upload, Search, Player)
- **State 1**: Profile State - Keil mit großer Fläche (für Profile-Seiten)
- **State 2**: Startseite State - Zentrale Komposition (für Startseite)

## Features
- Automatische State-Änderung basierend auf der aktuellen Route
- Smooth Transitions zwischen den States
- Mobile-optimierte Performance
- Hardware-beschleunigte Animationen
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="relative w-full h-96 overflow-hidden rounded-lg">
        <Story />
      </div>
    )
  ],
  tags: ['autodocs'],
  argTypes: {
    stateIndex: {
      control: { type: 'select' },
      options: [0, 1, 2],
      description: 'Background State Index'
    }
  }
};

export default meta;
type Story = StoryObj<typeof BackgroundDemo>;

// Default Story
export const Default: Story = {
  args: {
    stateIndex: 2
  }
};

// State 0: Schwarzer Hintergrund
export const BlackBackground: Story = {
  args: {
    stateIndex: 0
  }
};

// State 1: Profile State
export const ProfileBackground: Story = {
  args: {
    stateIndex: 1
  }
};

// State 2: Startseite State
export const HomepageBackground: Story = {
  args: {
    stateIndex: 2
  }
};

// Interaktive Version
export const Interactive: Story = {
  args: {
    stateIndex: 2
  },
  decorators: [
    (Story) => (
      <div className="relative w-full h-96 overflow-hidden rounded-lg border border-gray-600">
        <Story />
      </div>
    )
  ]
};

// Alle States im Grid
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <div className="relative h-64 overflow-hidden rounded-lg">
        <BackgroundDemo stateIndex={0} />
      </div>
      <div className="relative h-64 overflow-hidden rounded-lg">
        <BackgroundDemo stateIndex={1} />
      </div>
      <div className="relative h-64 overflow-hidden rounded-lg">
        <BackgroundDemo stateIndex={2} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Übersicht aller 3 Background-States in einem Grid-Layout.'
      }
    }
  }
};