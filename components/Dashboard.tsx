import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { signOutUser, saveHealthData, getHealthDataForDate, getAllHealthRecords, deleteHealthRecord } from '../services/firebase';
import type { User, HealthData, HealthMetricKey, HealthRecord } from '../types';
import { MetricStatus } from '../types';
import { METRIC_CONFIGS } from '../constants';
import MetricCard from './MetricCard';
import LogoutIcon from './icons/LogoutIcon';
import SaveIcon from './icons/SaveIcon';
import CheckIcon from './icons/CheckIcon';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import DeleteIcon from './icons/DeleteIcon';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<HealthData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const fetchAllRecords = useCallback(async () => {
    if (!user) return;
    setIsRecordsLoading(true);
    const records = await getAllHealthRecords(user.uid);
    setAllRecords(records);
    setIsRecordsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords]);

  useEffect(() => {
    const fetchSelectedRecord = async () => {
      if (!user || !selectedDate) return;
      setIsLoading(true);
      
      const existingRecord = allRecords.find(r => r.id === selectedDate);
      if (existingRecord) {
          setFormData(existingRecord);
          setActiveRecordId(existingRecord.id);
      } else {
        const data = await getHealthDataForDate(user.uid, selectedDate);
        if (data) {
          setFormData(data);
        } else {
          setFormData({ customerName: formData.customerName || user.displayName || '' });
        }
      }
      setIsLoading(false);
    };
    
    // Only fetch if date changes to one not in the list, or on initial load
    if (selectedDate && (!activeRecordId || activeRecordId !== selectedDate)) {
        fetchSelectedRecord();
    } else {
        setIsLoading(false);
    }
  }, [user, selectedDate, allRecords]);
  
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
        bmi: bmi,
        lastUpdated: new Date().toISOString(),
    };

    Object.keys(dataToSave).forEach(key => 
        (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]
    );

    try {
        await saveHealthData(user.uid, selectedDate, dataToSave);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await fetchAllRecords();
    } catch (error) {
        console.error("Error saving data: ", error);
        alert('Failed to save data.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleSelectRecord = (record: HealthRecord) => {
    setSelectedDate(record.id);
    setFormData(record);
    setActiveRecordId(record.id);
  };

  const handleNewRecord = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setFormData({ customerName: user.displayName || '' });
    setActiveRecordId(null);
  };

  const handleDeleteRecord = async (date: string) => {
    if (!user || !window.confirm(`Are you sure you want to delete the record for ${date}?`)) return;

    try {
        await deleteHealthRecord(user.uid, date);
        await fetchAllRecords();
        if (selectedDate === date) {
            handleNewRecord();
        }
    } catch (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record.");
    }
  }

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return allRecords;
    return allRecords.filter(record => 
        record.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRecords, searchTerm]);

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

      <div className="mb-8 p-4 bg-brand-secondary-dark rounded-lg shadow-lg flex flex-col md:flex-row md:items-end md:justify-between gap-4 relative">
         <div className="flex-grow" style={{flexBasis: '30%'}}>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-400 mb-1">Customer Name</label>
            <input
                id="customerName"
                type="text"
                value={formData.customerName ?? ''}
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

      <div className="my-8 p-4 bg-brand-secondary-dark rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-bold text-white">Records</h2>
          <div className="relative w-full md:w-auto md:flex-grow max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <button
            onClick={handleNewRecord}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300"
          >
            <PlusIcon />
            <span>New Record</span>
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto pr-2">
          {isRecordsLoading ? (
            <div className="text-center py-4 text-gray-400">Loading records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No records found. Create one to get started!</div>
          ) : (
            <ul className="space-y-2">
              {filteredRecords.map(record => (
                <li key={record.id} className={`p-3 rounded-lg flex justify-between items-center transition-colors ${activeRecordId === record.id ? 'bg-brand-accent/30' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  <div onClick={() => handleSelectRecord(record)} className="flex-grow cursor-pointer">
                    <p className="font-semibold text-white">{record.customerName || 'No Name'}</p>
                    <p className="text-sm text-gray-400">{record.id}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                    aria-label={`Delete record for ${record.id}`}
                  >
                    <DeleteIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Loading data for {selectedDate}...</div>
      ) : (
        <main>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-brand-secondary-dark p-4 rounded-lg shadow-lg md:col-span-2 lg:col-span-1">
                  <h3 className="font-bold text-gray-200 mb-2">BMI Calculator</h3>
                  <div className="space-y-4">
                    <div className="relative">
                        <label htmlFor="height" className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                        <input id="height" type="number" value={formData.height ?? ''} onChange={(e) => handleFormChange('height', e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="-" className="w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                        <span className="absolute right-3 bottom-3 text-gray-400">cm</span>
                    </div>
                    <div className="relative">
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-400 mb-1">Weight</label>
                        <input id="weight" type="number" value={formData.weight ?? ''} onChange={(e) => handleFormChange('weight', e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="-" className="w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                        <span className="absolute right-3 bottom-3 text-gray-400">kg</span>
                    </div>
                  </div>
              </div>

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
