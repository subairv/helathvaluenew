
import type { MetricConfig, HealthMetricKey } from './types';
import { MetricStatus } from './types';

export const METRIC_CONFIGS: Record<HealthMetricKey, MetricConfig> = {
  fs: {
    label: 'Fasting Sugar',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v < 70) return MetricStatus.Low;
      if (v <= 99) return MetricStatus.Normal;
      if (v <= 125) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  ppbs: {
    label: 'Postprandial Sugar',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v <= 140) return MetricStatus.Normal;
      if (v <= 199) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  totalCholesterol: {
    label: 'Total Cholesterol',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v < 200) return MetricStatus.Normal;
      if (v < 240) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  triglycerides: {
    label: 'Triglycerides',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v < 150) return MetricStatus.Normal;
      if (v < 200) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  hdl: {
    label: 'HDL Cholesterol',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v >= 60) return MetricStatus.Normal;
      if (v >= 40) return MetricStatus.Moderate;
      return MetricStatus.Low; // Low is bad for HDL
    },
  },
  ldl: {
    label: 'LDL Cholesterol',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v < 100) return MetricStatus.Normal;
      if (v < 130) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  hba1c: {
    label: 'HbA1c',
    unit: '%',
    ranges: (v) => {
      if (v < 5.7) return MetricStatus.Normal;
      if (v < 6.5) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  psa: {
    label: 'PSA',
    unit: 'ng/mL',
    ranges: (v) => {
      if (v < 4.0) return MetricStatus.Normal;
      if (v <= 10.0) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  creatinine: {
    label: 'Creatinine',
    unit: 'mg/dL',
    ranges: (v) => {
      if (v >= 0.74 && v <= 1.35) return MetricStatus.Normal; // For adult males
      if (v < 0.74) return MetricStatus.Low;
      return MetricStatus.High;
    },
  },
  microalbumin: {
    label: 'Microalbumin',
    unit: 'mg/L',
    ranges: (v) => {
      if (v < 30) return MetricStatus.Normal;
      if (v <= 300) return MetricStatus.Moderate;
      return MetricStatus.High;
    },
  },
  bmi: {
    label: 'BMI',
    unit: 'kg/m²',
    ranges: (v) => {
      if (v < 18.5) return MetricStatus.Low; // Underweight
      if (v < 25) return MetricStatus.Normal;
      if (v < 30) return MetricStatus.Moderate; // Overweight
      return MetricStatus.High; // Obese
    },
  },
};

export const STATUS_COLORS: Record<MetricStatus, string> = {
  [MetricStatus.Normal]: 'text-green-400',
  [MetricStatus.Moderate]: 'text-yellow-400',
  [MetricStatus.High]: 'text-red-400',
  [MetricStatus.Low]: 'text-yellow-400', // Using yellow for low as well, as it's outside normal
  [MetricStatus.Default]: 'text-gray-400',
};
