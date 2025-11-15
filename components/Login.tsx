
import React from 'react';
import { signInWithGoogle } from '../services/firebase';
import GoogleIcon from './icons/GoogleIcon';

const Login: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <div className="text-center p-8 bg-brand-secondary-dark rounded-xl shadow-2xl max-w-sm w-full">
        <h1 className="text-4xl font-bold text-white mb-2">Health Metrics</h1>
        <p className="text-gray-400 mb-8">Sign in to track your health dashboard.</p>
        <button
          onClick={signInWithGoogle}
          className="w-full bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-200 transition-colors duration-300"
        >
          <GoogleIcon />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
