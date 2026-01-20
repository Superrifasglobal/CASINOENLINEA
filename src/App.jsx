import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GameCard from './components/GameCard';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';
import AntigravityPanel from './components/AntigravityPanel';
import AdminDashboard from './components/admin/AdminDashboard';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminStats, AdminPerformanceChart } from './components/admin/AdminStats';
import { AdminTable } from './components/admin/AdminTable';
import AuthOverlay from './components/AuthOverlay';

// Import game card images or use placeholders
const demoGames = [
  { id: 1, title: 'Royal Roulette', category: 'Table Games', image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80', active: true },
  { id: 2, title: 'Neon Slots', category: 'Slots', image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80', active: false },
  { id: 3, title: 'Quantum Blackjack', category: 'Cards', image: 'https://images.unsplash.com/photo-1518893063934-f71420a2333e?auto=format&fit=crop&q=80', active: false },
  { id: 4, title: 'Astro Dice', category: 'Dice', image: 'https://images.unsplash.com/photo-1533132205560-6364f33fd24b?auto=format&fit=crop&q=80', active: false },
];

function App() {
  const [activeCategory, setActiveCategory] = useState('All Games');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminView, setAdminView] = useState('summary');
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  // Sync user and balance from Supabase
  useEffect(() => {
    const syncUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            username: profile.display_name || profile.email,
            role: profile.role
          });
          setBalance(profile.balance);
        }
      }
    };

    syncUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            username: profile.display_name || profile.email,
            role: profile.role
          });
          setBalance(profile.balance);
        }
      } else {
        setUser(null);
        setBalance(0);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const refreshBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();
    if (data) setBalance(data.balance);
  };
  const [showAuth, setShowAuth] = useState(false);

  if (isAdmin) {
    return (
      <div className="relative">
        <AdminDashboard />
        <button
          onClick={() => setIsAdmin(false)}
          className="fixed bottom-8 right-8 bg-neon-purple text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform z-[100] shadow-[0_0_15px_rgba(176,38,255,0.4)]"
        >
          Volver al Casino
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden relative">
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Header user={user} balance={balance} onLoginClick={() => setShowAuth(true)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
          <AntigravityPanel user={user} balance={balance} onBalanceUpdate={refreshBalance} />

          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Featured Games</h2>
              <button className="text-neon-green text-sm font-medium hover:underline">View All</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoGames.map((game) => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </div>
        </main>

        {(user && user.role === 'admin') && (
          <button
            onClick={() => setIsAdmin(true)}
            className="absolute bottom-8 right-8 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider hover:bg-neon-purple hover:text-white transition-all z-50"
          >
            Admin Mode
          </button>
        )}
      </div>

      <AuthOverlay
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={setUser}
      />

      {/* Ambient background gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-neon-purple/5 blur-[120px]" />
        <div className="absolute bottom-[0%] left-[-10%] w-[30%] h-[30%] rounded-full bg-neon-green/5 blur-[100px]" />
      </div>
    </div>
  );
}

export default App;
