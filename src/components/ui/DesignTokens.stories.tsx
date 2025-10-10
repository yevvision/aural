import type { Meta, StoryObj } from '@storybook/react';
import { Heading, Text, Label } from './Typography';
import { Panel } from './glassmorphism';

const meta: Meta = {
  title: 'Design System/🎨 Design Tokens',
  parameters: {
    docs: {
      description: {
        component: `
# Design Tokens

Design Tokens sind die atomaren Bausteine des Aural Design Systems. Sie definieren alle visuellen Eigenschaften als wiederverwendbare Variablen.

## Verwendung
Alle Design Tokens sind als CSS Custom Properties und Tailwind-Klassen verfügbar.
        `
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj;

// Primäre Farben
export const PrimaryColors: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Primäres Farbschema (Orange-Red Gradient)</Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            name: 'Gradient Start',
            hex: '#FFE7C2',
            rgb: '255, 231, 194',
            hsl: '36°, 100%, 88%',
            cssVar: '--gradient-start',
            tailwind: 'gradient-start',
            bg: '#FFE7C2',
            textColor: '#000'
          },
          {
            name: 'Gradient Warm',
            hex: '#FFB27A',
            rgb: '255, 178, 122',
            hsl: '25°, 100%, 74%',
            cssVar: '--gradient-warm',
            tailwind: 'gradient-warm',
            bg: '#FFB27A',
            textColor: '#000'
          },
          {
            name: 'Gradient Strong',
            hex: '#FF6A3A',
            rgb: '255, 106, 58',
            hsl: '15°, 100%, 61%',
            cssVar: '--gradient-strong',
            tailwind: 'gradient-strong',
            bg: '#FF6A3A',
            textColor: '#fff'
          },
          {
            name: 'Gradient Deep',
            hex: '#E6452F',
            rgb: '230, 69, 47',
            hsl: '7°, 79%, 54%',
            cssVar: '--gradient-deep',
            tailwind: 'gradient-deep',
            bg: '#E6452F',
            textColor: '#fff'
          }
        ].map((color) => (
          <Panel 
            key={color.name}
            className="p-6"
            style={{ backgroundColor: color.bg }}
          >
            <Heading level={4} style={{ color: color.textColor }}>
              {color.name}
            </Heading>
            <div style={{ color: color.textColor === '#fff' ? '#fff' : '#666', fontSize: '0.875rem' }}>
              <div><strong>HEX:</strong> {color.hex}</div>
              <div><strong>RGB:</strong> {color.rgb}</div>
              <div><strong>HSL:</strong> {color.hsl}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <strong>CSS Variable:</strong> <code>{color.cssVar}</code>
              </div>
              <div><strong>Tailwind:</strong> <code>{color.tailwind}</code></div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Die Hauptfarben des Orange-Red Gradient Themes mit allen technischen Details.'
      }
    }
  }
};

// Surface-Farben
export const SurfaceColors: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Surface-Farben</Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Surface Primary',
            rgba: 'rgba(15, 15, 20, 0.85)',
            usage: 'Haupt-Panels',
            cssVar: '--surface-primary',
            tailwind: 'surface-primary'
          },
          {
            name: 'Surface Secondary',
            rgba: 'rgba(15, 15, 20, 0.75)',
            usage: 'Sekundäre Container',
            cssVar: '--surface-secondary',
            tailwind: 'surface-secondary'
          },
          {
            name: 'Surface Glass',
            rgba: 'rgba(255, 255, 255, 0.1)',
            usage: 'Glass-Oberflächen',
            cssVar: '--surface-glass',
            tailwind: 'surface-glass'
          }
        ].map((surface) => (
          <Panel 
            key={surface.name}
            className="p-6 border border-white/20"
            style={{ 
              backgroundColor: surface.rgba,
              backdropFilter: 'blur(20px)'
            }}
          >
            <Heading level={4} color="primary">
              {surface.name}
            </Heading>
            <div className="text-sm text-gray-300 space-y-1">
              <div><strong>RGBA:</strong> {surface.rgba}</div>
              <div><strong>Verwendung:</strong> {surface.usage}</div>
              <div><strong>CSS Variable:</strong> <code>{surface.cssVar}</code></div>
              <div><strong>Tailwind:</strong> <code>{surface.tailwind}</code></div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Surface-Farben für Glassmorphism-Effekte und Container.'
      }
    }
  }
};

// Text-Farben
export const TextColors: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Text-Farben</Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Text Primary',
            hex: '#FFFFFF',
            usage: 'Haupttext',
            cssVar: '--text-primary',
            example: 'Dies ist primärer Text'
          },
          {
            name: 'Text Secondary',
            hex: '#B0B0C0',
            usage: 'Sekundärtext',
            cssVar: '--text-secondary',
            example: 'Dies ist sekundärer Text'
          },
          {
            name: 'Text Tertiary',
            hex: '#707080',
            usage: 'Labels, Metadaten',
            cssVar: '--text-tertiary',
            example: 'Dies ist tertiärer Text'
          }
        ].map((textColor) => (
          <Panel 
            key={textColor.name}
            variant="primary"
            className="p-6"
          >
            <Heading level={4} style={{ color: textColor.hex }}>
              {textColor.name}
            </Heading>
            <div className="text-sm text-gray-300 space-y-2">
              <div><strong>HEX:</strong> {textColor.hex}</div>
              <div><strong>Verwendung:</strong> {textColor.usage}</div>
              <div><strong>CSS Variable:</strong> <code>{textColor.cssVar}</code></div>
              <div className="pt-2">
                <Text style={{ color: textColor.hex }}>
                  {textColor.example}
                </Text>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text-Farben für verschiedene Hierarchie-Ebenen.'
      }
    }
  }
};

