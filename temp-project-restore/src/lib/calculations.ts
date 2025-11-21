import { UserProfile } from '@/types/user';

// Calcular Taxa Metabólica Basal (TMB) usando fórmula de Mifflin-St Jeor
// Sobrecarga: aceita tanto UserProfile quanto parâmetros individuais
export function calculateBMR(
  weightOrProfile: number | UserProfile,
  height?: number,
  age?: number,
  gender?: string
): number {
  let weight: number;
  let heightValue: number;
  let ageValue: number;
  let genderValue: string;

  // Se receber um objeto UserProfile
  if (typeof weightOrProfile === 'object') {
    const profile = weightOrProfile;
    if (!profile.weight || !profile.height || !profile.birthDate) return 0;
    
    weight = profile.weight;
    heightValue = profile.height;
    ageValue = calculateAge(profile.birthDate);
    genderValue = profile.gender || 'masculino';
  } else {
    // Se receber parâmetros individuais
    weight = weightOrProfile;
    heightValue = height || 170;
    ageValue = age || 25;
    genderValue = gender || 'masculino';
  }
  
  let bmr = 0;
  
  if (genderValue === 'masculino') {
    bmr = 10 * weight + 6.25 * heightValue - 5 * ageValue + 5;
  } else if (genderValue === 'feminino') {
    bmr = 10 * weight + 6.25 * heightValue - 5 * ageValue - 161;
  } else {
    // Para "outro", usar média
    bmr = 10 * weight + 6.25 * heightValue - 5 * ageValue - 78;
  }
  
  return Math.round(bmr);
}

// Calcular Gasto Energético Diário Total (TDEE)
export function calculateTDEE(bmr: number, activityMultiplier: number | string): number {
  let multiplier = 1.2; // Sedentário
  
  if (typeof activityMultiplier === 'string') {
    switch (activityMultiplier) {
      case '0-2':
        multiplier = 1.375; // Levemente ativo
        break;
      case '3-5':
        multiplier = 1.55; // Moderadamente ativo
        break;
      case '6+':
        multiplier = 1.725; // Muito ativo
        break;
    }
  } else {
    multiplier = activityMultiplier;
  }
  
  return Math.round(bmr * multiplier);
}

// Calcular meta de calorias diárias baseado no objetivo
export function calculateDailyCalories(
  tdee: number,
  goal: string,
  weeklyWeightChange: number
): number {
  let dailyCalories = tdee;
  
  // 1 kg de gordura = ~7700 calorias
  // Déficit/superávit diário = (7700 * kg por semana) / 7 dias
  const dailyCalorieAdjustment = (7700 * weeklyWeightChange) / 7;
  
  if (goal === 'perder') {
    dailyCalories = tdee - dailyCalorieAdjustment;
  } else if (goal === 'ganhar') {
    dailyCalories = tdee + dailyCalorieAdjustment;
  }
  
  // Limites de segurança
  if (dailyCalories < 1200) dailyCalories = 1200;
  if (dailyCalories > 4000) dailyCalories = 4000;
  
  return Math.round(dailyCalories);
}

// Calcular idade a partir da data de nascimento
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Gerar frase motivacional personalizada
export function generateMotivationalPhrase(profile: UserProfile): string {
  const phrases = [
    `Você está prestes a transformar ${Math.abs((profile.targetWeight || 0) - (profile.weight || 0))}kg em pura determinação!`,
    `Sua jornada para ${profile.goal === 'perder' ? 'perder' : profile.goal === 'ganhar' ? 'ganhar' : 'manter'} peso começa agora. Vamos juntos!`,
    `Com ${profile.workoutsPerWeek} treinos por semana, você já está no caminho certo!`,
    `Cada dia é uma nova oportunidade de se aproximar dos seus ${profile.targetWeight}kg!`,
    `Seu objetivo de ${profile.goal} peso está mais perto do que você imagina!`
  ];
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Estimar tempo para atingir meta
export function estimateTimeToGoal(
  currentWeight: number,
  targetWeight: number,
  weeklyChange: number
): number {
  const totalWeightChange = Math.abs(targetWeight - currentWeight);
  const weeks = totalWeightChange / weeklyChange;
  return Math.ceil(weeks);
}
