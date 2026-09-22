import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type {
  Instructor,
  Ficha,
  Ambiente,
  Competencia,
  HorarioEntry,
  ConflictDetail,
  ScheduleStats,
  DayOfWeek
} from '../types';
import {
  INITIAL_INSTRUCTORES,
  INITIAL_FICHAS,
  INITIAL_AMBIENTES,
  INITIAL_COMPETENCIAS,
  INITIAL_HORARIOS
} from '../utils/demoData';
import {
  validateSchedule,
  calculateScheduleStats,
  generateAutoSchedule,
} from '../utils/schedulerEngine';
import type { GenerationResult } from '../utils/schedulerEngine';

interface ScheduleContextType {
  // Data
  instructores: Instructor[];
  fichas: Ficha[];
  ambientes: Ambiente[];
  competencias: Competencia[];
  horarios: HorarioEntry[];
  conflicts: ConflictDetail[];
  stats: ScheduleStats;
  theme: 'dark' | 'light';
  activeTab: 'schedule' | 'fichas' | 'instructores' | 'competencias' | 'ambientes' | 'conflicts';

  // State setters & actions
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveTab: (tab: 'schedule' | 'fichas' | 'instructores' | 'competencias' | 'ambientes' | 'conflicts') => void;

  // Instructors CRUD
  addInstructor: (inst: Omit<Instructor, 'id'>) => void;
  updateInstructor: (id: string, inst: Partial<Instructor>) => void;
  deleteInstructor: (id: string) => void;

  // Fichas CRUD
  addFicha: (ficha: Omit<Ficha, 'id'>) => void;
  updateFicha: (id: string, ficha: Partial<Ficha>) => void;
  deleteFicha: (id: string) => void;

  // Ambientes CRUD
  addAmbiente: (amb: Omit<Ambiente, 'id'>) => void;
  updateAmbiente: (id: string, amb: Partial<Ambiente>) => void;
  deleteAmbiente: (id: string) => void;

  // Competencias CRUD
  addCompetencia: (comp: Omit<Competencia, 'id'>) => void;
  updateCompetencia: (id: string, comp: Partial<Competencia>) => void;
  deleteCompetencia: (id: string) => void;

  // Horarios Slot Operations
  addHorarioSlot: (slot: Omit<HorarioEntry, 'id'>) => void;
  updateHorarioSlot: (id: string, slot: Partial<HorarioEntry>) => void;
  deleteHorarioSlot: (id: string) => void;
  moveHorarioSlot: (id: string, newDia: DayOfWeek, newHoraInicio: number) => void;
  clearAllHorarios: () => void;

  // Automated Scheduler & Data Utilities
  runAutoScheduler: (keepExisting?: boolean) => GenerationResult;
  resetToDemoData: () => void;
  clearAllData: () => void;
  importStateFromJSON: (jsonData: any) => boolean;
}

