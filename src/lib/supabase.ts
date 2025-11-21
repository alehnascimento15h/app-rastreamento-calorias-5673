import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções helper para o app
export async function saveUserProfile(profile: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: profile.id,
      gender: profile.gender,
      workouts_per_week: profile.workoutsPerWeek,
      referral_source: profile.referralSource,
      tried_other_apps: profile.triedOtherApps,
      height: profile.height,
      weight: profile.weight,
      birth_date: profile.birthDate,
      has_trainer: profile.hasTrainer,
      goal: profile.goal,
      target_weight: profile.targetWeight,
      weekly_weight_change: profile.weeklyWeightChange,
      barriers: profile.barriers,
      diet_type: profile.dietType,
      desires: profile.desires,
      bmr: profile.bmr,
      tdee: profile.tdee,
      daily_calories: profile.dailyCalories,
      completed_onboarding: profile.completedOnboarding,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  
  // Converter snake_case para camelCase
  return {
    id: data.id,
    gender: data.gender,
    workoutsPerWeek: data.workouts_per_week,
    referralSource: data.referral_source,
    triedOtherApps: data.tried_other_apps,
    height: data.height,
    weight: data.weight,
    birthDate: data.birth_date,
    hasTrainer: data.has_trainer,
    goal: data.goal,
    targetWeight: data.target_weight,
    weeklyWeightChange: data.weekly_weight_change,
    barriers: data.barriers,
    dietType: data.diet_type,
    desires: data.desires,
    bmr: data.bmr,
    tdee: data.tdee,
    dailyCalories: data.daily_calories,
    completedOnboarding: data.completed_onboarding,
    createdAt: data.created_at
  };
}

export async function saveFoodEntry(entry: any) {
  const { data, error } = await supabase
    .from('food_entries')
    .insert({
      id: entry.id,
      user_id: entry.userId,
      date: entry.date,
      meal_type: entry.mealType,
      food_name: entry.foodName,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      image_url: entry.imageUrl,
      created_at: entry.createdAt || new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getFoodEntriesByDate(userId: string, date: string) {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  // Converter snake_case para camelCase
  return (data || []).map(entry => ({
    id: entry.id,
    userId: entry.user_id,
    date: entry.date,
    mealType: entry.meal_type,
    foodName: entry.food_name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    imageUrl: entry.image_url,
    createdAt: entry.created_at
  }));
}

export async function getDailyProgress(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  if (!data) return null;
  
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    totalCalories: data.total_calories,
    targetCalories: data.target_calories,
    weight: data.weight,
    createdAt: data.created_at
  };
}

export async function updateDailyProgress(userId: string, date: string, totalCalories: number, targetCalories: number) {
  const { data, error } = await supabase
    .from('daily_progress')
    .upsert({
      user_id: userId,
      date: date,
      total_calories: totalCalories,
      target_calories: targetCalories,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getWeeklyProgress(userId: string) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(entry => ({
    id: entry.id,
    userId: entry.user_id,
    date: entry.date,
    totalCalories: entry.total_calories,
    targetCalories: entry.target_calories,
    weight: entry.weight,
    createdAt: entry.created_at
  }));
}

export async function uploadFoodImage(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('food-images')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('food-images')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
