export class SystemOverviewDto {
  totalUsers: number;
  activeUsers: number;
  totalOperators: number;
  activeOperators: number;
  totalMachinery: number;
  activeMachinery: number;
  totalRoles: number;
  activeRoles: number;
  totalReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  auditLogsTotal: number;
  auditLogsToday: number;
  lastActivity: Date;
  systemUptime: string;
}

export class UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{
    roleName: string;
    count: number;
    percentage: number;
  }>;
  recentRegistrations: Array<{
    date: string;
    count: number;
  }>;
  topActiveUsers: Array<{
    userId: string;
    userEmail: string;
    fullName: string;
    activityCount: number;
    lastActivity: Date;
  }>;
}

export class MachineryStatsDto {
  totalMachinery: number;
  activeMachinery: number;
  inactiveMachinery: number;
  machineryByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  totalReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  topActiveMachinery: Array<{
    id: number;
    name: string;
    type: string;
    reportsCount: number;
    lastReportDate: Date;
  }>;
  reportsByType: Array<{
    type: string;
    count: number;
  }>;
  averageHoursPerMonth: number;
  totalMaterialMoved: number;
}

export class OperatorStatsDto {
  totalOperators: number;
  activeOperators: number;
  operatorsWithoutUser: number;
  operatorsByStatus: Array<{
    status: string;
    count: number;
  }>;
  topActiveOperators: Array<{
    id: number;
    name: string;
    reportsCount: number;
    totalHours: number;
    lastActivity: Date;
  }>;
  averageHoursPerOperator: number;
}

export class ReportStatsDto {
  totalReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  reportsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  reportsByMonth: Array<{
    month: string;
    count: number;
  }>;
  averageReportsPerDay: number;
  peakReportingHour: number;
}

export class AuditStatsAdvancedDto {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByHour: Array<{
    hour: number;
    count: number;
  }>;
  logsByDay: Array<{
    date: string;
    count: number;
  }>;
  topActiveUsers: Array<{
    userId: string;
    userEmail: string;
    count: number;
  }>;
  securityEvents: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
  }>;
  errorRate: number;
  averageLogsPerDay: number;
}

export class DashboardStatsDto {
  overview: SystemOverviewDto;
  users: UserStatsDto;
  machinery: MachineryStatsDto;
  operators: OperatorStatsDto;
  reports: ReportStatsDto;
  audit: AuditStatsAdvancedDto;
  trends: {
    userGrowth: number; // porcentaje
    reportGrowth: number; // porcentaje
    activityGrowth: number; // porcentaje
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
  }>;
  lastUpdated: Date;
}