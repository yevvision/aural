// Audio Playback Fix Utilities
export const audioPlaybackFixer = {
    fixAudioContext: () => {
        // Fix für AudioContext-Suspension
        if (typeof window !== 'undefined' && window.AudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
    },
    fixAudioElement: (audioElement) => {
        // Fix für Audio-Element-Probleme
        if (audioElement) {
            audioElement.preload = 'metadata';
            audioElement.crossOrigin = 'anonymous';
        }
    }
};
