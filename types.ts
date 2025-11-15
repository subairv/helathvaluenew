import type { User as FirebaseUser } from "firebase/auth";

export type User = FirebaseUser;

export enum MetricStatus {
  Normal = 'Normal',
  Moderate = 'Moderate',
  High = 'High',
  Low = 'Low', // For metrics like HDL where low is bad
  Default = 'Default',
}

export type HealthMetricKey =
  | 'fs'
  | 'ppbs'
  | 'totalCholesterol'
  | 'triglycerides'
  | 'hdl'
  | 'ldl'
  | 'hba1c'
  | 'psa'
  | 'creatinine'
  | 'microalbumin'
  | 'bmi';

export type HealthData = {
  [key in HealthMetricKey]?: number;
} & {
  customerName?: string;
  height?: number; // in cm
  weight?: number; // in kg
  lastUpdated?: string;
};

export type HealthRecord = HealthData & {
  id: string; // The date string YYYY-MM-DD
};

export interface MetricConfig {
  label: string;
  unit: string;
  ranges: (value: number) => MetricStatus;
}

export type Customer = {
  id: string;
  name: string;
};
