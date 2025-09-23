import type { Meta, StoryObj } from '@storybook/react';
import { 
  Text, 
  Heading, 
  Headline, 
  Title, 
  Subtitle, 
  Body, 
  Label, 
  Caption, 
  GradientText, 
  AnimatedCounter, 
  Quote, 
  TypewriterText 
} from './Typography';

const meta: Meta<typeof Text> = {
  title: 'Design System/Typography',
  component: Text,
  parameters: {
    docs: {
      description: {
        component: `
Das Typography-System des Aural Design Systems mit konsistenter Hierarchie.

## Typography-Hierarchie
- **Headline**: 28px, bold, tight spacing - für große Überschriften
- **Title**: 24px, bold - für Seitentitel
- **Subtitle**: 20px, semibold - für Untertitel
- **Body**: 16px, medium - für Fließtext
- **Label**: 12px, uppercase, wide tracking - für Labels
- **Caption**: 12px, medium - für Bildunterschriften

## Farben
- **Primary**: Haupttext (Weiß)
- **Secondary**: Sekundärtext (Hellgrau)
- **Tertiary**: Tertiärtext (Grau)
- **Gradient**: Orange-Red Gradient für Akzente
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['headline', 'title', 'subtitle', 'body', 'body-lg', 'body-sm', 'label', 'caption'],
      description: 'Text-Variante entsprechend der Typography-Hierarchie'
    },
    weight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
      description: 'Schriftgewicht'
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'accent', 'gradient'],
      description: 'Textfarbe entsprechend dem Design-System'
    },
    gradient: {
      control: 'boolean',
      description: 'Gradient-Effekt aktivieren'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Text>;

// Typography-Hierarchie Übersicht
export const TypographyHierarchy: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Typography-Hierarchie</h2>
      
      <div className="space-y-4">
        <div>
          <Label color="secondary">HEADLINE</Label>
          <Headline>Das ist eine Headline (28px, bold)</Headline>
        </div>
        
        <div>
          <Label color="secondary">TITLE</Label>
          <Title>Das ist ein Titel (24px, bold)</Title>
        </div>
        
        <div>
          <Label color="secondary">SUBTITLE</Label>
          <Subtitle>Das ist ein Untertitel (20px, semibold)</Subtitle>
        </div>
        
        <div>
          <Label color="secondary">BODY</Label>
          <Body>Das ist der Body-Text (16px, medium) für längere Texte und Beschreibungen.</Body>
        </div>
        
        <div>
          <Label color="secondary">BODY LARGE</Label>
          <Text variant="body-lg">Das ist großer Body-Text (18px, medium) für wichtigere Inhalte.</Text>
        </div>
        
        <div>
          <Label color="secondary">BODY SMALL</Label>
          <Text variant="body-sm">Das ist kleiner Body-Text (14px, medium) für weniger wichtige Inhalte.</Text>
        </div>
        
        <div>
          <Label color="secondary">LABEL</Label>
          <Label>DAS IST EIN LABEL (12PX, UPPERCASE)</Label>
        </div>
        
        <div>
          <Label color="secondary">CAPTION</Label>
          <Caption>Das ist eine Caption (12px, medium) für Bildunterschriften</Caption>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Komplette Typography-Hierarchie des Design-Systems für konsistente Textgestaltung.'
      }
    }
  }
};

// Heading-Komponenten
export const Headings: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">Heading-Komponenten</h2>
      
      <Heading level={1}>H1 - Hauptüberschrift</Heading>
      <Heading level={2}>H2 - Sekundäre Überschrift</Heading>
      <Heading level={3}>H3 - Tertiäre Überschrift</Heading>
      <Heading level={4}>H4 - Quaternäre Überschrift</Heading>
      <Heading level={5}>H5 - Fünfte Überschrift</Heading>
      <Heading level={6}>H6 - Sechste Überschrift</Heading>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alle verfügbaren Heading-Level (H1-H6) mit konsistenter Größe und Gewichtung.'
      }
    }
  }
};

// Textfarben
export const TextColors: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">Textfarben</h2>
      
      <div className="space-y-3">
        <Text color="primary">Primary Text - Haupttext (Weiß)</Text>
        <Text color="secondary">Secondary Text - Sekundärtext (Hellgrau)</Text>
        <Text color="tertiary">Tertiary Text - Tertiärtext (Grau)</Text>
        <Text color="accent">Accent Text - Akzentfarbe (Orange)</Text>
        <Text color="gradient">Gradient Text - Gradient-Effekt</Text>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alle verfügbaren Textfarben des Design-Systems für verschiedene Hierarchien.'
      }
    }
  }
};

// Schriftgewichte
export const FontWeights: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">Schriftgewichte</h2>
      
      <div className="space-y-3">
        <Text weight="light">Light Weight - Leichtes Schriftgewicht</Text>
        <Text weight="normal">Normal Weight - Normales Schriftgewicht</Text>
        <Text weight="medium">Medium Weight - Mittleres Schriftgewicht</Text>
        <Text weight="semibold">Semibold Weight - Halbfettes Schriftgewicht</Text>
        <Text weight="bold">Bold Weight - Fettes Schriftgewicht</Text>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alle verfügbaren Schriftgewichte für verschiedene Betonungen.'
      }
    }
  }
};

// Gradient Text
export const GradientTextExample: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">Gradient Text</h2>
      
      <div className="space-y-4">
        <GradientText variant="headline">
          Gradient Headline
        </GradientText>
        
        <GradientText variant="title">
          Gradient Title
        </GradientText>
        
        <GradientText 
          variant="body"
          from="#FF6A3A"
          to="#E6452F"
        >
          Custom Gradient Body Text
        </GradientText>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gradient-Text mit dem Orange-Red Gradient des Design-Systems.'
      }
    }
  }
};

// Animierte Komponenten
export const AnimatedComponents: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Animierte Typography</h2>
      
      <div className="space-y-4">
        <div>
          <Label color="secondary">ANIMATED COUNTER</Label>
          <div className="flex space-x-6">
            <AnimatedCounter value={1337} suffix=" Plays" className="text-2xl font-bold text-white" />
            <AnimatedCounter value={42} prefix="€ " className="text-2xl font-bold text-gradient-primary" />
            <AnimatedCounter value={95} suffix="%" className="text-2xl font-bold text-gradient-strong" />
          </div>
        </div>
        
        <div>
          <Label color="secondary">TYPEWRITER EFFECT</Label>
          <TypewriterText 
            text="Willkommen bei Aural - deiner Audio-Plattform"
            variant="title"
            speed={100}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Animierte Typography-Komponenten für dynamische Inhalte.'
      }
    }
  }
};

// Quote Komponente
export const QuoteExample: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">Quote Komponente</h2>
      
      <Quote author="Aural Team">
        Design-Systeme schaffen Konsistenz und beschleunigen die Entwicklung erheblich.
      </Quote>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Quote-Komponente mit Glassmorphism-Effekt für Zitate und Testimonials.'
      }
    }
  }
};

// Responsive Typography
export const ResponsiveTypography: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Responsive Typography</h2>
      
      <div className="space-y-4">
        <Heading level={1}>Responsive H1 - passt sich der Bildschirmgröße an</Heading>
        <Heading level={2}>Responsive H2 - optimiert für mobile und desktop</Heading>
        <Body>
          Responsive Body-Text, der auf verschiedenen Bildschirmgrößen gut lesbar bleibt 
          und sich automatisch an die verfügbare Breite anpasst.
        </Body>
      </div>
      
      <div className="text-sm text-gray-400">
        💡 Tipp: Verwende die Viewport-Controls in Storybook, um die Responsive-Verhalten zu testen.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography passt sich automatisch verschiedenen Bildschirmgrößen an.'
      }
    }
  }
};

// Beispiel-Text für verschiedene Anwendungsfälle
export const UsageExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white mb-6">Anwendungsbeispiele</h2>
      
      {/* Artikel-Header */}
      <div className="space-y-2">
        <Label color="secondary">ARTIKEL-HEADER</Label>
        <Heading level={1} gradient>Neue Audio-Features verfügbar</Heading>
        <Text color="secondary">Veröffentlicht am 21. September 2024</Text>
      </div>
      
      {/* Card-Content */}
      <div className="space-y-2">
        <Label color="secondary">CARD-CONTENT</Label>
        <Title>Audio-Titel</Title>
        <Text color="secondary">von Künstler Name</Text>
        <Caption>2:34 Min • 1.2k Plays</Caption>
      </div>
      
      {/* Navigation */}
      <div className="space-y-2">
        <Label color="secondary">NAVIGATION</Label>
        <div className="flex space-x-6">
          <Text variant="body">Home</Text>
          <Text variant="body" color="accent">Discover</Text>
          <Text variant="body">Profile</Text>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Praktische Anwendungsbeispiele der Typography in verschiedenen UI-Kontexten.'
      }
    }
  }
};
