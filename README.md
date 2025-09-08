# Aural - Voice Social Network

🎙️ **Aural** is a mobile-first web application that functions as an "Instagram for voices" - a social platform focused on audio content sharing and discovery.

## Features - Milestone 1

### ✅ Implemented Features

1. **Feed Page (`/`)**
   - Display list of audio tracks with dummy data
   - Filter tabs: All, Following, Trending
   - Audio cards showing title, duration, username, likes
   - Play button starts mini-player

2. **Mini-Player (Bottom Persistent)**
   - Shows current track info (title, username)
   - Play/pause control
   - Progress bar with seek functionality
   - Expand button to open full-screen player

3. **Full-Screen Player (`/player/:id`)**
   - Large play/pause button
   - Animated waveform visualizer
   - Progress bar with time display
   - Like, comment, bookmark interactions
   - Back button returns to previous page

4. **Upload Page (`/upload`)**
   - Drag & drop or file selection
   - Audio file validation (MP3, WAV, WebM, OGG, M4A)
   - Preview playback before upload
   - Title editing
   - Saves to "My Tracks" and feed

5. **Record Page (`/record`)**
   - Browser microphone recording
   - Start, pause, resume, stop controls
   - Real-time duration display
   - Recording visualizer animation
   - Preview playback
   - Save to "My Tracks" and feed

6. **Profile Page (`/profile/:id`)**
   - User stats (uploads, likes, join date)
   - List of user's tracks
   - Differentiate between own profile and others

7. **Navigation**
   - Top navigation with active state indicators
   - Icons: Home, Comments, Profile, Upload, Search
   - Smooth transitions and hover effects

### 🎨 Design System

- **Dark Mode Only**: Deep black background (#0A0A0B)
- **Neon Gradients**: Pink/Violet/Blue/Turquoise accent colors
- **Typography**: Inter font with clear hierarchy
- **Mobile-First**: Responsive design, optimized for mobile
- **Icons**: Outline style, 2px stroke width
- **Animations**: Framer Motion for smooth transitions

### 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS variables
- **Routing**: React Router v6
- **State Management**: Zustand + localStorage persistence
- **Audio**: Web Audio API + MediaRecorder API
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with microphone access for recording

### Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   ```
   http://localhost:5173
   ```

### 🧪 Testing Scenarios

#### 1. Feed & Navigation
- [ ] Navigate between tabs (All, Following, Trending)
- [ ] Click play button on any audio card → mini-player should appear
- [ ] Mini-player shows track info and controls
- [ ] Click expand button → opens full-screen player

#### 2. Audio Playback
- [ ] Play/pause works in mini-player
- [ ] Progress bar updates during playback
- [ ] Click progress bar to seek to different position
- [ ] Full-screen player shows animated waveform
- [ ] Like button toggles and updates count

#### 3. File Upload
- [ ] Go to `/upload` page
- [ ] Select an audio file (MP3, WAV, etc.)
- [ ] Preview plays the selected file
- [ ] Edit title and save
- [ ] New track appears in feed and profile

#### 4. Voice Recording
- [ ] Go to `/record` page
- [ ] Grant microphone permission when prompted
- [ ] Click record button → recording starts with visualizer
- [ ] Pause/resume recording works
- [ ] Stop recording and preview playback
- [ ] Save with title → appears in feed

#### 5. Profile & Persistence
- [ ] Visit profile page → shows user stats and tracks
- [ ] Uploaded/recorded tracks persist after page refresh
- [ ] Mini-player state persists during navigation

#### 6. Mobile Experience
- [ ] Responsive design works on mobile viewport
- [ ] Touch targets are large enough (44px minimum)
- [ ] Navigation is thumb-friendly
- [ ] Audio controls work on mobile browsers

### 🎯 Demo Flow

**Recommended testing sequence**:

1. **Start with Feed** → Explore dummy audio tracks
2. **Test Playback** → Play a track, use mini-player controls
3. **Expand Player** → Open full-screen view, try interactions
4. **Record Audio** → Create a new voice note (requires mic)
5. **Upload File** → Add an audio file from your device
6. **Check Profile** → View your uploaded tracks
7. **Test Persistence** → Refresh page, verify data is saved

### 🔧 Browser Requirements

- **Audio Recording**: Chrome 47+, Firefox 29+, Safari 14.1+
- **File Upload**: All modern browsers
- **Audio Playback**: All browsers with HTML5 audio support

### 📱 Mobile Testing

For the best mobile experience:
- Use Chrome/Safari on iOS/Android
- Enable microphone permissions for recording
- Test in both portrait and landscape modes

### 🐛 Known Limitations (Milestone 1)

- Dummy audio files are silent (for demo purposes)
- No real backend - data stored in localStorage
- Comments and search are placeholder pages
- No user authentication
- Recording quality depends on browser implementation

### 🚧 Future Enhancements (Next Milestones)

- Real audio file hosting
- User authentication and profiles
- Comments and social interactions
- Audio waveform visualization
- Push notifications
- Offline support
- Advanced audio effects

---

**Built with ❤️ for voice-first social networking**