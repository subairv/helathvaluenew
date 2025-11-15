import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
    signOutUser, 
    saveHealthData, 
    getAllHealthRecords, 
    deleteHealthRecord,
    getCustomers,
    addCustomer,
    deleteCustomer
} from '../services/firebase';
import type { User, HealthData, HealthMetricKey, HealthRecord, Customer } from '../types';
import { MetricStatus } from '../types';
import { METRIC_CONFIGS } from '../constants';
import MetricCard from './MetricCard';
import LogoutIcon from './icons/LogoutIcon';
import SaveIcon from './icons/SaveIcon';
import CheckIcon from './icons/CheckIcon';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import DeleteIcon from './icons/DeleteIcon';
import UserIcon from './icons/UserIcon';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC = ({ user }) => {
  // Global state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<HealthData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isCustomersLoading, setIsCustomersLoading] = useState(true);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Record state
  const [customerRecords, setCustomerRecords] = useState<HealthRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  
  // Fetch all customers for the user
  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    setIsCustomersLoading(true);
    const customerList = await getCustomers(user.uid);
    setCustomers(customerList);
    if (customerList.length > 0 && !activeCustomer) {
        setActiveCustomer(customerList[0]);
    }
    setIsCustomersLoading(false);
  }, [user, activeCustomer]);

  useEffect(() => {
    fetchCustomers();
  }, [user]); // Only depends on user

  // Fetch records when the active customer changes
  useEffect(() => {
    const fetchRecords = async () => {
        if (!user || !activeCustomer) {
            setCustomerRecords([]);
            return;
        };
        setIsRecordsLoading(true);
        const records = await getAllHealthRecords(user.uid, activeCustomer.id);
        setCustomerRecords(records);
        setIsRecordsLoading(false);
    }
    fetchRecords();
  }, [user, activeCustomer]);

  // Load data for the selected date of the active customer
  useEffect(() => {
    const selectedRecord = customerRecords.find(r => r.id === selectedDate);
    if(selectedRecord) {
        setFormData(selectedRecord);
    } else {
        setFormData({ customerName: activeCustomer?.name || '' });
    }
  }, [selectedDate, customerRecords, activeCustomer]);
  
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
    if (!user || !activeCustomer) return;
    setIsSaving(true);
    
    const dataToSave: HealthData = {
        ...formData,
        customerName: activeCustomer.name,
        bmi: bmi,
        lastUpdated: new Date().toISOString(),
    };

    Object.keys(dataToSave).forEach(key => 
        (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]
    );

    try {
        await saveHealthData(user.uid, activeCustomer.id, selectedDate, dataToSave);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // Refresh records for current customer
        const records = await getAllHealthRecords(user.uid, activeCustomer.id);
        setCustomerRecords(records);
    } catch (error) {
        console.error("Error saving data: ", error);
        alert('Failed to save data.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddNewCustomer = async () => {
    const name = window.prompt("Enter new customer's name:");
    if (name && user) {
        try {
            await addCustomer(user.uid, name);
            await fetchCustomers();
        } catch (error) {
            console.error("Error adding customer:", error);
            alert("Failed to add customer.");
        }
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
      if (!user || !window.confirm(`Are you sure you want to delete ${customer.name} and all their records? This action cannot be undone.`)) return;
      try {
          await deleteCustomer(user.uid, customer.id);
          setCustomers(customers.filter(c => c.id !== customer.id));
          if (activeCustomer?.id === customer.id) {
              setActiveCustomer(customers.length > 1 ? customers.filter(c => c.id !== customer.id)[0] : null);
          }
      } catch (error) {
          console.error("Error deleting customer:", error);
          alert("Failed to delete customer.");
      }
  }

  const handleSelectRecord = (record: HealthRecord) => {
    setSelectedDate(record.id);
    setFormData(record);
  };

  const handleNewRecord = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setFormData({ customerName: activeCustomer?.name || '' });
  };

  const handleDeleteRecord = async (date: string) => {
    if (!user || !activeCustomer || !window.confirm(`Are you sure you want to delete the record for ${date}?`)) return;

    try {
        await deleteHealthRecord(user.uid, activeCustomer.id, date);
        setCustomerRecords(customerRecords.filter(r => r.id !== date));
        if (selectedDate === date) {
            handleNewRecord();
        }
    } catch (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record.");
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return customers;
    return customers.filter(c => 
        c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer and Record Management */}
        <div className="lg:col-span-1 space-y-8">
            {/* Customer Panel */}
            <div className="p-4 bg-brand-secondary-dark rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2"><UserIcon /> Customers</h2>
                  <button onClick={handleAddNewCustomer} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300">
                    <PlusIcon />
                    <span>New Customer</span>
                  </button>
                </div>
                <div className="relative w-full mb-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon /></span>
                    <input type="text" placeholder="Search customers..." value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white p-2 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                </div>
                <div className="max-h-60 overflow-y-auto pr-2">
                  {isCustomersLoading ? <div className="text-center py-4 text-gray-400">Loading customers...</div> :
                   filteredCustomers.length === 0 ? <div className="text-center py-4 text-gray-400">No customers found.</div> :
                   <ul className="space-y-2">
                      {filteredCustomers.map(customer => (
                        <li key={customer.id} className={`p-3 rounded-lg flex justify-between items-center transition-colors ${activeCustomer?.id === customer.id ? 'bg-brand-accent/30' : 'bg-gray-700 hover:bg-gray-600'}`}>
                          <div onClick={() => setActiveCustomer(customer)} className="flex-grow cursor-pointer">
                            <p className="font-semibold text-white">{customer.name}</p>
                          </div>
                          <button onClick={() => handleDeleteCustomer(customer)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors" aria-label={`Delete ${customer.name}`}><DeleteIcon /></button>
                        </li>
                      ))}
                    </ul>
                  }
                </div>
            </div>
            
            {/* Records Panel */}
            {activeCustomer && (
                <div className="p-4 bg-brand-secondary-dark rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Records for {activeCustomer.name}</h2>
                        <button onClick={handleNewRecord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300">
                            <PlusIcon /><span>New Record</span>
                        </button>
                    </div>
                     <div className="max-h-72 overflow-y-auto pr-2">
                        {isRecordsLoading ? <div className="text-center py-4 text-gray-400">Loading records...</div> :
                         customerRecords.length === 0 ? <div className="text-center py-4 text-gray-400">No records found.</div> :
                         <ul className="space-y-2">
                            {customerRecords.map(record => (
                                <li key={record.id} className={`p-3 rounded-lg flex justify-between items-center transition-colors ${selectedDate === record.id ? 'bg-brand-accent/30' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    <div onClick={() => handleSelectRecord(record)} className="flex-grow cursor-pointer">
                                        <p className="font-semibold text-white">{record.id}</p>
                                    </div>
                                    <button onClick={() => handleDeleteRecord(record.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors" aria-label={`Delete record for ${record.id}`}><DeleteIcon /></button>
                                </li>
                            ))}
                         </ul>
                        }
                     </div>
                </div>
            )}
        </div>

        {/* Right Column: Data Entry */}
        <div className="lg:col-span-2">
          {!activeCustomer ? (
            <div className="h-full flex items-center justify-center bg-brand-secondary-dark rounded-lg p-8">
              <div className="text-center">
                <UserIcon />
                <h2 className="mt-4 text-2xl font-bold">Select or Create a Customer</h2>
                <p className="text-gray-400 mt-2">Choose a customer from the list on the left to view or add health records.</p>
              </div>
            </div>
          ) : (
            <main>
              <div className="mb-8 p-4 bg-brand-secondary-dark rounded-lg shadow-lg flex flex-col md:flex-row md:items-end md:justify-between gap-4 relative">
                <div className="flex-grow">
                    <label htmlFor="recordDate" className="block text-sm font-medium text-gray-400 mb-1">Record Date</label>
                    <input id="recordDate" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent text-lg" />
                </div>
                <div className="flex-shrink-0">
                    <button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto bg-brand-accent hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <SaveIcon />
                        <span>{isSaving ? 'Saving...' : 'Save Data'}</span>
                    </button>
                </div>
                {showSuccess && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2 shadow-lg animate-pulse">
                        <CheckIcon /><span>Saved!</span>
                    </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="bg-brand-secondary-dark p-4 rounded-lg shadow-lg">
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
      </div>
    </div>
  );
};

export default Dashboard;
