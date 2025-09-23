import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toggle, BinaryToggle, MultiToggle } from './Toggle';
import { cn } from '../../utils';

const meta: Meta<typeof Toggle> = {
  title: 'Design System/Toggle',
  component: Toggle,
  parameters: {
    docs: {
      description: {
        component: `
Toggle-Komponenten für binäre Zustände und segmentierte Kontrollen.
Unterscheiden sich von Buttons (Aktionen) und Tags (Auswahl).

## Verwendung
- **An/Aus-Zustände** (aktiv/inaktiv)
- **Segmentierte Kontrollen** (nur eine Option aktiv)
- **Filter-Toggles** (verschiedene Ansichten)
- **Einstellungen** (ein/ausschalten)

## Unterschied zu anderen Komponenten
- **Buttons**: Für Aktionen (einmalige Klicks)
- **Tags**: Für Auswahl/Markierung (mehrere gleichzeitig)
- **Toggles**: Für Zustandswechsel (an/aus, zwischen Optionen)
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'pill', 'segmented'],
      description: 'Toggle-Stil'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Toggle-Größe'
    },
    active: {
      control: 'boolean',
      description: 'Aktiv-Zustand'
    },
    disabled: {
      control: 'boolean',
      description: 'Deaktiviert-Zustand'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Toggle>;

// Basis Toggle
export const Default: Story = {
  args: {
    children: 'Toggle',
    active: false
  }
};

export const Active: Story = {
  args: {
    children: 'Active Toggle',
    active: true
  }
};

// Toggle-Varianten
export const Variants: Story = {
  render: () => {
    const [states, setStates] = useState({
      default: false,
      pill: true,
      segmented: false
    });

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Toggle-Varianten</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Toggle
              variant="default"
              active={states.default}
              onToggle={(active) => setStates(prev => ({ ...prev, default: active }))}
            >
              Default Toggle
            </Toggle>
            <span className="text-sm text-gray-400">
              Status: {states.default ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Toggle
              variant="pill"
              active={states.pill}
              onToggle={(active) => setStates(prev => ({ ...prev, pill: active }))}
            >
              Pill Toggle
            </Toggle>
            <span className="text-sm text-gray-400">
              Status: {states.pill ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Toggle
              variant="segmented"
              active={states.segmented}
              onToggle={(active) => setStates(prev => ({ ...prev, segmented: active }))}
            >
              Segmented Toggle
            </Toggle>
            <span className="text-sm text-gray-400">
              Status: {states.segmented ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Verschiedene Toggle-Varianten für unterschiedliche Anwendungsfälle.'
      }
    }
  }
};

// Toggle-Größen
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white">Toggle-Größen</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Toggle size="sm" active>Small Toggle</Toggle>
          <Toggle size="md" active>Medium Toggle</Toggle>
          <Toggle size="lg" active>Large Toggle</Toggle>
        </div>
        
        <div className="flex items-center space-x-4">
          <Toggle size="sm">Small Inactive</Toggle>
          <Toggle size="md">Medium Inactive</Toggle>
          <Toggle size="lg">Large Inactive</Toggle>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Verfügbare Toggle-Größen in aktiven und inaktiven Zuständen.'
      }
    }
  }
};

// Gender Filter (wie in der FeedPage)
export const GenderFilter: Story = {
  render: () => {
    const [selectedGender, setSelectedGender] = useState('all');
    
    const genderOptions = [
      { value: 'all', label: 'All' },
      { value: 'couples', label: 'Couples' },
      { value: 'females', label: 'Females' },
      { value: 'males', label: 'Males' },
      { value: 'diverse', label: 'Diverse' }
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Gender Filter Segment Control</h3>
        <p className="text-sm text-gray-400">Wie in der FeedPage verwendet - als Segment Control</p>
        
        <MultiToggle
          options={genderOptions}
          value={selectedGender}
          onChange={setSelectedGender}
          variant="segmented"
          size="sm"
        />
        
        <p className="text-xs text-gray-500">
          Ausgewählt: {genderOptions.find(o => o.value === selectedGender)?.label}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Gender Filter als Segment Control - eine runde Box mit gleitender oranger Anzeige für die Auswahl.'
      }
    }
  }
};

// Segmented Control mit perfekt zentrierter oranger Anzeige
export const SegmentedControl: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('liked');
    
    const tabOptions = [
      { value: 'uploads', label: 'Uploads' },
      { value: 'liked', label: 'Liked' },
      { value: 'bookmarked', label: 'Bookmarked' }
    ];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">Segmented Control</h3>
          <p className="text-sm text-gray-400">
            Perfekt zentrierte orange Anzeige - wie ein echtes Segment Control
          </p>
        </div>
        
        <MultiToggle
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          variant="segmented"
        />
        
        <div className="flex gap-2">
          {tabOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setActiveTab(option.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-all',
                activeTab === option.value
                  ? 'bg-gradient-primary text-white'
                  : 'bg-white/10 text-text-secondary hover:bg-white/20'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-500">
          Aktiver Tab: {tabOptions.find(t => t.value === activeTab)?.label}
        </p>
        
        <div className="text-xs text-gray-400 mt-4 p-3 bg-white/5 rounded-lg">
          ✅ <strong>Korrekte Positionierung:</strong> Die orange Box ist perfekt zentriert über der ausgewählten Option
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Echtes Segment Control: Perfekt zentrierte orange Anzeige, die exakt über der ausgewählten Option positioniert ist.'
      }
    }
  }
};

// Notifications Segment Control
export const NotificationsToggle: Story = {
  render: () => {
    const [activeNotification, setActiveNotification] = useState('notifications');
    
    const options = [
      { value: 'notifications', label: 'Notifications' },
      { value: 'activities', label: 'My Activities' }
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Notifications Segment Control</h3>
        <p className="text-sm text-gray-400">Für Benachrichtigungen vs. Aktivitäten - als Segment Control</p>
        
        <MultiToggle
          options={options}
          value={activeNotification}
          onChange={setActiveNotification}
          variant="segmented"
          size="md"
        />
        
        <p className="text-xs text-gray-500">
          Aktive Ansicht: {options.find(o => o.value === activeNotification)?.label}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Notifications als Segment Control - eine runde Box mit gleitender oranger Anzeige für die Auswahl.'
      }
    }
  }
};

// Binary Toggle (Switch)
export const BinaryToggleExample: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Binary Toggles (Switch-Style)</h3>
        
        <div className="space-y-4">
          <BinaryToggle
            label="Benachrichtigungen aktivieren"
            active={enabled}
            onToggle={setEnabled}
          />
          
          <BinaryToggle
            label="Push-Benachrichtigungen"
            active={pushEnabled}
            onToggle={setPushEnabled}
            size="lg"
          />
          
          <BinaryToggle
            label="Deaktivierte Option"
            active={false}
            onToggle={() => {}}
            disabled
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Binary Toggles (Switch-Style) für Ein/Aus-Einstellungen.'
      }
    }
  }
};

// Vergleich: Toggle vs Button vs Tag
export const ComponentComparison: Story = {
  render: () => {
    const [tagSelected, setTagSelected] = useState(['Female']);
    const [toggleActive, setToggleActive] = useState('all');

    return (
      <div className="space-y-8">
        <h3 className="text-lg font-bold text-white">Komponenten-Vergleich</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Buttons (für Aktionen)</h4>
            <div className="flex space-x-3">
              <button className="px-6 py-3 text-base rounded-full min-h-[44px] bg-gradient-primary text-white font-semibold">
                Upload
              </button>
              <button className="px-6 py-3 text-base rounded-full min-h-[44px] bg-white/5 text-text-secondary border border-white/10">
                Cancel
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-white mb-3">Tags (für Auswahl/Markierung)</h4>
            <div className="flex space-x-2">
              {['Female', 'Male', 'Couple'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setTagSelected(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full min-h-[32px] transition-all ${
                    tagSelected.includes(tag)
                      ? 'bg-gradient-primary/20 text-gradient-strong border border-gradient-strong/50'
                      : 'bg-white/5 text-text-secondary border border-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-white mb-3">Toggles (für Zustandswechsel)</h4>
            <div className="flex space-x-2">
              {['All', 'Couples', 'Females', 'Males'].map(option => (
                <Toggle
                  key={option}
                  active={toggleActive === option.toLowerCase()}
                  onToggle={() => setToggleActive(option.toLowerCase())}
                >
                  {option}
                </Toggle>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
          <p><strong>Buttons:</strong> Einmalige Aktionen, größer, prominenter</p>
          <p><strong>Tags:</strong> Auswahl/Markierung, mehrere gleichzeitig, kleiner</p>
          <p><strong>Toggles:</strong> Zustandswechsel, nur einer aktiv, mittlere Größe</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Visueller Vergleich zwischen Toggles, Buttons und Tags zur Verdeutlichung der Unterschiede.'
      }
    }
  }
};
