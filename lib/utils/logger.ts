import fs from 'fs';
import path from 'path';

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
  private logsDir: string;
  private maxLogFiles: number = 7; // Manter logs dos últimos 7 dias

  constructor() {
    // Criar diretório de logs na raiz do projeto
    this.logsDir = path.join(process.cwd(), 'logs');
    
    // Criar diretório se não existir
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getLogFileName(type: string): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logsDir, `${type}-${today}.log`);
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    let logLine = `[${timestamp}] [${level}] ${entry.message}`;

    if (entry.data) {
      logLine += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      logLine += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        logLine += `\n  Stack: ${entry.error.stack}`;
      }
      if (entry.error.name) {
        logLine += `\n  Name: ${entry.error.name}`;
      }
    }

    return logLine + '\n';
  }

  private writeLog(type: string, entry: LogEntry): void {
    try {
      const logFile = this.getLogFileName(type);
      const logLine = this.formatLogEntry(entry);
      
      // Escrever no arquivo (append)
      fs.appendFileSync(logFile, logLine, 'utf8');
      
      // Também escrever no console (manter compatibilidade)
      const consoleMethod = entry.level === 'error' ? console.error : 
                           entry.level === 'warn' ? console.warn : 
                           console.log;
      consoleMethod(logLine.trim());
    } catch (error) {
      // Se falhar ao escrever no arquivo, pelo menos logar no console
      console.error('Erro ao escrever log em arquivo:', error);
      console.log(this.formatLogEntry(entry).trim());
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
    this.writeLog(type, this.createLogEntry('info', message, data));
  }

  warn(type: string, message: string, data?: any): void {
    this.writeLog(type, this.createLogEntry('warn', message, data));
  }

  error(type: string, message: string, error?: Error, data?: any): void {
    this.writeLog(type, this.createLogEntry('error', message, data, error));
  }

  debug(type: string, message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog(type, this.createLogEntry('debug', message, data));
    }
  }

  // Limpar logs antigos (manter apenas últimos N dias)
  cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logsDir);
      const today = new Date();
      
      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = new Date(stats.mtime);
        const daysDiff = Math.floor((today.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > this.maxLogFiles) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Log antigo removido: ${file}`);
        }
      });
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }
}

// Instância singleton
export const logger = new Logger();

// Limpar logs antigos ao iniciar (apenas em produção)
if (process.env.NODE_ENV === 'production') {
  logger.cleanupOldLogs();
}


