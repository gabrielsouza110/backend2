export class TypeHelpers {
  static toInt(value: any, defaultValue?: number): number | undefined {
    if (value === undefined || value === null) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  static toDate(value: any): Date | undefined {
    if (!value) return undefined;
    
    // Handle date-only strings (YYYY-MM-DD format) specially
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // For date-only strings, treat them as local dates
      const [year, month, day] = value.split('-').map(Number);
      // Create date in local timezone (month is 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? undefined : date;
    }
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  static toArray<T>(value: any, defaultValue: T[] = []): T[] {
    if (!value) return defaultValue;
    return Array.isArray(value) ? value : defaultValue;
  }

  static toBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') return value !== 0;
    return defaultValue;
  }
}