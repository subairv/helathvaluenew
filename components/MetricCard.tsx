
import React, { useState, useEffect } from 'react';
import { MetricStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface MetricCardProps {
  label: string;
  unit: string;
  value: number | undefined;
  status: MetricStatus;
  onChange: (value: number | undefined) => void;
  isReadOnly?: boolean;
  min?: number;
  max?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, unit, value, status, onChange, isReadOnly = false, min, max }) => {
  const [inputValue, setInputValue] = useState(value === undefined ? '' : String(value));
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string): boolean => {
      if (val === '') {
          setError(null);
          return true;
      }
      const num = parseFloat(val);
      if (isNaN(num)) {
          setError('Must be a valid number.');
          return false;
      }
      if ((min !== undefined && num < min) || (max !== undefined && num > max)) {
          setError(`Value must be between ${min} and ${max}.`);
          return false;
      }
      setError(null);
      return true;
  };

  useEffect(() => {
    // Only sync from parent if the numeric value of the input has diverged.
    // This prevents wiping a user's partial/invalid input on unrelated re-renders.
    if (value !== parseFloat(inputValue)) {
        const parentValueStr = value === undefined ? '' : String(value);
        setInputValue(parentValueStr);
        validate(parentValueStr); // And re-validate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentInput = e.target.value;
    setInputValue(currentInput); // Show what user is typing
    if (validate(currentInput)) {
        onChange(currentInput === '' ? undefined : parseFloat(currentInput));
    }
  };

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS[MetricStatus.Default];

  return (
    <div className="bg-brand-secondary-dark p-4 rounded-lg shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-200">{label}</h3>
          <span className={`font-semibold text-sm px-2 py-0.5 rounded-full ${statusColor} bg-opacity-20`}>
            {status}
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            readOnly={isReadOnly}
            placeholder="-"
            className={`w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 ${error ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-brand-accent'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{unit}</span>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