// Spacing
export const SpacingTokens: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Spacing</Heading>
      <Text color="secondary">Alle Abstände folgen einem 4px-Raster für konsistente Layouts.</Text>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: '1', value: '4px', class: 'space-1' },
          { name: '2', value: '8px', class: 'space-2' },
          { name: '3', value: '12px', class: 'space-3' },
          { name: '4', value: '16px', class: 'space-4' },
          { name: '6', value: '24px', class: 'space-6' },
          { name: '8', value: '32px', class: 'space-8' },
          { name: '12', value: '48px', class: 'space-12' },
          { name: '16', value: '64px', class: 'space-16' }
        ].map(space => (
          <Panel 
            key={space.name}
            variant="secondary"
            className="p-4 text-center"
          >
            <Text weight="bold">{space.name}</Text>
            <Text variant="body-sm" color="secondary">{space.value}</Text>
            <Text variant="caption" color="accent">{space.class}</Text>
          </Panel>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spacing-Tokens für konsistente Abstände im gesamten System.'
      }
    }
  }
};

// Typography-Tokens
export const TypographyTokens: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Typography-Tokens</Heading>
      
      <div className="space-y-4">
        {[
          {
            name: 'Headline',
            size: '28px',
            weight: 'Bold',
            usage: 'Große Überschriften',
            cssClass: 'text-headline',
            example: 'Headline - 28px/Bold'
          },
          {
            name: 'Title',
            size: '24px',
            weight: 'Bold',
            usage: 'Seitentitel',
            cssClass: 'text-2xl font-bold',
            example: 'Title - 24px/Bold'
          },
          {
            name: 'Subtitle',
            size: '20px',
            weight: 'Semibold',
            usage: 'Untertitel',
            cssClass: 'text-xl font-semibold',
            example: 'Subtitle - 20px/Semibold'
          },
          {
            name: 'Body',
            size: '16px',
            weight: 'Medium',
            usage: 'Fließtext',
            cssClass: 'text-body',
            example: 'Body - 16px/Medium'
          },
          {
            name: 'Label',
            size: '12px',
            weight: 'Semibold',
            usage: 'Labels, Kategorien',
            cssClass: 'text-label',
            example: 'LABEL - 12PX/SEMIBOLD'
          }
        ].map((typo, index) => (
          <Panel 
            key={typo.name}
            variant="secondary"
            className="p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <Text 
                  style={{ 
                    fontSize: typo.size,
                    fontWeight: typo.weight.toLowerCase(),
                    textTransform: typo.name === 'Label' ? 'uppercase' : 'none',
                    letterSpacing: typo.name === 'Label' ? '0.1em' : 'normal'
                  }}
                >
                  {typo.example}
                </Text>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div><strong>Größe:</strong> {typo.size}</div>
                <div><strong>Gewicht:</strong> {typo.weight}</div>
                <div><strong>Verwendung:</strong> {typo.usage}</div>
                <div><strong>CSS:</strong> <code>{typo.cssClass}</code></div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography-Tokens mit Größen, Gewichtungen und Verwendungszwecken.'
      }
    }
  }
};

// Border Radius
export const BorderRadiusTokens: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Border Radius</Heading>
      <Text color="secondary">Konsistente Rundungen für harmonische Formen.</Text>
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { name: 'sm', value: '4px', size: '60px' },
          { name: 'md', value: '8px', size: '60px' },
          { name: 'lg', value: '12px', size: '60px' },
          { name: 'xl', value: '16px', size: '60px' },
          { name: '2xl', value: '20px', size: '60px' },
          { name: 'full', value: '50%', size: '60px' }
        ].map(radius => (
          <div key={radius.name} className="text-center">
            <div 
              className="mx-auto mb-2 bg-gradient-primary"
              style={{ 
                width: radius.size, 
                height: radius.size, 
                borderRadius: radius.value
              }}
            />
            <Text variant="body-sm" weight="bold">{radius.name}</Text>
            <Text variant="caption" color="secondary">{radius.value}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Border-Radius-Tokens für konsistente Rundungen.'
      }
    }
  }
};

// Schatten
export const ShadowTokens: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2}>Schatten-Tokens</Heading>
      <Text color="secondary">Glassmorphism-Schatten für Tiefenwirkung.</Text>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Primary Shadow',
            class: 'shadow-primary',
            css: '0 4px 12px rgba(230, 69, 47, 0.3)',
            style: { boxShadow: '0 4px 12px rgba(230, 69, 47, 0.3)' }
          },
          {
            name: 'Glass Shadow',
            class: 'shadow-glass',
            css: '0 12px 36px rgba(0, 0, 0, 0.45)',
            style: { boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)' }
          },
          {
            name: 'Voice Shadow',
            class: 'shadow-voice',
            css: '0 8px 24px rgba(230, 69, 47, 0.4)',
            style: { boxShadow: '0 8px 24px rgba(230, 69, 47, 0.4)' }
          }
        ].map((shadow) => (
          <Panel 
            key={shadow.name}
            variant="secondary"
            className="p-6 text-center"
            style={shadow.style}
          >
            <Heading level={4}>{shadow.name}</Heading>
            <div className="text-sm text-gray-300 space-y-1">
              <div><code>{shadow.class}</code></div>
              <div className="text-xs">{shadow.css}</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Schatten-Tokens für verschiedene UI-Elemente und Tiefenebenen.'
      }
    }
  }
};
