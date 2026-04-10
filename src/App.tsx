import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LegacyPage from './components/LegacyPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/' || 
                 location.pathname === '/meindex.htm' || 
                 location.pathname === '/meindex.html' || 
                 location.pathname === '/index.htm' || 
                 location.pathname === '/index.html';
  
  return (
    <>
      {!isHome && <Header />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<LegacyPage />} />
        </Routes>
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
