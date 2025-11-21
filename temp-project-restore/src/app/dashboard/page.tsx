'use client';

import { useState, useEffect } from 'react';
import { UserProfile, FoodEntry } from '@/types/user';
import { Camera, Plus, TrendingUp, Target, Flame, Apple, Calendar, Award, ChevronRight, Upload, X, Trash2 } from 'lucide-react';
import { getFoodEntriesByDate, saveFoodEntry, getWeeklyProgress, updateDailyProgress, uploadFoodImage } from '@/lib/supabase';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadProfile();
    loadTodayEntries();
    loadWeeklyData();
  }, []);

  const loadProfile = async () => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  };

  const loadTodayEntries = async () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        const entries = await getFoodEntriesByDate(prof.id, today);
        setTodayEntries(entries);
        
        // Atualizar progresso diário
        const totalCals = entries.reduce((sum, e) => sum + e.calories, 0);
        await updateDailyProgress(prof.id, today, totalCals, prof.dailyCalories);
      }
    } catch (error) {
      console.log('Usando localStorage');
      const saved = localStorage.getItem(`entries_${today}`);
      if (saved) {
        setTodayEntries(JSON.parse(saved));
      }
    }
  };

  const loadWeeklyData = async () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        const data = await getWeeklyProgress(prof.id);
        setWeeklyData(data);
      }
    } catch (error) {
      console.log('Dados semanais não disponíveis');
    }
  };

  const totalCaloriesToday = todayEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const remainingCalories = (profile?.dailyCalories || 2000) - totalCaloriesToday;
  const progressPercentage = Math.min((totalCaloriesToday / (profile?.dailyCalories || 2000)) * 100, 100);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simular análise de IA
    setIsAnalyzing(true);
    
    setTimeout(async () => {
      const mockFoods = [
        { name: 'Arroz com Feijão', calories: 350, protein: 12, carbs: 65, fat: 5 },
        { name: 'Frango Grelhado', calories: 280, protein: 45, carbs: 0, fat: 10 },
        { name: 'Salada Verde', calories: 80, protein: 3, carbs: 15, fat: 2 },
        { name: 'Macarrão à Bolonhesa', calories: 450, protein: 20, carbs: 60, fat: 15 },
        { name: 'Pizza Margherita', calories: 520, protein: 18, carbs: 55, fat: 22 },
        { name: 'Hambúrguer', calories: 680, protein: 30, carbs: 45, fat: 35 },
        { name: 'Sushi', calories: 320, protein: 15, carbs: 50, fat: 8 },
        { name: 'Smoothie de Frutas', calories: 180, protein: 5, carbs: 40, fat: 2 },
        { name: 'Omelete com Legumes', calories: 220, protein: 18, carbs: 8, fat: 14 },
        { name: 'Sanduíche Natural', calories: 290, protein: 15, carbs: 35, fat: 10 },
      ];

      const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      
      // Upload da imagem para Supabase Storage
      let imageUrl = selectedImage;
      try {
        if (file && profile?.id) {
          imageUrl = await uploadFoodImage(file, profile.id);
        }
      } catch (error) {
        console.log('Usando preview local da imagem');
      }

      const newEntry: FoodEntry = {
        id: `entry_${Date.now()}`,
        userId: profile?.id || 'temp',
        date: today,
        mealType: 'almoco',
        foodName: randomFood.name,
        calories: randomFood.calories,
        protein: randomFood.protein,
        carbs: randomFood.carbs,
        fat: randomFood.fat,
        imageUrl: imageUrl || undefined,
        createdAt: new Date().toISOString(),
      };

      // Salvar entrada
      const updatedEntries = [...todayEntries, newEntry];
      setTodayEntries(updatedEntries);
      localStorage.setItem(`entries_${today}`, JSON.stringify(updatedEntries));

      // Salvar no Supabase
      try {
        await saveFoodEntry(newEntry);
        
        // Atualizar progresso diário
        const totalCals = updatedEntries.reduce((sum, e) => sum + e.calories, 0);
        await updateDailyProgress(profile?.id || 'temp', today, totalCals, profile?.dailyCalories || 2000);
        
        console.log('✅ Entrada salva no Supabase!');
      } catch (error) {
        console.log('⚠️ Usando localStorage');
      }

      setIsAnalyzing(false);
      setShowAddFood(false);
      setSelectedImage(null);
      setSelectedFile(null);
    }, 2000);
  };

  const handleManualAdd = () => {
    const foodName = prompt('Nome da comida:');
    const calories = prompt('Calorias:');
    
    if (foodName && calories) {
      const newEntry: FoodEntry = {
        id: `entry_${Date.now()}`,
        userId: profile?.id || 'temp',
        date: today,
        mealType: 'lanche',
        foodName,
        calories: parseInt(calories),
        createdAt: new Date().toISOString(),
      };

      const updatedEntries = [...todayEntries, newEntry];
      setTodayEntries(updatedEntries);
      localStorage.setItem(`entries_${today}`, JSON.stringify(updatedEntries));

      try {
        saveFoodEntry(newEntry);
        const totalCals = updatedEntries.reduce((sum, e) => sum + e.calories, 0);
        updateDailyProgress(profile?.id || 'temp', today, totalCals, profile?.dailyCalories || 2000);
      } catch (error) {
        console.log('Usando localStorage');
      }

      setShowAddFood(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const updatedEntries = todayEntries.filter(e => e.id !== entryId);
    setTodayEntries(updatedEntries);
    localStorage.setItem(`entries_${today}`, JSON.stringify(updatedEntries));

    try {
      const totalCals = updatedEntries.reduce((sum, e) => sum + e.calories, 0);
      await updateDailyProgress(profile?.id || 'temp', today, totalCals, profile?.dailyCalories || 2000);
    } catch (error) {
      console.log('Erro ao atualizar progresso');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">BR Calorias AI Cal</h1>
              <p className="text-white/60 mt-1">Olá! Vamos alcançar sua meta hoje 🎯</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Peso Atual</div>
              <div className="text-2xl font-bold">{profile.weight}kg</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-sm text-white/60">Calorias Hoje</div>
            </div>
            <div className="text-3xl font-bold">{totalCaloriesToday}</div>
            <div className="text-sm text-white/60 mt-1">de {profile.dailyCalories} kcal</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-sm text-white/60">Restante</div>
            </div>
            <div className="text-3xl font-bold">{remainingCalories}</div>
            <div className="text-sm text-white/60 mt-1">kcal disponíveis</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-sm text-white/60">Meta</div>
            </div>
            <div className="text-3xl font-bold">{profile.targetWeight}kg</div>
            <div className="text-sm text-white/60 mt-1">peso desejado</div>
          </div>
        </div>

        {/* Progresso Diário */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Progresso de Hoje</h2>
            <span className="text-sm text-white/60">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-white/60">
            <span>0 kcal</span>
            <span>{profile.dailyCalories} kcal</span>
          </div>
        </div>

        {/* Botão Adicionar Comida com IA */}
        <button
          onClick={() => setShowAddFood(true)}
          className="bg-white text-black p-6 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-3 w-full"
        >
          <Camera className="w-6 h-6" />
          Tirar Foto da Comida
        </button>

        {/* Modal de Upload */}
        {showAddFood && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black border-2 border-white/20 rounded-2xl p-6 max-w-md w-full space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Adicionar Comida</h3>
                <button
                  onClick={() => {
                    setShowAddFood(false);
                    setSelectedImage(null);
                    setIsAnalyzing(false);
                  }}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isAnalyzing ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-lg">Analisando sua comida com IA...</p>
                  <p className="text-sm text-white/60">Identificando alimentos e calculando calorias</p>
                </div>
              ) : selectedImage ? (
                <div className="space-y-4">
                  <img src={selectedImage} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="w-full p-4 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all"
                  >
                    Escolher Outra Foto
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-white/60" />
                    <p className="text-lg font-medium mb-2">Clique para fazer upload</p>
                    <p className="text-sm text-white/60">ou tire uma foto</p>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Gráfico Semanal */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Progresso Semanal
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
              const isToday = index === new Date().getDay();
              const dayData = weeklyData.find(d => new Date(d.date).getDay() === index);
              const progress = dayData 
                ? (dayData.totalCalories / dayData.targetCalories) * 100
                : Math.random() * 100;
              
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-white/60 mb-2">{day}</div>
                  <div className="h-24 bg-white/5 rounded-lg overflow-hidden relative">
                    <div 
                      className={`absolute bottom-0 w-full transition-all ${
                        isToday ? 'bg-white' : 'bg-white/40'
                      }`}
                      style={{ height: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  {isToday && (
                    <div className="text-xs text-white mt-1 font-bold">Hoje</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dicas e Motivação */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Dica do Dia</h3>
              <p className="text-white/80">
                Beba pelo menos 2 litros de água hoje! A hidratação adequada ajuda no metabolismo e na queima de calorias.
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Perfil */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Seu Plano Personalizado</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-white/60 mb-1">TMB</div>
              <div className="text-xl font-bold">{profile.bmr}</div>
              <div className="text-xs text-white/40">kcal/dia</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-white/60 mb-1">TDEE</div>
              <div className="text-xl font-bold">{profile.tdee}</div>
              <div className="text-xs text-white/40">kcal/dia</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-white/60 mb-1">Meta</div>
              <div className="text-xl font-bold capitalize">{profile.goal}</div>
              <div className="text-xs text-white/40">peso</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-white/60 mb-1">Ritmo</div>
              <div className="text-xl font-bold">{profile.weeklyWeightChange}kg</div>
              <div className="text-xs text-white/40">por semana</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
