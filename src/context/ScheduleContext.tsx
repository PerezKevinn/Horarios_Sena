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
  DayOfWeek,
  Programa,
  CompetenciaPlantilla
} from '../types';
import {
  INITIAL_INSTRUCTORES,
  INITIAL_FICHAS,
  INITIAL_AMBIENTES,
  INITIAL_COMPETENCIAS,
  INITIAL_HORARIOS,
  INITIAL_PROGRAMAS
} from '../utils/demoData';
import {
  validateSchedule,
  calculateScheduleStats,
  generateAutoSchedule,
} from '../utils/schedulerEngine';
import type { GenerationResult } from '../utils/schedulerEngine';

interface ScheduleContextType {
  // Data
  programas: Programa[];
  instructores: Instructor[];
  fichas: Ficha[];
  ambientes: Ambiente[];
  competencias: Competencia[];
  horarios: HorarioEntry[];
  conflicts: ConflictDetail[];
  stats: ScheduleStats;
  theme: 'dark' | 'light';
  activeTab: 'schedule' | 'fichas' | 'programas' | 'instructores' | 'ambientes' | 'conflicts' | 'cuadro-horas';
  timeScale: 'semanal' | 'mensual' | 'anual';
  selectedDate: string; // YYYY-MM-DD

  // State setters & actions
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveTab: (tab: 'schedule' | 'fichas' | 'programas' | 'instructores' | 'ambientes' | 'conflicts' | 'cuadro-horas') => void;
  setTimeScale: (scale: 'semanal' | 'mensual' | 'anual') => void;
  setSelectedDate: (date: string) => void;

  // Programas CRUD
  addPrograma: (prog: Omit<Programa, 'id'>) => void;
  updatePrograma: (id: string, prog: Partial<Programa>) => void;
  deletePrograma: (id: string) => void;
  addCompetenciaToPrograma: (programaId: string, comp: Omit<CompetenciaPlantilla, 'id'>) => void;
  updateCompetenciaInPrograma: (programaId: string, compId: string, comp: Partial<CompetenciaPlantilla>) => void;
  deleteCompetenciaFromPrograma: (programaId: string, compId: string) => void;

  // Instructors CRUD
  addInstructor: (inst: Omit<Instructor, 'id'>) => void;
  updateInstructor: (id: string, inst: Partial<Instructor>) => void;
  deleteInstructor: (id: string) => void;

  // Fichas CRUD
  addFicha: (ficha: Omit<Ficha, 'id'>, autoLoadCompetencias?: boolean) => Ficha;
  updateFicha: (id: string, ficha: Partial<Ficha>) => void;
  deleteFicha: (id: string) => void;
  reloadCompetenciasForFicha: (fichaId: string) => number;

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
  PROGRAMAS: 'sena_scheduler_programas_v1',
  INSTRUCTORES: 'sena_scheduler_instructores_v1',
  FICHAS: 'sena_scheduler_fichas_v1',
  AMBIENTES: 'sena_scheduler_ambientes_v1',
  COMPETENCIAS: 'sena_scheduler_competencias_v1',
  HORARIOS: 'sena_scheduler_horarios_v1',
  THEME: 'sena_scheduler_theme_v1',
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getTodayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const migrateLegacyDates = (data: any[]) => {
    return data.map(item => {
      const updated = { ...item };
      if (updated.fechaIngreso && updated.fechaIngreso.startsWith('2024')) {
        updated.fechaIngreso = updated.fechaIngreso.replace('2024', '2026');
      }
      if (updated.fechaSalida && updated.fechaSalida.startsWith('2025')) {
        updated.fechaSalida = updated.fechaSalida.replace('2025', '2027');
      }
      if (updated.fechaInicio && updated.fechaInicio.startsWith('2024')) {
        updated.fechaInicio = updated.fechaInicio.replace('2024', '2026');
      }
      if (updated.fechaFin && updated.fechaFin.startsWith('2024')) {
        updated.fechaFin = updated.fechaFin.replace('2024', '2026');
      }
      if (Array.isArray(updated.competencias)) {
        updated.competencias = updated.competencias.map((c: any) => ({
          ...c,
          fechaInicio: c.fechaInicio?.replace('2024', '2026'),
          fechaFin: c.fechaFin?.replace('2024', '2026'),
        }));
      }
      return updated;
    });
  };

