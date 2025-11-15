import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { signOutUser, saveHealthData, getHealthDataForDate } from '../services/firebase';
import type { User, HealthData, HealthMetricKey } from '../types';
import { MetricStatus } from '../types';
import { METRIC_CONFIGS } from '../constants';
import MetricCard from './MetricCard';
import LogoutIcon from './icons/LogoutIcon';
import SaveIcon from './icons/SaveIcon';
import CheckIcon from './icons/CheckIcon';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<HealthData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      const data = await getHealthDataForDate(user.uid, selectedDate);
      if (data) {
        setFormData(data);
      } else {
        // Reset form for a new entry on a new date
        setFormData({ customerName: user.displayName || '' });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user, selectedDate]);
  
  const bmi = useMemo(() => {
    const { weight, height } = formData;
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      return parseFloat(calculatedBmi.toFixed(1));
    }
    return undefined;
  }, [formData.height, formData.weight]);

  const handleFormChange = useCallback((key: keyof HealthData, value: string | number | undefined) => {
    setFormData(prevData => ({ ...prevData, [key]: value }));
  }, []);
  
  const handleMetricChange = useCallback((key: HealthMetricKey, value: number | undefined) => {
    setFormData(prevData => ({ ...prevData, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const dataToSave: HealthData = {
        ...formData,
        bmi: bmi, // ensure calculated BMI is saved
        lastUpdated: new Date().toISOString(),
    };

    // Remove undefined values to keep Firestore clean
    Object.keys(dataToSave).forEach(key => 
        (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]
    );

    try {
        await saveHealthData(user.uid, selectedDate, dataToSave);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
        console.error("Error saving data: ", error);
        alert('Failed to save data.');
    } finally {
        setIsSaving(false);
    }
  };


  const metricKeys = Object.keys(METRIC_CONFIGS) as HealthMetricKey[];

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light p-4 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <img src={user.photoURL || ''} alt="User" className="w-12 h-12 rounded-full border-2 border-brand-accent" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Health Dashboard</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOutUser}
          className="bg-brand-secondary-dark hover:bg-red-600/50 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-300"
          aria-label="Logout"
        >
          <LogoutIcon />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Control Panel */}
      <div className="mb-8 p-4 bg-brand-secondary-dark rounded-lg shadow-lg flex flex-col md:flex-row md:items-end md:justify-between gap-4 relative">
         <div className="flex-grow" style={{flexBasis: '30%'}}>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-400 mb-1">Customer Name</label>
            <input
                id="customerName"
                type="text"
                value={formData.customerName ?? user.displayName ?? ''}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent text-lg"
            />
        </div>
        <div className="flex-grow" style={{flexBasis: '30%'}}>
            <label htmlFor="recordDate" className="block text-sm font-medium text-gray-400 mb-1">Record Date</label>
            <input
                id="recordDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent text-lg"
            />
        </div>
        <div className="flex-shrink-0">
            <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="w-full md:w-auto bg-brand-accent hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <SaveIcon />
                <span>{isSaving ? 'Saving...' : 'Save Data'}</span>
            </button>
        </div>
        {showSuccess && (
            <div className="absolute top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2 shadow-lg animate-pulse">
                <CheckIcon />
                <span>Saved!</span>
            </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Loading data for {selectedDate}...</div>
      ) : (
        <main>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* BMI Calculator */}
            <div className="bg-brand-secondary-dark p-4 rounded-lg shadow-lg md:col-span-2 lg:col-span-1">
                <h3 className="font-bold text-gray-200 mb-2">BMI Calculator</h3>
                <div className="space-y-4">
                <div className="relative">
                    <label htmlFor="height" className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                    <input
                    id="height"
                    type="number"
                    value={formData.height ?? ''}
                    onChange={(e) => handleFormChange('height', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="-"
                    className="w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <span className="absolute right-3 bottom-3 text-gray-400">cm</span>
                </div>
                <div className="relative">
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-400 mb-1">Weight</label>
                    <input
                    id="weight"
                    type="number"
                    value={formData.weight ?? ''}
                    onChange={(e) => handleFormChange('weight', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="-"
                    className="w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <span className="absolute right-3 bottom-3 text-gray-400">kg</span>
                </div>
                </div>
            </div>

            {/* Metric Cards */}
            {metricKeys.map(key => {
                const config = METRIC_CONFIGS[key];
                const value = key === 'bmi' ? bmi : formData[key];
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
      )}
    </div>
  );
};

export default Dashboard;