const STORAGE_KEYS = {
  INSTRUCTORES: 'sena_scheduler_instructores_v1',
  FICHAS: 'sena_scheduler_fichas_v1',
  AMBIENTES: 'sena_scheduler_ambientes_v1',
  COMPETENCIAS: 'sena_scheduler_competencias_v1',
  HORARIOS: 'sena_scheduler_horarios_v1',
  THEME: 'sena_scheduler_theme_v1',
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [instructores, setInstructores] = useState<Instructor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSTRUCTORES);
      return saved ? JSON.parse(saved) : INITIAL_INSTRUCTORES;
    } catch {
      return INITIAL_INSTRUCTORES;
    }
  });

  const [fichas, setFichas] = useState<Ficha[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FICHAS);
      return saved ? JSON.parse(saved) : INITIAL_FICHAS;
    } catch {
      return INITIAL_FICHAS;
    }
  });

  const [ambientes, setAmbientes] = useState<Ambiente[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AMBIENTES);
      return saved ? JSON.parse(saved) : INITIAL_AMBIENTES;
    } catch {
      return INITIAL_AMBIENTES;
    }
  });

  const [competencias, setCompetencias] = useState<Competencia[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPETENCIAS);
      return saved ? JSON.parse(saved) : INITIAL_COMPETENCIAS;
    } catch {
      return INITIAL_COMPETENCIAS;
    }
  });

  const [horarios, setHorarios] = useState<HorarioEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HORARIOS);
      return saved ? JSON.parse(saved) : INITIAL_HORARIOS;
    } catch {
      return INITIAL_HORARIOS;
    }
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [activeTab, setActiveTab] = useState<'schedule' | 'fichas' | 'instructores' | 'competencias' | 'ambientes' | 'conflicts'>('schedule');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTRUCTORES, JSON.stringify(instructores));
  }, [instructores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
  }, [fichas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AMBIENTES, JSON.stringify(ambientes));
  }, [ambientes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPETENCIAS, JSON.stringify(competencias));
  }, [competencias]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HORARIOS, JSON.stringify(horarios));
  }, [horarios]);

  const conflicts = useMemo(() => {
    return validateSchedule(horarios, instructores, fichas, ambientes, competencias);
  }, [horarios, instructores, fichas, ambientes, competencias]);

  const stats = useMemo(() => {
    return calculateScheduleStats(horarios, conflicts);
  }, [horarios, conflicts]);

  const addInstructor = (instData: Omit<Instructor, 'id'>) => {
    const newInst: Instructor = {
      ...instData,
      id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setInstructores(prev => [...prev, newInst]);
  };

  const updateInstructor = (id: string, partial: Partial<Instructor>) => {
    setInstructores(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deleteInstructor = (id: string) => {
    setInstructores(prev => prev.filter(item => item.id !== id));
    setHorarios(prev => prev.filter(h => h.instructorId !== id));
  };

  const addFicha = (fichaData: Omit<Ficha, 'id'>) => {
    const newFicha: Ficha = {
      ...fichaData,
      id: `ficha-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setFichas(prev => [...prev, newFicha]);
  };

  const updateFicha = (id: string, partial: Partial<Ficha>) => {
    setFichas(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deleteFicha = (id: string) => {
    setFichas(prev => prev.filter(item => item.id !== id));
    setCompetencias(prev => prev.filter(c => c.fichaId !== id));
    setHorarios(prev => prev.filter(h => h.fichaId !== id));
  };

  const addAmbiente = (ambData: Omit<Ambiente, 'id'>) => {
    const newAmb: Ambiente = {
      ...ambData,
      id: `amb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setAmbientes(prev => [...prev, newAmb]);
  };

  const updateAmbiente = (id: string, partial: Partial<Ambiente>) => {
    setAmbientes(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deleteAmbiente = (id: string) => {
    setAmbientes(prev => prev.filter(item => item.id !== id));
    setHorarios(prev => prev.filter(h => h.ambienteId !== id));
  };

  const addCompetencia = (compData: Omit<Competencia, 'id'>) => {
    const newComp: Competencia = {
      ...compData,
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setCompetencias(prev => [...prev, newComp]);
  };

  const updateCompetencia = (id: string, partial: Partial<Competencia>) => {
    setCompetencias(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deleteCompetencia = (id: string) => {
    setCompetencias(prev => prev.filter(item => item.id !== id));
    setHorarios(prev => prev.filter(h => h.competenciaId !== id));
  };

  const addHorarioSlot = (slotData: Omit<HorarioEntry, 'id'>) => {
    const newSlot: HorarioEntry = {
      ...slotData,
      id: `hor-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setHorarios(prev => [...prev, newSlot]);
  };

  const updateHorarioSlot = (id: string, partial: Partial<HorarioEntry>) => {
    setHorarios(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deleteHorarioSlot = (id: string) => {
    setHorarios(prev => prev.filter(item => item.id !== id));
  };

  const moveHorarioSlot = (id: string, newDia: DayOfWeek, newHoraInicio: number) => {
    setHorarios(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          dia: newDia,
          horaInicio: newHoraInicio,
        };
      }
      return h;
    }));
  };

  const clearAllHorarios = () => {
    setHorarios([]);
  };

  const runAutoScheduler = (keepExisting = false): GenerationResult => {
    const result = generateAutoSchedule(instructores, fichas, ambientes, competencias, {
      keepExisting,
      existingHorarios: horarios,
    });
    setHorarios(result.horarios);
    return result;
  };

  const resetToDemoData = () => {
    setInstructores(INITIAL_INSTRUCTORES);
    setFichas(INITIAL_FICHAS);
    setAmbientes(INITIAL_AMBIENTES);
    setCompetencias(INITIAL_COMPETENCIAS);
    setHorarios(INITIAL_HORARIOS);
  };

  const clearAllData = () => {
    setInstructores([]);
    setFichas([]);
    setAmbientes([]);
    setCompetencias([]);
    setHorarios([]);
  };

  const importStateFromJSON = (jsonData: any): boolean => {
    try {
      if (jsonData && typeof jsonData === 'object') {
        if (Array.isArray(jsonData.instructores)) setInstructores(jsonData.instructores);
        if (Array.isArray(jsonData.fichas)) setFichas(jsonData.fichas);
        if (Array.isArray(jsonData.ambientes)) setAmbientes(jsonData.ambientes);
        if (Array.isArray(jsonData.competencias)) setCompetencias(jsonData.competencias);
        if (Array.isArray(jsonData.horarios)) setHorarios(jsonData.horarios);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importing backup JSON', e);
      return false;
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        instructores,
        fichas,
        ambientes,
        competencias,
        horarios,
        conflicts,
        stats,
        theme,
        activeTab,
        setTheme,
        setActiveTab,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        addFicha,
        updateFicha,
        deleteFicha,
        addAmbiente,
        updateAmbiente,
        deleteAmbiente,
        addCompetencia,
        updateCompetencia,
        deleteCompetencia,
        addHorarioSlot,
        updateHorarioSlot,
        deleteHorarioSlot,
        moveHorarioSlot,
        clearAllHorarios,
        runAutoScheduler,
        resetToDemoData,
        clearAllData,
        importStateFromJSON,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
