import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ServerProvider } from './net/ServerProvider.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { MatchPage } from './pages/MatchPage.tsx'
import { RulesPage } from './pages/RulesPage.tsx'
import { PlayerProvider } from './player/PlayerProvider.tsx'

export default function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <ServerProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/match/:matchId" element={<MatchPage />} />
            <Route path="/regras" element={<RulesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ServerProvider>
      </BrowserRouter>
    </PlayerProvider>
  )
}
