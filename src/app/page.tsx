'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se usuário já completou onboarding
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (profile.completedOnboarding) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } else {
      router.push('/onboarding');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xl">Carregando BR Calorias AI Cal...</p>
      </div>
    </div>
  );
}
