import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tag, TagGroup, SelectableTag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Design System/Tag',
  component: Tag,
  parameters: {
    docs: {
      description: {
        component: `
Tag-Komponenten für selektierbare Elemente wie Kategorien, Filter und Labels.
Unterscheiden sich visuell von Buttons durch kleinere Größe und subtilere Gestaltung.

## Verwendung
- **Ausgegraut** im Standard-Zustand  
- **Orange** wenn ausgewählt
- **Kleiner** als normale Buttons
- **Für selektierbare Elemente** wie Tags, Filter, Kategorien

## Unterschied zu Buttons
- Schmaler/niedriger als Buttons
- Subtilere Farben
- Für Auswahl/Markierung statt Aktionen
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'selected', 'disabled'],
      description: 'Tag-Zustand'
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Tag-Größe (kleiner als Button-Größen)'
    },
    selected: {
      control: 'boolean',
      description: 'Ausgewählt-Status'
    },
    disabled: {
      control: 'boolean',
      description: 'Deaktiviert-Status'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Tag>;

// Basis Tag
export const Default: Story = {
  args: {
    children: 'Tag',
    size: 'md'
  }
};

export const Selected: Story = {
  args: {
    children: 'Selected Tag',
    selected: true,
    size: 'md'
  }
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Tag',
    disabled: true,
    size: 'md'
  }
};

// Größen
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Tag-Größen</h3>
      <div className="flex items-center space-x-3">
        <Tag size="sm">Small Tag</Tag>
        <Tag size="md">Medium Tag</Tag>
      </div>
      
      <h4 className="text-md font-semibold text-white mt-6">Ausgewählte Tags</h4>
      <div className="flex items-center space-x-3">
        <Tag size="sm" selected>Small Selected</Tag>
        <Tag size="md" selected>Medium Selected</Tag>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Verfügbare Tag-Größen. Alle Größen sind kleiner als entsprechende Button-Größen.'
      }
    }
  }
};

// Status-Vergleich
export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Tag-Zustände</h3>
      <div className="flex items-center space-x-3">
        <Tag>Default</Tag>
        <Tag selected>Selected</Tag>
        <Tag disabled>Disabled</Tag>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Die drei Haupt-Zustände von Tags: Standard (ausgegraut), Ausgewählt (orange), Deaktiviert.'
      }
    }
  }
};

// Interaktive Tags
export const InteractiveTags: Story = {
  render: () => {
    const [selectedTags, setSelectedTags] = useState<string[]>(['Female']);
    const [selectedGender, setSelectedGender] = useState<string[]>(['Female']);
    
    const predefinedTags = ['Soft', 'Female', 'Toy', 'Passionate', 'Moan'];
    const genderOptions = ['Female', 'Male', 'Couple', 'Diverse'];
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Multi-Selection Tags</h3>
          <p className="text-sm text-gray-400 mb-3">Mehrere Tags können ausgewählt werden</p>
          <div className="flex flex-wrap gap-2">
            {predefinedTags.map((tag) => (
              <SelectableTag
                key={tag}
                value={tag}
                selectedValues={selectedTags}
                onSelectionChange={setSelectedTags}
                size="md"
              >
                {tag}
              </SelectableTag>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ausgewählt: {selectedTags.length > 0 ? selectedTags.join(', ') : 'Keine'}
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Single-Selection Tags</h3>
          <p className="text-sm text-gray-400 mb-3">Nur ein Tag kann ausgewählt werden</p>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => (
              <SelectableTag
                key={option}
                value={option}
                selectedValues={selectedGender}
                onSelectionChange={(values) => {
                  // Single selection logic
                  setSelectedGender(values.slice(-1));
                }}
                size="md"
              >
                {option}
              </SelectableTag>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ausgewählt: {selectedGender.length > 0 ? selectedGender[0] : 'Keine'}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interaktive Tags mit Multi- und Single-Selection Beispielen, wie sie in der Upload-Seite verwendet werden.'
      }
    }
  }
};

// Tag-Gruppen
export const TagGroups: Story = {
  render: () => (
    <div className="space-y-6">
      <TagGroup label="Kategorien">
        <Tag>Musik</Tag>
        <Tag selected>Podcast</Tag>
        <Tag>Hörbuch</Tag>
      </TagGroup>
      
      <TagGroup label="Tags" orientation="horizontal">
        <Tag size="sm">Entspannung</Tag>
        <Tag size="sm" selected>Meditation</Tag>
        <Tag size="sm">Natur</Tag>
        <Tag size="sm">Regen</Tag>
      </TagGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TagGroup-Komponente zur Organisation von verwandten Tags.'
      }
    }
  }
};

// Vergleich: Tags vs Buttons
export const TagsVsButtons: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Tags (für Auswahl/Markierung)</h3>
        <div className="flex flex-wrap gap-2">
          <Tag>Standard Tag</Tag>
          <Tag selected>Ausgewählter Tag</Tag>
          <Tag size="sm">Kleiner Tag</Tag>
          <Tag size="sm" selected>Kleiner ausgewählter Tag</Tag>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Buttons (für Aktionen)</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-6 py-3 text-base rounded-full min-h-[44px] bg-gradient-primary text-white font-semibold">
            Button Medium
          </button>
          <button className="px-3 py-2 text-sm rounded-full min-h-[36px] bg-gradient-primary text-white font-semibold">
            Button Small  
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-400">
        <p><strong>Tags:</strong> Schmaler, subtiler, für Auswahl/Markierung</p>
        <p><strong>Buttons:</strong> Größer, prominenter, für Aktionen</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visueller Vergleich zwischen Tags und Buttons zur Verdeutlichung der Unterschiede.'
      }
    }
  }
};

// Upload-Seite Simulation
export const UploadPageExample: Story = {
  render: () => {
    const [selectedGender, setSelectedGender] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>(['Female']);
    
    const genderOptions = ['Female', 'Male', 'Couple', 'Diverse'];
    const predefinedTags = ['Soft', 'Female', 'Toy', 'Passionate', 'Moan'];
    
    return (
      <div className="space-y-6 max-w-md">
        <h3 className="text-lg font-bold text-white">Upload-Seite Beispiel</h3>
        
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Who is on the recording?
          </label>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => (
              <SelectableTag
                key={option}
                value={option}
                selectedValues={selectedGender}
                onSelectionChange={(values) => {
                  setSelectedGender(values.slice(-1)); // Single selection
                }}
                size="md"
              >
                {option}
              </SelectableTag>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Add tags to your recording
          </label>
          <div className="flex flex-wrap gap-2">
            {predefinedTags.map((tag) => (
              <SelectableTag
                key={tag}
                value={tag}
                selectedValues={selectedTags}
                onSelectionChange={setSelectedTags}
                size="md"
              >
                {tag}
              </SelectableTag>
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulation der Upload-Seite mit den neuen Tag-Komponenten anstatt Button-ähnlicher Elemente.'
      }
    }
  }
};
