import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Play, Heart, Share, Download, Mic } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
Das Button-System des Aural Design Systems mit Orange-Red Gradient Theme.

## Verwendung
Alle Buttons folgen dem einheitlichen Design-System und sollten für konsistente Interaktionen verwendet werden.

## Varianten
- **Primary**: Hauptaktion (Orange-Red Gradient)
- **Glass**: Glassmorphism-Effekt 
- **Voice**: Spezielle Voice-Aktionen mit Pulse-Effekt
- **Secondary**: Sekundäre Aktionen
- **Outline**: Outline-Style
- **Ghost**: Transparente Buttons
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'glass', 'voice', 'secondary', 'outline', 'ghost', 'orange-fill'],
      description: 'Button-Variante entsprechend dem Design-System'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Button-Größe entsprechend dem Design-System'
    },
    disabled: {
      control: 'boolean',
      description: 'Deaktivierter Zustand'
    },
    loading: {
      control: 'boolean',
      description: 'Loading-Zustand mit Spinner'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Volle Breite des Containers'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Button>;

// Einzelne Button-Varianten
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
};

// Button-Größen
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button variant="primary" size="xl">Extra Large</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alle verfügbaren Button-Größen von klein bis extra groß.'
      }
    }
  }
};

// Alle Varianten Übersicht
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Alle Button-Varianten</h3>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="glass">Glass</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="orange-fill">Orange Fill</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Übersicht aller verfügbaren Button-Varianten für Konsistenz im Design.'
      }
    }
  }
};

// Button-Zustände
export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Button-Zustände</h3>
      <div className="space-x-4">
        <Button variant="primary">Normal</Button>
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="primary" loading>Loading</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Verschiedene Button-Zustände: Normal, Disabled und Loading.'
      }
    }
  }
};

// Voice Button Stories
export const VoiceButtonExample: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Voice Buttons</h3>
      <div className="flex items-center space-x-6">
        <VoiceButton size="md">
          <Mic className="w-6 h-6" />
        </VoiceButton>
        <VoiceButton size="lg" pulsing>
          <Mic className="w-8 h-8" />
        </VoiceButton>
        <VoiceButton size="xl">
          <Mic className="w-10 h-10" />
        </VoiceButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spezielle Voice-Buttons mit optionalem Pulse-Effekt für Audio-Interaktionen.'
      }
    }
  }
};

// Icon Button Stories
export const IconButtons: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Icon Buttons</h3>
      <div className="flex items-center space-x-4">
        <Button 
          size="icon"
          aria-label="Play"
          variant="default"
        >
          <Play className="w-4 h-4" />
        </Button>
        <Button 
          size="icon"
          aria-label="Like"
          variant="secondary"
        >
          <Heart className="w-4 h-4" />
        </Button>
        <Button 
          size="icon"
          aria-label="Share"
          variant="outline"
        >
          <Share className="w-4 h-4" />
        </Button>
        <Button 
          size="icon"
          aria-label="Download"
          variant="outline"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-Buttons für spezifische Aktionen mit verschiedenen Varianten.'
      }
    }
  }
};

// Button Group Stories
export const ButtonGroups: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Button Groups</h3>
      
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Horizontal</h4>
        <ButtonGroup orientation="horizontal">
          <Button variant="outline">Previous</Button>
          <Button variant="primary">Current</Button>
          <Button variant="outline">Next</Button>
        </ButtonGroup>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Vertical</h4>
        <ButtonGroup orientation="vertical">
          <Button variant="glass">Option 1</Button>
          <Button variant="glass">Option 2</Button>
          <Button variant="glass">Option 3</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button-Gruppen für zusammengehörige Aktionen in horizontaler oder vertikaler Anordnung.'
      }
    }
  }
};

// Floating Action Button
export const FloatingActionButtons: Story = {
  render: () => (
    <div className="relative h-64 border border-gray-600 rounded-lg overflow-hidden">
      <p className="text-center text-gray-400 mt-8">
        Floating Action Buttons erscheinen in den Ecken
      </p>
      <FloatingActionButton position="bottom-right">
        <Mic className="w-6 h-6" />
      </FloatingActionButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Floating Action Buttons für primäre Aktionen, die immer zugänglich sein sollen.'
      }
    }
  }
};
