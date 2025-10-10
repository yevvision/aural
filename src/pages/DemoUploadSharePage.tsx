import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export const DemoUploadSharePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Moments auf 5.10.2025');
  const [description, setDescription] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('diverse');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const participants = [
    { id: 'female', label: 'Female' },
    { id: 'male', label: 'Male' },
    { id: 'couple', label: 'Couple' },
    { id: 'diverse', label: 'Diverse' }
  ];

  const availableTags = [
    'Soft', 'Passionate', 'Moan', 'Whisper', 'Breathing',
    'Intimate', 'Seductive', 'Sweet', 'Gentle', 'Tender',
    'Romantic', 'Sensual', 'Loving', 'Warm', 'Affectionate'
  ];

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handlePublish = () => {
    console.log('Demo: Publishing recording with:', {
      title,
      description,
      participant: selectedParticipant,
      tags: selectedTags
    });
    
    // Simuliere erfolgreiche Veröffentlichung
    alert(`Demo: Recording veröffentlicht!\nTitel: ${title}\nTeilnehmer: ${selectedParticipant}\nTags: ${selectedTags.join(', ')}`);
    
    // Navigiere zurück zur Hauptseite
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-black">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-4 sm:px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Button>
        </div>

        {/* Main Title */}
        <Heading level={1} className="text-3xl sm:text-4xl mb-8 text-white">
          Share your recording
        </Heading>

        {/* Form Content */}
        <div className="flex-1 space-y-8">
          {/* Title Section */}
          <div>
            <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              WHAT IS THE TITLE OF THIS RECORDING?
            </h2>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                maxLength={85}
              />
              <div className="absolute bottom-2 right-3 text-gray-400 text-xs">
                {title.length}/85
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              ADD A DESCRIPTION IF YOU LIKE
            </h2>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="absolute bottom-2 right-3 text-gray-400 text-xs">
                {description.length}/1000
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div>
            <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              WHO IS ON THE RECORDING?
            </h2>
            <div className="flex flex-wrap gap-3">
              {participants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => setSelectedParticipant(participant.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    selectedParticipant === participant.id
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-transparent text-white border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {participant.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              ADD TAGS TO YOUR RECORDING
            </h2>
            
            {/* Available Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-transparent text-white border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Enter your own tag"
                className="flex-1 px-3 py-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              />
              <button
                onClick={handleAddCustomTag}
                className="w-10 h-10 bg-transparent border border-gray-600 rounded-full flex items-center justify-center text-white hover:border-gray-500 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <p className="text-gray-400 text-xs">
              You can set tags to be found better
            </p>
          </div>
        </div>

        {/* Publish Button */}
        <div className="mt-8">
          <Button
            onClick={handlePublish}
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 rounded-full"
          >
            <Upload size={20} className="mr-2" />
            Publish Recording
          </Button>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center space-x-6 text-xs text-gray-400">
          <button className="hover:text-white transition-colors">Privacy Policy</button>
          <button className="hover:text-white transition-colors">Community Guidelines</button>
          <button className="hover:text-white transition-colors">About Us</button>
        </div>
      </div>
    </div>
  );
};
