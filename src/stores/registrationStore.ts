import { create } from 'zustand';
import type { RegistrationData, RegistrationStep, ValidationError } from '../types';

// German spec: Registration store for multi-step registration flow
interface RegistrationStore {
  // State
  data: RegistrationData;
  currentStep: number;
  steps: RegistrationStep[];
  errors: ValidationError[];
  isLoading: boolean;
  isComplete: boolean;
  
  // Actions
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  setEmail: (email: string) => void;
  setIsOver18: (isOver18: boolean) => void;
  
  // Step management
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  
  // Validation
  validateCurrentStep: () => boolean;
  addError: (error: ValidationError) => void;
  clearErrors: () => void;
  
  // Registration flow
  submitRegistration: () => Promise<boolean>;
  reset: () => void;
  
  // Utilities
  canProceed: () => boolean;
  getStepProgress: () => number;
}

// German spec: Registration steps as defined in specification
const initialSteps: RegistrationStep[] = [
  {
    id: 1,
    title: 'Username eingeben',
    description: 'Wähle deinen einzigartigen Benutzernamen',
    isComplete: false,
    isActive: true,
  },
  {
    id: 2,
    title: 'Passwort vergeben',
    description: 'Mindestens 8 Zeichen, 3 verschiedene Zeichentypen',
    isComplete: false,
    isActive: false,
  },
  {
    id: 3,
    title: 'E-Mail-Adresse',
    description: 'Optional zur Passwortwiederherstellung',
    isComplete: false,
    isActive: false,
  },
  {
    id: 4,
    title: '18+ Bestätigung',
    description: 'Altersbestätigung erforderlich',
    isComplete: false,
    isActive: false,
  },
  {
    id: 5,
    title: 'Erfolgsmeldung',
    description: 'Registrierung abgeschlossen',
    isComplete: false,
    isActive: false,
  },
];

const initialData: RegistrationData = {
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  isOver18: false,
  step: 1,
};