  const [programas, setProgramas] = useState<Programa[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRAMAS);
      return saved ? migrateLegacyDates(JSON.parse(saved)) : INITIAL_PROGRAMAS;
    } catch {
      return INITIAL_PROGRAMAS;
    }
  });

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
      return saved ? migrateLegacyDates(JSON.parse(saved)) : INITIAL_FICHAS;
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
      return saved ? migrateLegacyDates(JSON.parse(saved)) : INITIAL_COMPETENCIAS;
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

  const [activeTab, setActiveTab] = useState<'schedule' | 'fichas' | 'programas' | 'instructores' | 'ambientes' | 'conflicts' | 'cuadro-horas'>('schedule');
  const [timeScale, setTimeScale] = useState<'semanal' | 'mensual' | 'anual'>('semanal');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRAMAS, JSON.stringify(programas));
  }, [programas]);

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

  // Programas CRUD
  const addPrograma = (progData: Omit<Programa, 'id'>) => {
    const newProg: Programa = {
      ...progData,
      id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      competencias: progData.competencias || [],
    };
    setProgramas(prev => [...prev, newProg]);
  };

  const updatePrograma = (id: string, partial: Partial<Programa>) => {
    setProgramas(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deletePrograma = (id: string) => {
    setProgramas(prev => prev.filter(item => item.id !== id));
  };

  const addCompetenciaToPrograma = (programaId: string, compData: Omit<CompetenciaPlantilla, 'id'>) => {
    const newComp: CompetenciaPlantilla = {
      ...compData,
      id: `comp-plantilla-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setProgramas(prev => prev.map(p => {
      if (p.id === programaId) {
        return {
          ...p,
          competencias: [...p.competencias, newComp]
        };
      }
      return p;
    }));
  };

  const updateCompetenciaInPrograma = (programaId: string, compId: string, compPartial: Partial<CompetenciaPlantilla>) => {
    setProgramas(prev => prev.map(p => {
      if (p.id === programaId) {
        return {
          ...p,
          competencias: p.competencias.map(c => c.id === compId ? { ...c, ...compPartial } : c)
        };
      }
      return p;
    }));
  };

  const deleteCompetenciaFromPrograma = (programaId: string, compId: string) => {
    setProgramas(prev => prev.map(p => {
      if (p.id === programaId) {
        return {
          ...p,
          competencias: p.competencias.filter(c => c.id !== compId)
        };
      }
      return p;
    }));
  };

  // Instructors CRUD
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

  // Fichas CRUD with Auto-Competency Loading
  const addFicha = (fichaData: Omit<Ficha, 'id'>, autoLoadCompetencias = true): Ficha => {
    const newFichaId = `ficha-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newFicha: Ficha = {
      ...fichaData,
      id: newFichaId,
    };
    setFichas(prev => [...prev, newFicha]);

    if (autoLoadCompetencias && fichaData.programaId) {
      const prog = programas.find(p => p.id === fichaData.programaId);
      if (prog && prog.competencias && prog.competencias.length > 0) {
        const newComps: Competencia[] = prog.competencias.map(cp => ({
          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          codigo: cp.codigo,
          nombre: cp.nombre,
          resultadoAprendizaje: cp.resultadoAprendizaje,
          fichaId: newFichaId,
          instructorId: cp.instructorIdSugerido || (instructores.length > 0 ? instructores[0].id : ''),
          ambienteId: cp.ambienteIdSugerido || undefined,
          horasSemanales: cp.horasSemanales,
          horasTotales: cp.horasTotales,
          bloqueMinimoHoras: cp.bloqueMinimoHoras || 2,
          fechaInicio: cp.fechaInicio || fichaData.fechaIngreso,
          fechaFin: cp.fechaFin || fichaData.fechaSalida,
        }));
        setCompetencias(prev => [...prev, ...newComps]);
      }
    }

    return newFicha;
  };

  const updateFicha = (id: string, partial: Partial<Ficha>) => {
    setFichas(prev => prev.map(item => item.id === id ? { ...item, ...partial } : item));
  };

  const deleteFicha = (id: string) => {
    setFichas(prev => prev.filter(item => item.id !== id));
    setCompetencias(prev => prev.filter(c => c.fichaId !== id));
    setHorarios(prev => prev.filter(h => h.fichaId !== id));
  };

  const reloadCompetenciasForFicha = (fichaId: string): number => {
    const ficha = fichas.find(f => f.id === fichaId);
    if (!ficha || !ficha.programaId) return 0;
    const prog = programas.find(p => p.id === ficha.programaId);
    if (!prog || !prog.competencias || prog.competencias.length === 0) return 0;

    const existingComps = competencias.filter(c => c.fichaId === fichaId);
    const existingCompCodes = new Set(existingComps.map(c => c.codigo));

    const toAdd: Competencia[] = [];
    for (const cp of prog.competencias) {
      if (!existingCompCodes.has(cp.codigo)) {
        toAdd.push({
          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          codigo: cp.codigo,
          nombre: cp.nombre,
          resultadoAprendizaje: cp.resultadoAprendizaje,
          fichaId: fichaId,
          instructorId: cp.instructorIdSugerido || (instructores.length > 0 ? instructores[0].id : ''),
          ambienteId: cp.ambienteIdSugerido || undefined,
          horasSemanales: cp.horasSemanales,
          horasTotales: cp.horasTotales,
          bloqueMinimoHoras: cp.bloqueMinimoHoras || 2,
          fechaInicio: cp.fechaInicio || ficha.fechaIngreso,
          fechaFin: cp.fechaFin || ficha.fechaSalida,
        });
      }
    }

    if (toAdd.length > 0) {
      setCompetencias(prev => [...prev, ...toAdd]);
    }
    return toAdd.length;
  };

  // Ambientes CRUD
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

  // Competencias CRUD
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

  // Horarios Slot Operations
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
    setProgramas(INITIAL_PROGRAMAS);
    setInstructores(INITIAL_INSTRUCTORES);
    setFichas(INITIAL_FICHAS);
    setAmbientes(INITIAL_AMBIENTES);
    setCompetencias(INITIAL_COMPETENCIAS);
    setHorarios(INITIAL_HORARIOS);
  };

  const clearAllData = () => {
    setProgramas([]);
    setInstructores([]);
    setFichas([]);
    setAmbientes([]);
    setCompetencias([]);
    setHorarios([]);
  };

  const importStateFromJSON = (jsonData: any): boolean => {
    try {
      if (jsonData && typeof jsonData === 'object') {
        if (Array.isArray(jsonData.programas)) setProgramas(jsonData.programas);
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
        programas,
        instructores,
        fichas,
        ambientes,
        competencias,
        horarios,
        conflicts,
        stats,
        theme,
        activeTab,
        timeScale,
        selectedDate,
        setTheme,
        setActiveTab,
        setTimeScale,
        setSelectedDate,
        addPrograma,
        updatePrograma,
        deletePrograma,
        addCompetenciaToPrograma,
        updateCompetenciaInPrograma,
        deleteCompetenciaFromPrograma,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        addFicha,
        updateFicha,
        deleteFicha,
        reloadCompetenciasForFicha,
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
