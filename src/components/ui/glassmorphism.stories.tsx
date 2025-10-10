import type { Meta, StoryObj } from '@storybook/react';
import { Panel, Card, Container, GlassSurface, FloatingAction } from './glassmorphism';
import { Button } from './Button';
import { Heading, Text, Label } from './Typography';
import { Play, Heart, Share, Settings } from 'lucide-react';

const meta: Meta<typeof Panel> = {
  title: 'Design System/Glassmorphism',
  component: Panel,
  parameters: {
    docs: {
      description: {
        component: `
Das Glassmorphism-System des Aural Design Systems für moderne UI-Elemente.

## Komponenten
- **Panel**: Haupt-Container mit Glassmorphism-Effekt
- **Card**: Interaktive Karten für Content
- **Container**: Responsive Layout-Container
- **GlassSurface**: Flexible Glass-Oberflächen
- **FloatingAction**: Floating Action Elements

## Design-Prinzipien
- Semi-transparente Hintergründe
- Backdrop-Blur-Effekte
- Subtile Schatten und Borders
- Konsistente Rundungen
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'glass'],
      description: 'Panel-Variante'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Panel>;

// Panel-Varianten
export const PanelVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Panel-Varianten</Heading>
      
      <div className="space-y-4">
        <div>
          <Label color="secondary">PRIMARY PANEL</Label>
          <Panel variant="primary" className="p-6">
            <Heading level={3}>Primary Panel</Heading>
            <Text color="secondary">
              Haupt-Panel mit starkem Glassmorphism-Effekt für wichtige Inhalte.
            </Text>
          </Panel>
        </div>
        
        <div>
          <Label color="secondary">SECONDARY PANEL</Label>
          <Panel variant="secondary" className="p-6">
            <Heading level={3}>Secondary Panel</Heading>
            <Text color="secondary">
              Sekundäres Panel mit leichterem Glassmorphism-Effekt.
            </Text>
          </Panel>
        </div>
        
        <div>
          <Label color="secondary">GLASS PANEL</Label>
          <Panel variant="glass" className="p-6">
            <Heading level={3}>Glass Panel</Heading>
            <Text color="secondary">
              Reines Glass-Panel mit subtilen Effekten.
            </Text>
          </Panel>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Verschiedene Panel-Varianten mit unterschiedlichen Glassmorphism-Intensitäten.'
      }
    }
  }
};

// Card-Komponenten
export const CardExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Card-Komponenten</Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Standard Card */}
        <Card className="p-6">
          <Heading level={4}>Standard Card</Heading>
          <Text color="secondary" className="mt-2">
            Eine einfache Card ohne Interaktivität.
          </Text>
        </Card>
        
        {/* Interactive Card */}
        <Card interactive className="p-6">
          <Heading level={4}>Interactive Card</Heading>
          <Text color="secondary" className="mt-2">
            Eine interaktive Card mit Hover-Effekten.
          </Text>
          <div className="flex space-x-2 mt-4">
            <Button variant="glass" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </Card>
        
        {/* Audio Card Example */}
        <Card interactive className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <Heading level={5}>Audio-Titel</Heading>
              <Text color="secondary">von Künstler</Text>
            </div>
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </Card>
        
        {/* Settings Card */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-5 h-5 text-gradient-strong" />
            <Heading level={4}>Einstellungen</Heading>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Text>Benachrichtigungen</Text>
              <Button variant="glass" size="sm">Ein</Button>
            </div>
            <div className="flex justify-between items-center">
              <Text>Auto-Play</Text>
              <Button variant="ghost" size="sm">Aus</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Verschiedene Card-Beispiele für unterschiedliche Content-Typen.'
      }
    }
  }
};

// Container-Beispiele
export const ContainerExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Container-Komponenten</Heading>
      
      <div className="space-y-4">
        <div>
          <Label color="secondary">SMALL CONTAINER</Label>
          <Container size="sm" className="bg-surface-secondary/50 rounded-lg p-4">
            <Text>Small Container (max-width: 384px)</Text>
          </Container>
        </div>
        
        <div>
          <Label color="secondary">MEDIUM CONTAINER</Label>
          <Container size="md" className="bg-surface-secondary/50 rounded-lg p-4">
            <Text>Medium Container (max-width: 448px)</Text>
          </Container>
        </div>
        
        <div>
          <Label color="secondary">LARGE CONTAINER</Label>
          <Container size="lg" className="bg-surface-secondary/50 rounded-lg p-4">
            <Text>Large Container (max-width: 512px)</Text>
          </Container>
        </div>
        
        <div>
          <Label color="secondary">FULL WIDTH CONTAINER</Label>
          <Container size="full" className="bg-surface-secondary/50 rounded-lg p-4">
            <Text>Full Width Container (width: 100%)</Text>
          </Container>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive Container-Komponenten für verschiedene Layout-Anforderungen.'
      }
    }
  }
};

// Glass Surface
export const GlassSurfaceExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Glass Surface</Heading>
      
      <div className="space-y-4">
        <div>
          <Label color="secondary">LIGHT BLUR</Label>
          <GlassSurface blur="light" className="p-6">
            <Heading level={4}>Light Blur Surface</Heading>
            <Text color="secondary">
              Glass Surface mit leichtem Blur-Effekt für subtile Overlays.
            </Text>
          </GlassSurface>
        </div>
        
        <div>
          <Label color="secondary">STRONG BLUR</Label>
          <GlassSurface blur="strong" className="p-6">
            <Heading level={4}>Strong Blur Surface</Heading>
            <Text color="secondary">
              Glass Surface mit starkem Blur-Effekt für prominente Elemente.
            </Text>
          </GlassSurface>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Glass Surface mit verschiedenen Blur-Intensitäten.'
      }
    }
  }
};

// Floating Action
export const FloatingActionExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Floating Action Elements</Heading>
      
      <div className="relative h-64 border border-gray-600 rounded-lg overflow-hidden">
        <Text className="text-center mt-8 text-gray-400">
          Floating Actions erscheinen in verschiedenen Positionen
        </Text>
        
        <FloatingAction position="top-left">
          <Settings className="w-5 h-5" />
        </FloatingAction>
        
        <FloatingAction position="top-right">
          <Heart className="w-5 h-5" />
        </FloatingAction>
        
        <FloatingAction position="bottom-left">
          <Share className="w-5 h-5" />
        </FloatingAction>
        
        <FloatingAction position="bottom-right">
          <Play className="w-5 h-5" />
        </FloatingAction>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Floating Action Elements für schnelle Aktionen in verschiedenen Positionen.'
      }
    }
  }
};

// Komplexes Layout-Beispiel
export const ComplexLayoutExample: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Komplexes Layout-Beispiel</Heading>
      
      <Panel variant="primary" className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <Heading level={3} gradient>Dashboard</Heading>
            <Button variant="glass" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Einstellungen
            </Button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <Text variant="body-sm" color="secondary">Plays heute</Text>
              <Heading level={4} gradient>1,337</Heading>
            </Card>
            
            <Card className="p-4 text-center">
              <Text variant="body-sm" color="secondary">Neue Follower</Text>
              <Heading level={4} gradient>42</Heading>
            </Card>
            
            <Card className="p-4 text-center">
              <Text variant="body-sm" color="secondary">Uploads</Text>
              <Heading level={4} gradient>8</Heading>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <GlassSurface className="p-4">
            <Heading level={4} className="mb-4">Letzte Aktivität</Heading>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <Text>Audio Track {item}</Text>
                    <Text variant="body-sm" color="secondary">vor 2 Stunden</Text>
                  </div>
                </div>
              ))}
            </div>
          </GlassSurface>
        </div>
      </Panel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Komplexes Layout mit verschiedenen Glassmorphism-Komponenten für Dashboard-ähnliche Interfaces.'
      }
    }
  }
};
