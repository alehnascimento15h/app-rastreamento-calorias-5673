export interface UserProfile {
  id?: string;
  // Step 1: Gênero
  gender: 'masculino' | 'feminino' | 'outro' | null;
  
  // Step 2: Treinos por semana
  workoutsPerWeek: '0-2' | '3-5' | '6+' | null;
  
  // Step 3: Origem
  referralSource: 'google' | 'tiktok' | 'instagram' | 'amigo' | 'tv' | 'x' | 'appstore' | 'facebook' | 'youtube' | 'outro' | null;
  
  // Step 4: Experiência prévia
  triedOtherApps: boolean | null;
  
  // Step 6: Altura e peso
  height: number | null; // em cm
  weight: number | null; // em kg
  
  // Step 7: Data de nascimento
  birthDate: string | null;
  
  // Step 8: Treinador/Nutricionista
  hasTrainer: boolean | null;
  
  // Step 9: Objetivo
  goal: 'perder' | 'manter' | 'ganhar' | null;
  
  // Step 10: Peso desejado
  targetWeight: number | null;
  
  // Step 12: Velocidade da meta
  weeklyWeightChange: number | null; // kg por semana
  
  // Step 14: Barreiras
  barriers: string[];
  
  // Step 15: Dieta específica
  dietType: 'classico' | 'pescetariano' | 'vegetariano' | 'vegano' | null;
  
  // Step 16: O que deseja alcançar
  desires: string[];
  
  // Cálculos
  bmr?: number; // Taxa Metabólica Basal
  tdee?: number; // Gasto Energético Diário Total
  dailyCalories?: number; // Meta de calorias diárias
  
  // Metadata
  createdAt?: string;
  completedOnboarding?: boolean;
}

export interface FoodEntry {
  id?: string;
  userId: string;
  date: string;
  mealType: 'cafe' | 'almoco' | 'jantar' | 'lanche';
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  createdAt?: string;
}

export interface DailyProgress {
  id?: string;
  userId: string;
  date: string;
  totalCalories: number;
  targetCalories: number;
  weight?: number;
  createdAt?: string;
}
