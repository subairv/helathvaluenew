
import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from './services/firebase';
import type { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-dark text-white">
        Loading...
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <Login />;
};

export default App;
