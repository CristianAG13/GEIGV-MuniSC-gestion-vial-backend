export class AuditStatsDto {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByUser: Array<{ userId: string; userEmail: string; count: number }>;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
}