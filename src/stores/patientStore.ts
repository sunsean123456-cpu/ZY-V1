import { create } from 'zustand';
import type { Patient } from '../types';

interface PatientStore {
  patients: Patient[];
  currentPatient: Patient | null;
  setPatients: (patients: Patient[]) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  patients: [],
  currentPatient: null,
  
  setPatients: (patients) => set({ patients }),
  
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  
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
