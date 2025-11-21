'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';
import { calculateBMR, calculateTDEE, calculateDailyCalories } from '@/lib/calculations';
import { saveUserProfile } from '@/lib/supabase';
import { ChevronRight, Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    barriers: [],
    desires: [],
  });

  const totalSteps = 19;

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    // Calcular métricas
    const age = profile.birthDate 
      ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
      : 25;
    
    const bmr = calculateBMR(
      profile.weight || 70,
      profile.height || 170,
      age,
      profile.gender || 'masculino'
    );

    const activityLevel = profile.workoutsPerWeek === '6+' ? 1.725 :
                         profile.workoutsPerWeek === '3-5' ? 1.55 : 1.375;
    
    const tdee = calculateTDEE(bmr, activityLevel);
    
    const dailyCalories = calculateDailyCalories(
      tdee,
      profile.goal || 'manter',
      profile.weeklyWeightChange || 0.5
    );

    const completeProfile: UserProfile = {
      ...profile as UserProfile,
      id: `user_${Date.now()}`,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      dailyCalories: Math.round(dailyCalories),
      completedOnboarding: true,
      createdAt: new Date().toISOString(),
    };

    // Salvar no localStorage
    localStorage.setItem('userProfile', JSON.stringify(completeProfile));

    // Tentar salvar no Supabase
    try {
      await saveUserProfile(completeProfile);
      console.log('✅ Perfil salvo no Supabase com sucesso!');
    } catch (error) {
      console.log('⚠️ Usando localStorage (Supabase não configurado)');
    }

    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Escolha seu gênero</h1>
              <p className="text-white/60 text-lg">Para personalizar seu plano</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['masculino', 'feminino', 'outro'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => {
                    updateProfile({ gender: gender as any });
                    nextStep();
                  }}
                  className="p-8 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-xl font-bold capitalize"
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Quantos treinos faz por semana?</h1>
              <p className="text-white/60 text-lg">Isso ajuda a calcular seu gasto calórico</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['0-2', '3-5', '6+'].map((freq) => (
                <button
                  key={freq}
                  onClick={() => {
                    updateProfile({ workoutsPerWeek: freq as any });
                    nextStep();
                  }}
                  className="p-8 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-xl font-bold"
                >
                  {freq} treinos
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Onde você ouviu falar de nós?</h1>
              <p className="text-white/60 text-lg">Queremos saber como nos encontrou</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {['google', 'tiktok', 'instagram', 'amigo', 'tv', 'x', 'appstore', 'facebook', 'youtube', 'outro'].map((source) => (
                <button
                  key={source}
                  onClick={() => {
                    updateProfile({ referralSource: source as any });
                    nextStep();
                  }}
                  className="p-6 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all font-bold capitalize"
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Você já tentou outros apps de contagem de calorias?</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { value: true, label: 'Sim' },
                { value: false, label: 'Não' }
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    updateProfile({ triedOtherApps: option.value });
                    nextStep();
                  }}
                  className="p-8 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-xl font-bold"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">BR Rastreamento AI Cal</h1>
              <p className="text-2xl text-white/80">Cria resultados a longo prazo</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop" 
                alt="Motivação" 
                className="w-full h-80 object-cover rounded-2xl"
              />
            </div>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              "A jornada de mil quilômetros começa com um único passo. Você está no caminho certo!"
            </p>
            <button
              onClick={nextStep}
              className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Altura e Peso</h1>
              <p className="text-white/60 text-lg">Informações essenciais para seu plano</p>
            </div>
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Altura (cm)</label>
                <input
                  type="number"
                  placeholder="170"
                  onChange={(e) => updateProfile({ height: parseFloat(e.target.value) })}
                  className="w-full p-4 bg-white/5 border-2 border-white/20 rounded-xl text-white text-lg focus:border-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Peso (kg)</label>
                <input
                  type="number"
                  placeholder="70"
                  onChange={(e) => updateProfile({ weight: parseFloat(e.target.value) })}
                  className="w-full p-4 bg-white/5 border-2 border-white/20 rounded-xl text-white text-lg focus:border-white focus:outline-none"
                />
              </div>
              <button
                onClick={nextStep}
                disabled={!profile.height || !profile.weight}
                className="w-full p-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Data de Nascimento</h1>
              <p className="text-white/60 text-lg">Para calcular seu metabolismo</p>
            </div>
            <div className="max-w-md mx-auto space-y-6">
              <input
                type="date"
                onChange={(e) => updateProfile({ birthDate: e.target.value })}
                className="w-full p-4 bg-white/5 border-2 border-white/20 rounded-xl text-white text-lg focus:border-white focus:outline-none"
              />
              <button
                onClick={nextStep}
                disabled={!profile.birthDate}
                className="w-full p-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Você trabalha com um treinador ou nutricionista?</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { value: true, label: 'Sim' },
                { value: false, label: 'Não' }
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    updateProfile({ hasTrainer: option.value });
                    nextStep();
                  }}
                  className="p-8 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-xl font-bold"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Qual é seu objetivo?</h1>
              <p className="text-white/60 text-lg">Vamos personalizar seu plano</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: 'perder', label: 'Perder Peso' },
                { value: 'manter', label: 'Manter Peso' },
                { value: 'ganhar', label: 'Ganhar Peso' }
              ].map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => {
                    updateProfile({ goal: goal.value as any });
                    nextStep();
                  }}
                  className="p-8 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-xl font-bold"
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Qual é seu peso desejado?</h1>
              <p className="text-white/60 text-lg">Defina sua meta</p>
            </div>
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Peso desejado (kg)</label>
                <input
                  type="number"
                  placeholder="65"
                  onChange={(e) => updateProfile({ targetWeight: parseFloat(e.target.value) })}
                  className="w-full p-4 bg-white/5 border-2 border-white/20 rounded-xl text-white text-lg focus:border-white focus:outline-none"
                />
              </div>
              <button
                onClick={nextStep}
                disabled={!profile.targetWeight}
                className="w-full p-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 11:
        const weightDiff = Math.abs((profile.weight || 70) - (profile.targetWeight || 65));
        const motivationalPhrase = profile.goal === 'perder' 
          ? `Você está a ${weightDiff}kg da sua meta! Com o BR Cal AI, você vai conseguir de forma saudável e sustentável.`
          : profile.goal === 'ganhar'
          ? `Ganhar ${weightDiff}kg de forma saudável é possível! O BR Cal AI vai te guiar nessa jornada.`
          : `Manter seu peso ideal é uma conquista! O BR Cal AI vai te ajudar a manter seus resultados.`;

        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Sua Jornada Começa Aqui!</h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">{motivationalPhrase}</p>
            </div>
            <div className="max-w-2xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                  <div className="text-sm text-white/60">Peso Atual</div>
                  <div className="text-3xl font-bold">{profile.weight}kg</div>
                </div>
                <div>
                  <div className="text-sm text-white/60">Peso Desejado</div>
                  <div className="text-3xl font-bold">{profile.targetWeight}kg</div>
                </div>
              </div>
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              O BR Cal AI usa inteligência artificial para tornar o rastreamento de calorias simples e eficaz. Você está no caminho certo!
            </p>
            <button
              onClick={nextStep}
              className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 12:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Quão rápido você quer alcançar sua meta?</h1>
              <p className="text-white/60 text-lg">Escolha um ritmo saudável</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: 0.25, label: '0.25kg por semana', subtitle: 'Lento e sustentável' },
                { value: 0.5, label: '0.5kg por semana', subtitle: 'Recomendado' },
                { value: 0.75, label: '0.75kg por semana', subtitle: 'Acelerado' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    updateProfile({ weeklyWeightChange: option.value });
                    nextStep();
                  }}
                  className="p-6 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-left"
                >
                  <div className="font-bold text-lg mb-1">{option.label}</div>
                  <div className="text-sm text-white/60">{option.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 13:
        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">BR Cal AI</h1>
              <p className="text-2xl text-white/80">Rastreamento inteligente de calorias</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">📸</div>
                    <div className="text-sm text-white/80">Tire fotos da comida</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">🤖</div>
                    <div className="text-sm text-white/80">IA detecta calorias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">📊</div>
                    <div className="text-sm text-white/80">Acompanhe progresso</div>
                  </div>
                </div>
              </div>
              <p className="text-lg text-white/70">
                Mais de 100.000 usuários já alcançaram suas metas com o BR Cal AI!
              </p>
            </div>
            <button
              onClick={nextStep}
              className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 14:
        const barriers = [
          'Falta de consistência',
          'Hábitos alimentares não saudáveis',
          'Falta de apoio',
          'Agenda lotada',
          'Falta de inspiração para refeições'
        ];

        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">O que está impedindo você de atingir seus objetivos?</h1>
              <p className="text-white/60 text-lg">Selecione todos que se aplicam</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {barriers.map((barrier) => (
                <button
                  key={barrier}
                  onClick={() => {
                    const current = profile.barriers || [];
                    const updated = current.includes(barrier)
                      ? current.filter(b => b !== barrier)
                      : [...current, barrier];
                    updateProfile({ barriers: updated });
                  }}
                  className={`p-6 border-2 rounded-2xl transition-all text-left ${
                    profile.barriers?.includes(barrier)
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 border-white/20 hover:border-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{barrier}</span>
                    {profile.barriers?.includes(barrier) && <Check className="w-5 h-5" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={nextStep}
                disabled={!profile.barriers || profile.barriers.length === 0}
                className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 15:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Você segue alguma dieta específica?</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { value: 'classico', label: 'Clássico' },
                { value: 'pescetariano', label: 'Pescetariano' },
                { value: 'vegetariano', label: 'Vegetariano' },
                { value: 'vegano', label: 'Vegano' }
              ].map((diet) => (
                <button
                  key={diet.value}
                  onClick={() => {
                    updateProfile({ dietType: diet.value as any });
                    nextStep();
                  }}
                  className="p-8 bg-white/5 border-2 border-white/20 rounded-2xl hover:border-white hover:bg-white/10 transition-all text-xl font-bold"
                >
                  {diet.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 16:
        const desires = [
          'Comer e viver de forma saudável',
          'Aumentar minha energia e meu humor',
          'Manter-se motivado e consistente',
          'Sentir-me melhor com meu corpo'
        ];

        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">O que você gostaria de alcançar?</h1>
              <p className="text-white/60 text-lg">Selecione todos que se aplicam</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {desires.map((desire) => (
                <button
                  key={desire}
                  onClick={() => {
                    const current = profile.desires || [];
                    const updated = current.includes(desire)
                      ? current.filter(d => d !== desire)
                      : [...current, desire];
                    updateProfile({ desires: updated });
                  }}
                  className={`p-6 border-2 rounded-2xl transition-all text-left ${
                    profile.desires?.includes(desire)
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 border-white/20 hover:border-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{desire}</span>
                    {profile.desires?.includes(desire) && <Check className="w-5 h-5" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={nextStep}
                disabled={!profile.desires || profile.desires.length === 0}
                className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 17:
        const weeksToGoal = profile.weeklyWeightChange 
          ? Math.abs((profile.weight || 70) - (profile.targetWeight || 65)) / profile.weeklyWeightChange
          : 12;

        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Você tem grande potencial!</h1>
              <p className="text-xl text-white/80">Para alcançar sua meta</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
                <div className="text-6xl font-bold mb-4">{Math.round(weeksToGoal)}</div>
                <div className="text-2xl text-white/80 mb-6">semanas para sua meta</div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/4" />
                </div>
                <div className="text-sm text-white/60 mt-4">Você está começando sua jornada!</div>
              </div>
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              "O sucesso é a soma de pequenos esforços repetidos dia após dia."
            </p>
            <button
              onClick={nextStep}
              className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 18:
        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">Obrigado por confiar em nós!</h1>
              <p className="text-xl text-white/80">Você está prestes a transformar sua vida</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <img 
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop" 
                alt="Motivação" 
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Estamos animados para fazer parte da sua jornada de saúde e bem-estar!
            </p>
            <button
              onClick={nextStep}
              className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 19:
        return (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold">O que nossos usuários dizem</h1>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  name: 'Maria Silva',
                  text: 'Perdi 15kg em 3 meses! O app é incrível e a IA facilita muito.',
                  rating: 5
                },
                {
                  name: 'João Santos',
                  text: 'Melhor app de calorias que já usei. Super prático e eficiente!',
                  rating: 5
                },
                {
                  name: 'Ana Costa',
                  text: 'Finalmente consegui manter minha dieta. Recomendo muito!',
                  rating: 5
                }
              ].map((review, index) => (
                <div key={index} className="bg-white/5 border border-white/20 rounded-2xl p-6 text-left">
                  <div className="flex gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                  <p className="text-white/80 mb-4">"{review.text}"</p>
                  <div className="font-bold">{review.name}</div>
                </div>
              ))}
            </div>
            <button
              onClick={handleComplete}
              className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Começar Agora <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-8 text-center">
          <div className="text-sm text-white/60">Passo {step} de {totalSteps}</div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
