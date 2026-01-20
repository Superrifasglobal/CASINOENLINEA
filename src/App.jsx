import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GameCard from './components/GameCard';
import AntigravityPanel from './components/AntigravityPanel';
import AdminDashboard from './components/admin/AdminDashboard';
import { supabase } from './lib/supabase';
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
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [showAuth, setShowAuth] = useState(false);

  // Sync user from Supabase
  useEffect(() => {
    console.log("App: Iniciando sincronización de sesión...");

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("App: Sesión inicial recuperada:", session ? "USUARIO PRESENTE" : "NULA");
      if (session) {
        handleUserAuthenticated(session.user);
      }
    }).catch(err => {
      console.error("App: Fallo al obtener sesión inicial:", err);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("App: Evento de Auth detectado:", _event, session ? "SESIÓN ACTIVA" : "SIN SESIÓN");
      if (session) {
        handleUserAuthenticated(session.user);
      } else {
        setUser(null);
        setBalance(0);
        setIsAdmin(false);
      }
    });

    return () => {
      console.log("App: Limpiando listener de suscripción");
      subscription.unsubscribe();
    };
  }, []);

  const handleUserAuthenticated = (supabaseUser) => {
    try {
      if (!supabaseUser) return;

      console.log("Procesando usuario autenticado:", supabaseUser.email);

      // Logic for identifying admin
      const isAdminUser = supabaseUser.email === 'nexjmr07@gmail.com' || supabaseUser.user_metadata?.role === 'admin';

      const email = supabaseUser.email || "";
      const username = supabaseUser.user_metadata?.display_name || email.split('@')[0] || "Usuario";

      setUser({
        id: supabaseUser.id,
        email: email,
        username: username,
        role: isAdminUser ? 'admin' : 'user',
      });

      // Simulated balance
      setBalance(1000.0);
    } catch (error) {
      console.error("Error crítico en handleUserAuthenticated:", error);
      alert("Error al cargar perfil de usuario. Revisa la consola.");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setBalance(0);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshBalance = async () => {
    // Implementar llamada real a /api/getBalance con el token de Supabase
    console.log('Refreshing balance logic to be implemented with Supabase session');
  };

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
