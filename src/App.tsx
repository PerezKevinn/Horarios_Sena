import React from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ScheduleView } from './components/scheduler/ScheduleView';
import { FichaManager } from './components/management/FichaManager';
import { ProgramaManager } from './components/management/ProgramaManager';
import { InstructorManager } from './components/management/InstructorManager';
import { AmbienteManager } from './components/management/AmbienteManager';
import { ConflictAlerts } from './components/scheduler/ConflictAlerts';
import { CuadroDeHorasView } from './components/scheduler/CuadroDeHorasView';

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
      case 'cuadro-horas':
        return <CuadroDeHorasView />;
      case 'fichas':
        return <FichaManager />;
      case 'programas':
        return <ProgramaManager />;
      case 'instructores':
        return <InstructorManager />;
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
