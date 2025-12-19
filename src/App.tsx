import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Setup from './pages/Setup';
import Scoreboard from './pages/Scoreboard';
import Summary from './pages/Summary';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-white font-sans max-w-md mx-auto shadow-2xl overflow-hidden border-x border-neutral-800">
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/match/:matchId" element={<Scoreboard />} />
          <Route path="/match/:matchId/summary" element={<Summary />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
