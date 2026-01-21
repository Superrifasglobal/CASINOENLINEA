import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalChat from './components/GlobalChat';
import GameCard from './components/GameCard';
import AntigravityPanel from './components/AntigravityPanel';
import AdminDashboard from './components/admin/AdminDashboard';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase } from './lib/supabase';
import AuthOverlay from './components/auth/AuthOverlay';
import ProfileOverlay from './components/ProfileOverlay';
import NeonSlots from './components/NeonSlots';
import CrashGame from './components/CrashGame';
import MinesGame from './components/games/MinesGame'; // Added MinesGame import
import AntigravityConsole from './components/AntigravityConsole';
import Roulette3D from './components/Roulette3D';

// Import game card images or use placeholders
const demoGames = [
  { id: 1, title: 'Ruleta Real', category: 'Tables', image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80', active: true },
  { id: 2, title: 'Tragamonedas Neón', category: 'Slots', image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80', active: false },
  { id: 3, title: 'Gravity Crash', category: 'Originals', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80', active: true },
  { id: 4, title: 'Ruleta 3D PRO', category: 'Tables', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2574&auto=format&fit=crop', active: true },
  { id: 6, title: 'Minas de Gravedad', category: 'Originals', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80', active: true },
  { id: 5, title: 'Consola Antigravity', category: 'Admin', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80', active: true },
];

function App() {
  const [activeCategory, setActiveCategory] = useState('Home');
  const [isAdmin, setIsAdmin] = useState(false); // Reverted to false to prevent black screen on boot
  const [user, setUser] = useState(null);
  console.log("App: Renderizando. User:", user?.email, "isAdmin:", isAdmin);
  const [balance, setBalance] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

  // Sync user from Firebase
  useEffect(() => {
    console.log("App: Iniciando sincronización de sesión con Firebase...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("App: Evento de Auth detectado:", firebaseUser ? "USUARIO PRESENTE" : "NULA");
      if (firebaseUser) {
        await syncUserProfile(firebaseUser);
        handleUserAuthenticated(firebaseUser);
      } else {
        setUser(null);
        setBalance(0);
        setIsAdmin(false);
        setShowProfile(false);
      }
    });

    return () => {
      console.log("App: Limpiando listener de Firebase");
      unsubscribe();
    };
  }, []);

  const syncUserProfile = async (firebaseUser) => {
    try {
      console.log("Sincronizando perfil con Supabase para:", firebaseUser.uid);

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          display_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.warn("Aviso en syncUserProfile (¿Tal vez el SQL no se ha ejecutado?):", error.message);
      } else {
        console.log("Perfil sincronizado correctamente.");
      }
    } catch (err) {
      console.error("Error en syncUserProfile:", err);
    }
  };

  const handleUserAuthenticated = async (firebaseUser) => {
    try {
      if (!firebaseUser) return;

      console.log("Procesando usuario autenticado:", firebaseUser.email);

      // Fetch current balance and role from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', firebaseUser.uid)
        .single();

      // Logic for identifying admin
      const emailLower = firebaseUser.email ? firebaseUser.email.toLowerCase() : '';
      const isAdminUser = emailLower === 'nexjmr07@gmail.com' || profile?.role === 'ADMIN';

      if (isAdminUser) {
        console.log("👑 ADMIN ACCESS GRANTED for:", emailLower);
      }

      const email = firebaseUser.email || "";
      const username = profile?.display_name || firebaseUser.displayName || email.split('@')[0] || "Usuario";

      setIsAdmin(isAdminUser);

      setUser({
        id: firebaseUser.uid,
        email: email,
        username: username,
        role: isAdminUser ? 'admin' : 'user',
        balance: profile?.balance || 0
      });

      // Updated balance from DB
      setBalance(profile?.balance || 0);
    } catch (error) {
      console.error("Error crítico en handleUserAuthenticated:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setBalance(0);
      setIsAdmin(false);
      setShowProfile(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();
    if (data) setBalance(data.balance);
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
      <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Header
          user={user}
          balance={balance}
          onLoginClick={() => setShowAuth(true)}
          onProfileClick={() => setShowProfile(true)}
          onChatToggle={() => setShowChat(!showChat)}
        />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">

          {activeGame === 'roulette' ? (
            <div className="max-w-6xl mx-auto">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-gray-400 hover:text-white flex items-center gap-2">
                <span className="text-xl">←</span> Volver al Lobby
              </button>
              <Roulette3D user={user} balance={balance} onBalanceUpdate={refreshBalance} />
            </div>
          ) : activeGame === 'roulette_classic' ? (
            <div className="max-w-6xl mx-auto">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-gray-400 hover:text-white">← Volver al Lobby</button>
              <AntigravityPanel user={user} balance={balance} onBalanceUpdate={refreshBalance} />
            </div>
          ) : activeGame === 'slots' ? (
            <NeonSlots user={user} balance={balance} onBalanceUpdate={refreshBalance} onBack={() => setActiveGame(null)} />
          ) : activeGame === 'crash' ? (
            <CrashGame user={user} balance={balance} onBalanceUpdate={refreshBalance} onBack={() => setActiveGame(null)} />
          ) : activeGame === 'mines' ? ( // Added MinesGame rendering
            <MinesGame user={user} balance={balance} onBalanceUpdate={refreshBalance} onBack={() => setActiveGame(null)} />
          ) : activeGame === 'antigravity_console' ? (
            <div className="max-w-7xl mx-auto">
              <button onClick={() => setActiveGame(null)} className="mb-8 text-gray-400 hover:text-white flex items-center gap-2 uppercase tracking-widest text-xs font-bold">
                <span className="text-xl">←</span> Cerrar Consola Maestra
              </button>
              <AntigravityConsole />
            </div>
          ) : (
            <>
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black italic mb-6 tracking-tighter">BIENVENIDO A ANTIGRAVITY</h1>
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
                  {demoGames
                    .filter(game => (activeCategory === 'Home' || game.category === activeCategory))
                    .filter(game => game.category !== 'Admin' || isAdmin)
                    .length > 0 ? (
                    demoGames
                      .filter(game => (activeCategory === 'Home' || game.category === activeCategory))
                      .filter(game => game.category !== 'Admin' || isAdmin)
                      .map((game) => (
                        <div
                          key={game.id}
                          onClick={() => {
                            if (game.id === 1) setActiveGame('roulette_classic');
                            if (game.id === 2) setActiveGame('slots');
                            if (game.id === 3) setActiveGame('crash');
                            if (game.id === 4) setActiveGame('roulette');
                            if (game.id === 6) setActiveGame('mines'); // Added MinesGame activation
                            if (game.id === 5) setActiveGame('antigravity_console');
                          }}
                          className="group cursor-pointer" // Added class from instruction
                        >
                          <GameCard {...game} />
                        </div>
                      ))
                  ) : (
                    <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-white/5 bg-black/20">
                      <p className="text-gray-400 text-lg uppercase tracking-widest font-bold">Próximamente</p>
                      <p className="text-gray-500 mt-2">No hay juegos disponibles en <span className="text-neon-green">{activeCategory}</span> todavía.</p>
                      <button
                        onClick={() => setActiveCategory('Home')}
                        className="mt-6 px-6 py-2 rounded-full border border-white/10 text-white hover:bg-white/5 transition-all"
                      >
                        Explorar otros juegos
                      </button>
                    </div>
                  )}
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
            Modo Admin
          </button>
        )}
      </div>

      <AuthOverlay
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />

      <GlobalChat
        user={user}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
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
