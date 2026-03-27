import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VocalOpsProvider } from './context/VocalOpsContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <VocalOpsProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </VocalOpsProvider>
  );
}
