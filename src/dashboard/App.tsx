import { HashRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import OverviewPage from "./pages/OverviewPage";
import ExtensionDetailPage from "./pages/ExtensionDetailPage";
import NetworkLogPage from "./pages/NetworkLogPage";
import AlertHistoryPage from "./pages/AlertHistoryPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/extension/:id" element={<ExtensionDetailPage />} />
            <Route path="/network" element={<NetworkLogPage />} />
            <Route path="/alerts" element={<AlertHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
