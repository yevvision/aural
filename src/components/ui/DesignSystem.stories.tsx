import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Heading, Text, Label } from './Typography';
import { Panel, Card } from './glassmorphism';

const meta: Meta = {
  title: 'Design System/🎨 Übersicht',
  parameters: {
    docs: {
      description: {
        component: `
# Aural Design System

Das **Aural Design System** ist ein umfassendes UI-System mit Orange-Red Gradient Theme und Glassmorphism-Effekten für eine moderne, konsistente Benutzeroberfläche.

## 🎨 Design-Prinzipien

### Farbschema
Das Design-System basiert auf einem **Orange-Red Gradient** mit folgenden Hauptfarben:
- **Gradient Start**: #FFE7C2 (Light apricot)
- **Gradient Warm**: #FFB27A (Warm orange)  
- **Gradient Strong**: #FF6A3A (Strong orange)
- **Gradient Deep**: #E6452F (Deep red)

### Glassmorphism
- Semi-transparente Hintergründe mit Backdrop-Blur
- Subtile Schatten für Tiefenwirkung
- Konsistente Rundungen (8px, 12px, 16px)
- Floating Panels über Gradient-Hintergrund

### Typography
- **Schriftart**: Inter / Manrope mit System-Fallback
- **Hierarchie**: 6 definierte Größen (Headline → Caption)
- **Gewichtung**: Light → Bold mit Medium als Standard
- **Farben**: Primary (Weiß), Secondary (Hellgrau), Tertiary (Grau)
        `
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj;

// Farbpalette
export const ColorPalette: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Farbpalette</Heading>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div 
            className="w-full h-20 rounded-lg mb-2"
            style={{ background: 'linear-gradient(135deg, #FFE7C2, #FFB27A)' }}
          />
          <Text variant="body-sm" weight="bold">Gradient Start</Text>
          <Text variant="caption" color="secondary">#FFE7C2</Text>
        </div>
        
        <div className="text-center">
          <div 
            className="w-full h-20 rounded-lg mb-2"
            style={{ background: 'linear-gradient(135deg, #FFB27A, #FF6A3A)' }}
          />
          <Text variant="body-sm" weight="bold">Gradient Warm</Text>
          <Text variant="caption" color="secondary">#FFB27A</Text>
        </div>
        
        <div className="text-center">
          <div 
            className="w-full h-20 rounded-lg mb-2"
            style={{ background: 'linear-gradient(135deg, #FF6A3A, #E6452F)' }}
          />
          <Text variant="body-sm" weight="bold">Gradient Strong</Text>
          <Text variant="caption" color="secondary">#FF6A3A</Text>
        </div>
        
        <div className="text-center">
          <div 
            className="w-full h-20 rounded-lg mb-2"
            style={{ background: 'linear-gradient(135deg, #E6452F, #0A0A0B)' }}
          />
          <Text variant="body-sm" weight="bold">Gradient Deep</Text>
          <Text variant="caption" color="secondary">#E6452F</Text>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Die Hauptfarben des Orange-Red Gradient Themes.'
      }
    }
  }
};

// Komponenten-Übersicht
export const ComponentOverview: Story = {
  render: () => (
    <div className="space-y-8">
      <Heading level={2}>Komponenten-Übersicht</Heading>
      
      {/* Button-System */}
      <div className="space-y-4">
        <Heading level={3}>Button-System</Heading>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="glass">Glass</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <Text color="secondary">
          Verschiedene Button-Varianten für unterschiedliche Aktionen und Hierarchien.
        </Text>
      </div>
      
      {/* Typography */}
      <div className="space-y-4">
        <Heading level={3}>Typography-System</Heading>
        <div className="space-y-2">
          <Heading level={1}>H1 - Hauptüberschrift</Heading>
          <Heading level={2}>H2 - Sekundäre Überschrift</Heading>
          <Text variant="body">Body - Fließtext für längere Inhalte</Text>
          <Label>LABEL - KATEGORIEN UND METADATEN</Label>
        </div>
      </div>
      
      {/* Glassmorphism */}
      <div className="space-y-4">
        <Heading level={3}>Glassmorphism-Komponenten</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel variant="primary" className="p-4">
            <Heading level={4}>Panel</Heading>
            <Text color="secondary">Haupt-Container mit Glassmorphism</Text>
          </Panel>
          <Card className="p-4">
            <Heading level={4}>Card</Heading>
            <Text color="secondary">Interaktive Content-Container</Text>
          </Card>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Übersicht der wichtigsten UI-Komponenten des Design-Systems.'
      }
    }
  }
};

// Verwendungsrichtlinien
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8">
      <Heading level={2}>Verwendungsrichtlinien</Heading>
      
      <div className="space-y-6">
        {/* Button-Auswahl */}
        <div className="space-y-3">
          <Heading level={4} color="accent">✅ Button-Auswahl - Richtig</Heading>
          <Panel variant="glass" className="p-4">
            <div className="space-y-3">
              <Text>Nur ein Primary-Button pro Abschnitt:</Text>
              <div className="flex space-x-3">
                <Button variant="primary">Registrieren</Button>
                <Button variant="glass">Mehr erfahren</Button>
              </div>
            </div>
          </Panel>
        </div>
        
        <div className="space-y-3">
          <Heading level={4} color="tertiary">❌ Button-Auswahl - Falsch</Heading>
          <Panel variant="secondary" className="p-4">
            <div className="space-y-3">
              <Text>Mehrere Primary-Buttons verwirren:</Text>
              <div className="flex space-x-3">
                <Button variant="primary">Button 1</Button>
                <Button variant="primary">Button 2</Button>
              </div>
            </div>
          </Panel>
        </div>
        
        {/* Typography-Hierarchie */}
        <div className="space-y-3">
          <Heading level={4} color="accent">✅ Typography-Hierarchie - Richtig</Heading>
          <Panel variant="glass" className="p-4">
            <div className="space-y-2">
              <Heading level={1}>Seitentitel</Heading>
              <Heading level={2}>Abschnittstitel</Heading>
              <Text variant="body">Fließtext mit klarer Hierarchie</Text>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Richtlinien für die korrekte Verwendung der Design-System-Komponenten.'
      }
    }
  }
};

// Import-Beispiele
export const ImportExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Entwicklung</Heading>
      
      <div className="space-y-4">
        <div>
          <Label color="secondary">IMPORT</Label>
          <Panel variant="secondary" className="p-4">
            <Text variant="body-sm" className="font-mono">
              {`import { 
  Button, 
  VoiceButton, 
  Heading, 
  Text, 
  Panel, 
  Card 
} from '@/components/ui';`}
            </Text>
          </Panel>
        </div>
        
        <div>
          <Label color="secondary">VERWENDUNG</Label>
          <Panel variant="secondary" className="p-4">
            <Text variant="body-sm" className="font-mono">
              {`<Panel variant="primary">
  <Heading level={2} gradient>Titel</Heading>
  <Text color="secondary">Content</Text>
  <Button variant="primary">Action</Button>
</Panel>`}
            </Text>
          </Panel>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Code-Beispiele für die Verwendung der Design-System-Komponenten.'
      }
    }
  }
};
