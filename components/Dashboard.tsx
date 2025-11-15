
import React, { useState, useMemo, useCallback } from 'react';
import { signOutUser } from '../services/firebase';
import type { User, HealthData, HealthMetricKey } from '../types';
import { MetricStatus } from '../types';
import { METRIC_CONFIGS } from '../constants';
import MetricCard from './MetricCard';
import LogoutIcon from './icons/LogoutIcon';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [healthData, setHealthData] = useState<HealthData>({});
  const [height, setHeight] = useState<number | undefined>(); // in cm
  const [weight, setWeight] = useState<number | undefined>(); // in kg

  const bmi = useMemo(() => {
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      return parseFloat(calculatedBmi.toFixed(1));
    }
    return undefined;
  }, [height, weight]);

  const handleMetricChange = useCallback((key: HealthMetricKey, value: number | undefined) => {
    setHealthData(prevData => ({ ...prevData, [key]: value }));
  }, []);

  const metricKeys = Object.keys(METRIC_CONFIGS) as HealthMetricKey[];

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img src={user.photoURL || ''} alt="User" className="w-12 h-12 rounded-full border-2 border-brand-accent" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Health Dashboard</h1>
            <p className="text-gray-400 text-sm">{user.displayName}</p>
          </div>
        </div>
        <button
          onClick={signOutUser}
          className="bg-brand-secondary-dark hover:bg-red-600/50 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-300"
        >
          <LogoutIcon />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* BMI Calculator */}
          <div className="bg-brand-secondary-dark p-4 rounded-lg shadow-lg md:col-span-2 lg:col-span-1">
            <h3 className="font-bold text-gray-200 mb-2">BMI Calculator</h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={height ?? ''}
                  onChange={(e) => setHeight(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  placeholder="-"
                  className="w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">cm</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={weight ?? ''}
                  onChange={(e) => setWeight(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  placeholder="-"
                  className="w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">kg</span>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          {metricKeys.map(key => {
              const config = METRIC_CONFIGS[key];
              const value = key === 'bmi' ? bmi : healthData[key];
              const status = value !== undefined ? config.ranges(value) : MetricStatus.Default;
              
              return (
                <MetricCard
                    key={key}
                    label={config.label}
                    unit={config.unit}
                    value={value}
                    status={status}
                    onChange={(val) => handleMetricChange(key, val)}
                    isReadOnly={key === 'bmi'}
                />
              );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
