export class AuditStatsDto {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByUser: Array<{ userId: string; userEmail: string; count: number }>;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  
  // Nuevas métricas avanzadas
  logsByHour?: Array<{ hour: number; count: number }>;
  logsByDay?: Array<{ date: string; count: number }>;
  securityEvents?: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
  }>;
  errorRate?: number;
  averageLogsPerDay?: number;
  peakActivity?: {
    hour: number;
    day: string;
    count: number;
  };
  trends?: {
    dailyGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
}