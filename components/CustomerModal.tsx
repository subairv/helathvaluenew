import React, { useState, useEffect } from 'react';
import type { Customer } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Partial<Customer>, 'id'> & { id?: string }) => void;
  customer: (Omit<Partial<Customer>, 'id'> & { id?: string }) | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customer }) => {
  const [formData, setFormData] = useState<Omit<Partial<Customer>, 'id'> & { id?: string }>({});

  useEffect(() => {
    setFormData(customer || { firstName: '', lastName: '' });
  }, [customer]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName && formData.lastName) {
      onSave(formData);
    } else {
      alert('First and Last name are required.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-brand-secondary-dark p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{customer?.id ? 'Edit Customer' : 'Add New Customer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-400 mb-1">First Name*</label>
              <input id="firstName" name="firstName" type="text" value={formData.firstName ?? ''} onChange={handleChange} required className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-400 mb-1">Last Name*</label>
              <input id="lastName" name="lastName" type="text" value={formData.lastName ?? ''} onChange={handleChange} required className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth ?? ''} onChange={handleChange} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
              <select id="gender" name="gender" value={formData.gender ?? ''} onChange={handleChange} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="heightCm" className="block text-sm font-medium text-gray-400 mb-1">Height (cm)</label>
              <input id="heightCm" name="heightCm" type="number" value={formData.heightCm ?? ''} onChange={handleNumberChange} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
              <label htmlFor="currentWeightKg" className="block text-sm font-medium text-gray-400 mb-1">Weight (kg)</label>
              <input id="currentWeightKg" name="currentWeightKg" type="number" value={formData.currentWeightKg ?? ''} onChange={handleNumberChange} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" className="bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Save Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
