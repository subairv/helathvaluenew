
import React from 'react';
import { MetricStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface MetricCardProps {
  label: string;
  unit: string;
  value: number | undefined;
  status: MetricStatus;
  onChange: (value: number | undefined) => void;
  isReadOnly?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, unit, value, status, onChange, isReadOnly = false }) => {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS[MetricStatus.Default];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
    if (!isNaN(numValue as number) || numValue === undefined) {
      onChange(numValue);
    }
  };

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
            value={value ?? ''}
            onChange={handleInputChange}
            readOnly={isReadOnly}
            placeholder="-"
            className={`w-full bg-gray-700 text-white p-2 rounded-md text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent ${isReadOnly ? 'cursor-not-allowed' : ''}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
