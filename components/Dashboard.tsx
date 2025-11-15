import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
    signOutUser, 
    saveHealthData, 
    getAllHealthRecords, 
    deleteHealthRecord,
    getCustomers,
    saveCustomer,
    deleteCustomer
} from '../services/firebase';
import type { User, HealthData, HealthMetricKey, HealthRecord, Customer } from '../types';
import { MetricStatus } from '../types';
import { METRIC_CONFIGS, STATUS_COLORS } from '../constants';
import MetricCard from './MetricCard';
import CustomerModal from './CustomerModal';
import LogoutIcon from './icons/LogoutIcon';
import SaveIcon from './icons/SaveIcon';
import CheckIcon from './icons/CheckIcon';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import DeleteIcon from './icons/DeleteIcon';
import UserIcon from './icons/UserIcon';
import PrintIcon from './icons/PrintIcon';
import EditIcon from './icons/EditIcon';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
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
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<(Omit<Partial<Customer>, 'id'> & { id?: string }) | null>(null);

  // Record state
  const [customerRecords, setCustomerRecords] = useState<HealthRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  
  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printStartDate, setPrintStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [printEndDate, setPrintEndDate] = useState(new Date().toISOString().split('T')[0]);


  // Fetch all customers for the user
  const fetchCustomers = useCallback(async (newlySelectedId: string | null = null) => {
    if (!user) return;
    setIsCustomersLoading(true);
    const customerList = await getCustomers(user.uid);
    setCustomers(customerList);

    if (newlySelectedId) {
        setActiveCustomer(customerList.find(c => c.id === newlySelectedId) || null);
    } else if (!activeCustomer && customerList.length > 0) {
        setActiveCustomer(customerList[0]);
    } else if (activeCustomer) {
        // Refresh active customer data
        setActiveCustomer(customerList.find(c => c.id === activeCustomer.id) || null);
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
        setFormData({ 
            customerName: `${activeCustomer?.firstName} ${activeCustomer?.lastName}`,
            height: activeCustomer?.heightCm,
            weight: activeCustomer?.currentWeightKg
         });
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
        customerName: `${activeCustomer.firstName} ${activeCustomer.lastName}`,
        bmi: bmi,
        lastUpdated: new Date().toISOString(),
    };

    Object.keys(dataToSave).forEach(key => 
        (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]
    );

    try {
        await saveHealthData(user.uid, activeCustomer.id, selectedDate, dataToSave, activeCustomer);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // Refresh records and customer data (for weight/height updates)
        const records = await getAllHealthRecords(user.uid, activeCustomer.id);
        setCustomerRecords(records);
        await fetchCustomers(activeCustomer.id); // Re-fetch customers to get updated profile
    } catch (error) {
        console.error("Error saving data: ", error);
        alert('Failed to save data.');
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSaveCustomer = async (customer: Omit<Partial<Customer>, 'id'> & { id?: string }) => {
    if (!user) return;
    try {
        const savedCustomerId = await saveCustomer(user.uid, customer);
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
        await fetchCustomers(customer.id ? customer.id : savedCustomerId);
    } catch(error) {
        console.error("Error saving customer:", error);
        alert("Failed to save customer.");
    }
  };

  const handleAddNewCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
      if (!user || !window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName} and all their records? This action cannot be undone.`)) return;
      try {
          const customerIdToDelete = customer.id;
          await deleteCustomer(user.uid, customerIdToDelete);
          const remainingCustomers = customers.filter(c => c.id !== customerIdToDelete)
          setCustomers(remainingCustomers);
          if (activeCustomer?.id === customerIdToDelete) {
              setActiveCustomer(remainingCustomers.length > 0 ? remainingCustomers[0] : null);
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
    setFormData({ 
      customerName: activeCustomer ? `${activeCustomer.firstName} ${activeCustomer.lastName}` : '',
      height: activeCustomer?.heightCm,
      weight: activeCustomer?.currentWeightKg,
    });
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
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

  const generateReportHtml = (records: HealthRecord[], customer: Customer, startDate: string, endDate: string): string => {
    const metricKeys = Object.keys(METRIC_CONFIGS) as HealthMetricKey[];
    
    const tableHeaders = metricKeys.map(key => `<th class="p-2 border text-sm">${METRIC_CONFIGS[key].label}</th>`).join('');
    
    const tableRows = records.map(record => {
        const cells = metricKeys.map(key => {
            const value = record[key];
            let status = MetricStatus.Default;
            if (value !== undefined && value !== null) {
                status = METRIC_CONFIGS[key].ranges(value);
            }
            const colorClass = STATUS_COLORS[status].replace('text-', 'status-');
            return `<td class="p-2 border text-center ${colorClass}">${value ?? '-'}</td>`;
        }).join('');
        return `<tr><td class="p-2 border font-semibold">${record.id}</td>${cells}</tr>`;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Health Report for ${customer.firstName} ${customer.lastName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .status-green-400 { color: #4ade80; }
                .status-yellow-400 { color: #facc15; }
                .status-red-400 { color: #f87171; }
                .status-gray-400 { color: #9ca3af; }
                @media print { body { font-size: 10px; } .no-print { display: none; } }
            </style>
        </head>
        <body class="p-6">
            <h1 class="text-3xl font-bold mb-2">Health Report: ${customer.firstName} ${customer.lastName}</h1>
            <p class="text-gray-600 mb-4">Report for period: <strong>${startDate}</strong> to <strong>${endDate}</strong></p>
            <p class="text-sm text-gray-500 mb-6">Generated on: ${new Date().toLocaleDateString()}</p>
            <table class="w-full border-collapse text-left">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="p-2 border">Date</th>
                        ${tableHeaders}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </body>
        </html>
    `;
  };

  const handlePrint = () => {
    if (!activeCustomer) return;

    const filteredRecords = customerRecords.filter(record => {
        return record.id >= printStartDate && record.id <= printEndDate;
    }).sort((a, b) => a.id.localeCompare(b.id));

    if (filteredRecords.length === 0) {
        alert('No records found in the selected date range.');
        return;
    }

    const reportHtml = generateReportHtml(filteredRecords, activeCustomer, printStartDate, printEndDate);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
             printWindow.print();
        }, 500); // Timeout to ensure styles are loaded
    }
    setIsPrintModalOpen(false);
  };

  const metricKeys = Object.keys(METRIC_CONFIGS) as HealthMetricKey[];

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light p-4 md:p-8">
      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
      />
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
                            <p className="font-semibold text-white">{customer.firstName} {customer.lastName}</p>
                          </div>
                          <button onClick={() => handleDeleteCustomer(customer)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors" aria-label={`Delete ${customer.firstName}`}><DeleteIcon /></button>
                        </li>
                      ))}
                    </ul>
                  }
                </div>
            </div>
            
            {/* Records Panel */}
            {activeCustomer && (
              <div className="space-y-8">
                <div className="p-4 bg-brand-secondary-dark rounded-lg shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-white">Profile</h2>
                      <button onClick={() => { setEditingCustomer(activeCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-400 hover:text-brand-accent rounded-full hover:bg-brand-accent/10 transition-colors" aria-label="Edit Customer Profile"><EditIcon /></button>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                      <p><strong>Name:</strong> {activeCustomer.firstName} {activeCustomer.lastName}</p>
                      {activeCustomer.dateOfBirth && <p><strong>DOB:</strong> {activeCustomer.dateOfBirth}</p>}
                      {activeCustomer.gender && <p><strong>Gender:</strong> {activeCustomer.gender}</p>}
                      {activeCustomer.heightCm && <p><strong>Height:</strong> {activeCustomer.heightCm} cm</p>}
                      {activeCustomer.currentWeightKg && <p><strong>Weight:</strong> {activeCustomer.currentWeightKg} kg</p>}
                  </div>
                </div>

                <div className="p-4 bg-brand-secondary-dark rounded-lg shadow-lg">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Records</h2>
                        <div className="flex gap-2">
                          <button onClick={() => setIsPrintModalOpen(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300">
                              <PrintIcon /><span>Print</span>
                          </button>
                          <button onClick={handleNewRecord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-300">
                              <PlusIcon /><span>New</span>
                          </button>
                        </div>
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

      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-brand-secondary-dark p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Print Report</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                        <input id="startDate" type="date" value={printStartDate} onChange={e => setPrintStartDate(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                        <input id="endDate" type="date" value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsPrintModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handlePrint} className="bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                        <PrintIcon /><span>Print</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
