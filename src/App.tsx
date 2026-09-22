import React from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ScheduleView } from './components/scheduler/ScheduleView';
import { FichaManager } from './components/management/FichaManager';
import { InstructorManager } from './components/management/InstructorManager';
import { CompetenciaManager } from './components/management/CompetenciaManager';
import { AmbienteManager } from './components/management/AmbienteManager';
import { ConflictAlerts } from './components/scheduler/ConflictAlerts';

import './styles/index.css';
import './styles/components.css';
import './styles/scheduler.css';
import './styles/print.css';

const MainDashboard: React.FC = () => {
  const { activeTab } = useSchedule();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleView />;
      case 'fichas':
        return <FichaManager />;
      case 'instructores':
        return <InstructorManager />;
      case 'competencias':
        return <CompetenciaManager />;
      case 'ambientes':
        return <AmbienteManager />;
      case 'conflicts':
        return <ConflictAlerts />;
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
    <ScheduleProvider>
      <MainDashboard />
    </ScheduleProvider>
  );
}

export default App;
