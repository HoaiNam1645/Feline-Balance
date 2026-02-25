import Sidebar from './components/Sidebar';
import ProfilesPage from './pages/ProfilesPage';

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <ProfilesPage />
      </main>
    </div>
  );
}
