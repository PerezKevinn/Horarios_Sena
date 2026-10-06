import React from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { ScheduleView } from './components/scheduler/ScheduleView';
import { FichaManager } from './components/management/FichaManager';
import { ProgramaManager } from './components/management/ProgramaManager';
import { InstructorManager } from './components/management/InstructorManager';
import { AmbienteManager } from './components/management/AmbienteManager';
import { ConflictAlerts } from './components/scheduler/ConflictAlerts';
import { CuadroDeHorasView } from './components/scheduler/CuadroDeHorasView';
import { UserManager } from './components/management/UserManager';

import './styles/index.css';
import './styles/components.css';
import './styles/scheduler.css';
import './styles/print.css';

const MainDashboard: React.FC = () => {
  const { activeTab } = useSchedule();
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleView />;
      case 'cuadro-horas':
        return <CuadroDeHorasView />;
      case 'users':
        return isAdmin ? <UserManager /> : <ScheduleView />;
      case 'fichas':
        return <FichaManager />;
      case 'programas':
        return <ProgramaManager />;
      case 'instructores':
        return <InstructorManager />;
      case 'ambientes':
        return <AmbienteManager />;
      case 'conflicts':
        return isAdmin ? <ConflictAlerts /> : <ScheduleView />;
      default:
        return <ScheduleView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-body">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <MainDashboard />
      </ScheduleProvider>
    </AuthProvider>
  );
}

export default App;

