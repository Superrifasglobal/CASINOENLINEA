import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GameCard from './components/GameCard';
import AntigravityPanel from './components/AntigravityPanel';
import AdminDashboard from './components/admin/AdminDashboard';
import { supabase } from './lib/supabase';
import AuthOverlay from './components/AuthOverlay';
import ProfileOverlay from './components/ProfileOverlay';
import NeonSlots from './components/NeonSlots';
import CrashGame from './components/CrashGame';

// Import game card images or use placeholders
const demoGames = [
  { id: 1, title: 'Royal Roulette', category: 'Table Games', image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80', active: true },
  { id: 2, title: 'Neon Slots', category: 'Slots', image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80', active: false },
  { id: 3, title: 'Gravity Crash', category: 'Originals', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80', active: true },
  { id: 4, title: 'Quantum Blackjack', category: 'Cards', image: 'https://images.unsplash.com/photo-1518893063934-f71420a2333e?auto=format&fit=crop&q=80', active: false },
];

function App() {
  const [activeCategory, setActiveCategory] = useState('All Games');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

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
        setShowProfile(false);
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
      const emailLower = supabaseUser.email ? supabaseUser.email.toLowerCase() : '';
      const isAdminUser = emailLower === 'nexjmr07@gmail.com' || supabaseUser.user_metadata?.role === 'admin';

      if (isAdminUser) {
        console.log("👑 ADMIN ACCESS GRANTED for:", emailLower);
      }

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
      setIsAdmin(false);
      setShowProfile(false);
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
        <Header
          user={user}
          balance={balance}
          onLoginClick={() => setShowAuth(true)}
          onProfileClick={() => setShowProfile(true)}
        />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">

          {activeGame === 'roulette' ? (
            <div className="max-w-6xl mx-auto">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-gray-400 hover:text-white">← Volver al Lobby</button>
              <AntigravityPanel user={user} balance={balance} onBalanceUpdate={refreshBalance} />
            </div>
          ) : activeGame === 'slots' ? (
            <NeonSlots user={user} balance={balance} onBalanceUpdate={refreshBalance} onBack={() => setActiveGame(null)} />
          ) : activeGame === 'crash' ? (
            <CrashGame user={user} balance={balance} onBalanceUpdate={refreshBalance} onBack={() => setActiveGame(null)} />
          ) : (
            <>
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black italic mb-6 tracking-tighter">WELCOME TO ANTIGRAVITY</h1>
                <div className="relative h-[400px] w-full rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/10 shadow-2xl" onClick={() => setActiveGame('roulette')}>
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10 p-12 flex flex-col justify-center">
                    <span className="text-neon-green font-bold tracking-widest uppercase mb-2">Juego Destacado</span>
                    <h2 className="text-6xl font-black text-white mb-4">ROYAL ROULETTE</h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-lg">Experimenta la emoción de la ruleta en gravedad cero. Multiplicadores en vivo y pagos instantáneos.</p>
                    <button className="bg-white text-black px-8 py-4 rounded-full font-black w-fit hover:scale-105 transition-transform hover:bg-neon-green hover:shadow-[0_0_30px_#00ff9d]">JUGAR AHORA</button>
                  </div>
                  <img src="https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2574&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="Roulette Banner" />
                </div>
              </div>

              <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Todos los Juegos</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {demoGames.map((game) => (
                    <div key={game.id} onClick={() => {
                      if (game.id === 1) setActiveGame('roulette');
                      if (game.id === 2) setActiveGame('slots');
                      if (game.id === 3) setActiveGame('crash');
                    }}>
                      <GameCard {...game} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

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

      <ProfileOverlay
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onLogout={handleLogout}
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
