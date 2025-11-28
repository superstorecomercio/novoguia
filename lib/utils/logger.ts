type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    let logLine = `[${timestamp}] [${level}] ${entry.message}`;

    if (entry.data) {
      logLine += ` | Data: ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      logLine += ` | Error: ${entry.error.message}`;
      if (entry.error.stack && !this.isProduction) {
        logLine += ` | Stack: ${entry.error.stack}`;
      }
    }

    return logLine;
  }

  private writeLog(entry: LogEntry): void {
    const logLine = this.formatLogEntry(entry);

    // Em produção (Vercel), apenas usar console
    // Os logs aparecem no Vercel Dashboard > Logs
    switch (entry.level) {
      case 'error':
        console.error(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      case 'debug':
        if (!this.isProduction) {
          console.debug(logLine);
        }
        break;
      default:
        console.log(logLine);
    }
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? (typeof data === 'object' ? data : { value: data }) : undefined,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    };
  }

  info(type: string, message: string, data?: any): void {
    this.writeLog(this.createLogEntry('info', `[${type}] ${message}`, data));
  }

  warn(type: string, message: string, data?: any): void {
    this.writeLog(this.createLogEntry('warn', `[${type}] ${message}`, data));
  }

  error(type: string, message: string, error?: Error, data?: any): void {
    this.writeLog(this.createLogEntry('error', `[${type}] ${message}`, data, error));
  }

  debug(type: string, message: string, data?: any): void {
    if (!this.isProduction) {
      this.writeLog(this.createLogEntry('debug', `[${type}] ${message}`, data));
    }
  }
}

// Instância singleton
export const logger = new Logger();







