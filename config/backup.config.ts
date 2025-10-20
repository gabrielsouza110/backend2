// Database Backup Configuration
export interface BackupConfig {
  // Backup storage settings
  backupDir: string;
  logFile: string;
  
  // Retention policies (in days/weeks/months)
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  // Database connection settings
  database: {
    name: string;
    user: string;
    host: string;
    port: number;
  };
  
  // Notification settings
  notifications: {
    enabled: boolean;
    adminEmail: string;
    smtpServer: string;
  };
  
  // Scheduling settings
  schedule: {
    daily: string;   // Cron expression
    weekly: string;  // Cron expression
    monthly: string; // Cron expression
  };
}

// Production environment configuration
export const productionConfig: BackupConfig = {
  backupDir: '/backups/postgresql',
  logFile: '/var/log/db_backup.log',
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 12
  },
  database: {
    name: process.env.DB_NAME || 'dashboard_esportivo',
    user: process.env.DB_USER || 'db_user',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432')
  },
  notifications: {
    enabled: true,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@dashboard-esportivo.com',
    smtpServer: process.env.SMTP_SERVER || 'localhost'
  },
  schedule: {
    daily: '0 2 * * *',    // 2 AM daily
    weekly: '0 3 * * 0',   // 3 AM every Sunday
    monthly: '0 4 1 * *'   // 4 AM on the 1st of each month
  }
};

// Development environment configuration
export const developmentConfig: BackupConfig = {
  backupDir: './backups',
  logFile: './logs/db_backup.log',
  retention: {
    daily: 3,
    weekly: 2,
    monthly: 3
  },
  database: {
    name: 'dashboard_esportivo_dev',
    user: 'db_user',
    host: 'localhost',
    port: 5432
  },
  notifications: {
    enabled: false,
    adminEmail: 'admin@dashboard-esportivo.com',
    smtpServer: 'localhost'
  },
  schedule: {
    daily: '0 */6 * * *',  // Every 6 hours
    weekly: '0 0 * * 0',   // Midnight every Sunday
    monthly: '0 0 1 * *'   // Midnight on the 1st of each month
  }
};

// Test environment configuration
export const testConfig: BackupConfig = {
  backupDir: './test_backups',
  logFile: './test_logs/db_backup.log',
  retention: {
    daily: 1,
    weekly: 1,
    monthly: 1
  },
  database: {
    name: 'dashboard_esportivo_test',
    user: 'db_user',
    host: 'localhost',
    port: 5432
  },
  notifications: {
    enabled: false,
    adminEmail: 'admin@dashboard-esportivo.com',
    smtpServer: 'localhost'
  },
  schedule: {
    daily: '*/30 * * * *', // Every 30 minutes
    weekly: '0 0 * * 0',
    monthly: '0 0 1 * *'
  }
};

// Get configuration based on environment
export const getConfig = (): BackupConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
};

export default getConfig();