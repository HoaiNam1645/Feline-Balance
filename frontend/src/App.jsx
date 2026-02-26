import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProfilesPage from './pages/ProfilesPage';
import TopupPage from './pages/TopupPage';
import TeamsPage from './pages/TeamsPage';
import VendorsPage from './pages/VendorsPage';
import DesignStatisticsPage from './pages/DesignStatisticsPage';
import MediaPage from './pages/MediaPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/profiles" replace />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/topup" element={<TopupPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/design-statistics" element={<DesignStatisticsPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="*" element={<Navigate to="/profiles" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
