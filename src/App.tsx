import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { FeedPage } from './pages/FeedPage';
import { PlayerPage } from './pages/PlayerPage';
import { CategoryPage } from './pages/CategoryPage';
import { RecordPage } from './pages/RecordPage';
import { RecorderPage } from './pages/RecorderPage';
import { AudioEditorPage } from './pages/AudioEditorPage';
import { UploadPage } from './pages/UploadPage';
import { ShareRecordingPage } from './pages/ShareRecordingPage';
import { UploadSuccessPage } from './pages/UploadSuccessPage';
import { SecurityCheckPage } from './pages/SecurityCheckPage';
import { TestNewsPage } from './pages/TestNewsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { CommentsPage } from './pages/CommentsPage';
import { CommentTrackPage } from './pages/CommentTrackPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { AdminPage } from './pages/AdminPage';
import { TestPage } from './pages/TestPage';
import { ReportPage } from './pages/ReportPage';
// Debug pages removed
import { DatenschutzPage } from './pages/DatenschutzPage';
import { AGBPage } from './pages/AGBPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { PrivacyPage } from './pages/PrivacyPage';
import UnicornStudioPage from './pages/UnicornStudioPage';
import { UnicornVisualizerDemoPage } from './pages/UnicornVisualizerDemoPage';
import { AudioEditTestPage } from './pages/AudioEditTestPage';
import { DemoWorkflowPage } from './pages/DemoWorkflowPage';
import { DemoMainPage } from './pages/DemoMainPage';
import { DemoFeedPage } from './pages/DemoFeedPage';
import { DemoRecordPage } from './pages/DemoRecordPage';
import { DemoAudioEditorPage } from './pages/DemoAudioEditorPage';
import { DemoUploadPage } from './pages/DemoUploadPage';
import { DemoUploadSharePage } from './pages/DemoUploadSharePage';
import { audioPersistenceManager } from './services/audioPersistenceManager';
import './App.css';

// German spec: Enhanced routing structure for Aural mobile web app
function App() {
  return (
    <Router>
      <Routes>
        {/* ROOT ROUTES - Direct access from localhost */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="share-recording" element={<ShareRecordingPage />} />
          <Route path="upload-success" element={<UploadSuccessPage />} />
          <Route path="security-check" element={<SecurityCheckPage />} />
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
          <Route path="report" element={<ReportPage />} />
          <Route path="audio-edit-test" element={<AudioEditTestPage />} />
          <Route path="demo-workflow" element={<DemoWorkflowPage />} />
          <Route path="demo" element={<DemoMainPage />} />
          <Route path="demo-feed" element={<DemoFeedPage />} />
          <Route path="demo-record" element={<DemoRecordPage />} />
          <Route path="demo-audio-editor" element={<DemoAudioEditorPage />} />
          <Route path="demo-upload" element={<DemoUploadPage />} />
          <Route path="unicorn" element={<UnicornStudioPage />} />
          <Route path="unicorn-visualizer-demo" element={<UnicornVisualizerDemoPage />} />
        </Route>
        
        {/* AURAL ROOT ROUTES */}
        <Route path="/aural" element={<AppLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="share-recording" element={<ShareRecordingPage />} />
          <Route path="upload-success" element={<UploadSuccessPage />} />
          <Route path="security-check" element={<SecurityCheckPage />} />
          <Route path="test-news" element={<TestNewsPage />} />
          <Route path="audio-editor" element={<AudioEditorPage />} />
          <Route path="audio-edit-test" element={<AudioEditTestPage />} />
          <Route path="demo-workflow" element={<DemoWorkflowPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="player" element={<PlayerPage />} />
          <Route path="player/:id" element={<PlayerPage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="news" element={<CommentsPage />} />
          <Route path="comment-track" element={<CommentTrackPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="unicorn" element={<UnicornStudioPage />} />
        </Route>
        
        {/* AURAL WITH TRAILING SLASH */}
        <Route path="/aural/" element={<AppLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="share-recording" element={<ShareRecordingPage />} />
          <Route path="upload-success" element={<UploadSuccessPage />} />
          <Route path="security-check" element={<SecurityCheckPage />} />
          <Route path="test-news" element={<TestNewsPage />} />
          <Route path="audio-editor" element={<AudioEditorPage />} />
          <Route path="audio-edit-test" element={<AudioEditTestPage />} />
          <Route path="demo-workflow" element={<DemoWorkflowPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="player" element={<PlayerPage />} />
          <Route path="player/:id" element={<PlayerPage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="news" element={<CommentsPage />} />
          <Route path="comment-track" element={<CommentTrackPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="unicorn" element={<UnicornStudioPage />} />
        </Route>
        
        {/* ADDITIONAL ROUTES */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/record/recorder" element={<RecorderPage />} />
        <Route path="/aural/register" element={<RegistrationPage />} />
        <Route path="/aural/admin" element={<AdminPage />} />
        <Route path="/aural/record/recorder" element={<RecorderPage />} />
        
        {/* Demo Pages - Outside AppLayout for pure black background */}
        <Route path="/demo" element={<DemoMainPage />} />
        <Route path="/demo-feed" element={<DemoFeedPage />} />
        <Route path="/demo-record" element={<DemoRecordPage />} />
        <Route path="/demo-audio-editor" element={<DemoAudioEditorPage />} />
        <Route path="/demo-upload" element={<DemoUploadPage />} />
        <Route path="/demo-upload-share" element={<DemoUploadSharePage />} />
        
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