export const useRegistrationStore = create<RegistrationStore>()((set, get) => ({
  data: initialData,
  currentStep: 1,
  steps: initialSteps,
  errors: [],
  isLoading: false,
  isComplete: false,
  
  setUsername: (username) => {
    set((state) => ({
      data: { ...state.data, username },
      errors: state.errors.filter(e => e.field !== 'username')
    }));
  },
  
  setPassword: (password) => {
    set((state) => ({
      data: { ...state.data, password },
      errors: state.errors.filter(e => e.field !== 'password')
    }));
  },
  
  setConfirmPassword: (confirmPassword) => {
    set((state) => ({
      data: { ...state.data, confirmPassword },
      errors: state.errors.filter(e => e.field !== 'confirmPassword')
    }));
  },
  
  setEmail: (email) => {
    set((state) => ({
      data: { ...state.data, email },
      errors: state.errors.filter(e => e.field !== 'email')
    }));
  },
  
  setIsOver18: (isOver18) => {
    set((state) => ({
      data: { ...state.data, isOver18 },
      errors: state.errors.filter(e => e.field !== 'isOver18')
    }));
  },
  
  nextStep: () => {
    const state = get();
    if (state.validateCurrentStep() && state.currentStep < 5) {
      const nextStep = state.currentStep + 1;
      set((state) => ({
        currentStep: nextStep,
        data: { ...state.data, step: nextStep as RegistrationData['step'] },
        steps: state.steps.map(step => ({
          ...step,
          isComplete: step.id < nextStep,
          isActive: step.id === nextStep
        }))
      }));
    }
  },
  
  previousStep: () => {
    const state = get();
    if (state.currentStep > 1) {
      const prevStep = state.currentStep - 1;
      set((state) => ({
        currentStep: prevStep,
        data: { ...state.data, step: prevStep as RegistrationData['step'] },
        steps: state.steps.map(step => ({
          ...step,
          isComplete: step.id < prevStep,
          isActive: step.id === prevStep
        }))
      }));
    }
  },
  
  goToStep: (step) => {
    if (step >= 1 && step <= 5) {
      set((state) => ({
        currentStep: step,
        data: { ...state.data, step: step as RegistrationData['step'] },
        steps: state.steps.map(s => ({
          ...s,
          isComplete: s.id < step,
          isActive: s.id === step
        }))
      }));
    }
  },
  
  validateCurrentStep: () => {
    const state = get();
    const errors: ValidationError[] = [];
    
    switch (state.currentStep) {
      case 1: // Username
        if (!state.data.username.trim()) {
          errors.push({ field: 'username', message: 'Benutzername ist erforderlich' });
        } else if (state.data.username.length < 3) {
          errors.push({ field: 'username', message: 'Benutzername muss mindestens 3 Zeichen lang sein' });
        } else if (!/^[a-zA-Z0-9_]+$/.test(state.data.username)) {
          errors.push({ field: 'username', message: 'Nur Buchstaben, Zahlen und Unterstriche erlaubt' });
        }
        break;
        
      case 2: // Password
        if (!state.data.password) {
          errors.push({ field: 'password', message: 'Passwort ist erforderlich' });
        } else if (state.data.password.length < 8) {
          errors.push({ field: 'password', message: 'Passwort muss mindestens 8 Zeichen lang sein' });
        } else {
          const charTypes = [
            /[a-z]/.test(state.data.password), // lowercase
            /[A-Z]/.test(state.data.password), // uppercase
            /[0-9]/.test(state.data.password), // numbers
            /[^a-zA-Z0-9]/.test(state.data.password) // special chars
          ].filter(Boolean).length;
          
          if (charTypes < 3) {
            errors.push({ 
              field: 'password', 
              message: 'Passwort muss mindestens 3 verschiedene Zeichentypen enthalten' 
            });
          }
        }
        
        if (!state.data.confirmPassword) {
          errors.push({ field: 'confirmPassword', message: 'Passwort bestätigen ist erforderlich' });
        } else if (state.data.password !== state.data.confirmPassword) {
          errors.push({ field: 'confirmPassword', message: 'Passwörter stimmen nicht überein' });
        }
        break;
        
      case 3: // Email (optional)
        if (state.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.data.email)) {
          errors.push({ field: 'email', message: 'Ungültige E-Mail-Adresse' });
        }
        break;
        
      case 4: // Age verification
        if (!state.data.isOver18) {
          errors.push({ field: 'isOver18', message: 'Altersbestätigung ist erforderlich' });
        }
        break;
    }
    
    set({ errors });
    return errors.length === 0;
  },
  
  addError: (error) => {
    set((state) => ({
      errors: [...state.errors.filter(e => e.field !== error.field), error]
    }));
  },
  
  clearErrors: () => {
    set({ errors: [] });
  },
  
  submitRegistration: async () => {
    const state = get();
    
    // Validate all steps
    for (let step = 1; step <= 4; step++) {
      set({ currentStep: step });
      if (!get().validateCurrentStep()) {
        return false;
      }
    }
    
    set({ isLoading: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // German spec: Save to localStorage for Milestone 1
      const userData = {
        username: state.data.username,
        email: state.data.email,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem('aural-user-registration', JSON.stringify(userData));
      
      set({ 
        isLoading: false, 
        isComplete: true,
        currentStep: 5,
        steps: state.steps.map(step => ({
          ...step,
          isComplete: step.id <= 5,
          isActive: step.id === 5
        }))
      });
      
      return true;
    } catch (error) {
      set({ 
        isLoading: false,
        errors: [{ field: 'general', message: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }]
      });
      return false;
    }
  },
  
  reset: () => {
    set({
      data: initialData,
      currentStep: 1,
      steps: initialSteps,
      errors: [],
      isLoading: false,
      isComplete: false,
    });
  },
  
  canProceed: () => {
    const state = get();
    return state.errors.length === 0 && !state.isLoading;
  },
  
  getStepProgress: () => {
    const state = get();
    return (state.currentStep / 5) * 100;
  },
}));