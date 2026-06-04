import { create } from 'zustand';
import type { Patient, RichPatientData } from '../types';

interface PatientStore {
  patients: Patient[];
  richPatients: RichPatientData[];
  currentPatient: Patient | null;
  currentRichPatient: RichPatientData | null;
  setPatients: (patients: Patient[]) => void;
  setRichPatients: (patients: RichPatientData[]) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  setCurrentRichPatient: (patient: RichPatientData | null) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  patients: [],
  richPatients: [],
  currentPatient: null,
  currentRichPatient: null,
  
  setPatients: (patients) => set({ patients }),
  
  setRichPatients: (richPatients) => set({ richPatients }),
  
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  
  setCurrentRichPatient: (currentRichPatient) => set({ currentRichPatient }),
  
  addPatient: (patient) => set((state) => ({
    patients: [...state.patients, patient]
  })),
  
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ),
    currentPatient: state.currentPatient?.id === id 
      ? { ...state.currentPatient, ...updates }
      : state.currentPatient
  })),
  
  deletePatient: (id) => set((state) => ({
    patients: state.patients.filter(p => p.id !== id),
    currentPatient: state.currentPatient?.id === id ? null : state.currentPatient
  }))
}));
