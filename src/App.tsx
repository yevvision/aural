import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { FeedPage } from './pages/FeedPage';
import { PlayerPage } from './pages/PlayerPage';
import { CategoryPage } from './pages/CategoryPage';
import { RecordPage } from './pages/RecordPage';
import { RecorderPage } from './pages/RecorderPage';
import { AudioEditorPage } from './pages/AudioEditorPage';
import { UploadPage } from './pages/UploadPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { CommentsPage } from './pages/CommentsPage';
import { CommentTrackPage } from './pages/CommentTrackPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { AdminPage } from './pages/AdminPage';
import { TestPage } from './pages/TestPage';
import { DebugPage } from './pages/DebugPage';
import { DatenschutzPage } from './pages/DatenschutzPage';
import { AGBPage } from './pages/AGBPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { PrivacyPage } from './pages/PrivacyPage';
import UnicornStudioPage from './pages/UnicornStudioPage';
import './App.css';

// German spec: Enhanced routing structure for Aural mobile web app
function App() {
  console.log('Aural App with German specification is rendering');
  return (
    <Router>
      <Routes>
        {/* ROOT ROUTES - Direct access from localhost */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="audio-editor" element={<AudioEditorPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="player" element={<PlayerPage />} />
          <Route path="player/:id" element={<PlayerPage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="news" element={<CommentsPage />} />
          <Route path="comment-track" element={<CommentTrackPage />} />
          <Route path="test" element={<TestPage />} />
          <Route path="debug" element={<DebugPage />} />
          <Route path="unicorn" element={<UnicornStudioPage />} />
        </Route>
        
        {/* AURAL ROOT ROUTES */}
        <Route path="/aural" element={<AppLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="audio-editor" element={<AudioEditorPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="player" element={<PlayerPage />} />
          <Route path="player/:id" element={<PlayerPage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="news" element={<CommentsPage />} />
          <Route path="comment-track" element={<CommentTrackPage />} />
          <Route path="unicorn" element={<UnicornStudioPage />} />
        </Route>
        
        {/* AURAL WITH TRAILING SLASH */}
        <Route path="/aural/" element={<AppLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="audio-editor" element={<AudioEditorPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="player" element={<PlayerPage />} />
          <Route path="player/:id" element={<PlayerPage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="news" element={<CommentsPage />} />
          <Route path="comment-track" element={<CommentTrackPage />} />
          <Route path="unicorn" element={<UnicornStudioPage />} />
        </Route>
        
        {/* ADDITIONAL ROUTES */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/record/recorder" element={<RecorderPage />} />
        <Route path="/aural/register" element={<RegistrationPage />} />
        <Route path="/aural/admin" element={<AdminPage />} />
        <Route path="/aural/record/recorder" element={<RecorderPage />} />
        
        {/* Legal Pages */}
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/agb" element={<AGBPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/aural/datenschutz" element={<DatenschutzPage />} />
        <Route path="/aural/agb" element={<AGBPage />} />
        <Route path="/aural/impressum" element={<ImpressumPage />} />
        <Route path="/aural/privacy" element={<PrivacyPage />} />
        
        {/* FALLBACK */}
        <Route path="*" element={<FeedPage />} />
      </Routes>
    </Router>
  );
}

export default App;