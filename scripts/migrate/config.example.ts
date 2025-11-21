/**
 * Arquivo de Configuração para Migração
 * 
 * Copie este arquivo para config.ts e preencha com suas credenciais
 * 
 * IMPORTANTE: Não commite o arquivo config.ts no Git!
 */

export const legacyDbConfig = {
  // SQL Server
  server: 'seu-servidor-sql-server',
  database: 'netmude3', // Nome do banco legado
  user: 'seu-usuario',
  password: 'sua-senha',
  options: {
    encrypt: true, // Use true se necessário
    trustServerCertificate: true, // Use true se necessário
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Ou se for PostgreSQL legado:
export const legacyPostgresConfig = {
  host: 'seu-host-postgres',
  port: 5432,
  database: 'seu-banco',
  user: 'seu-usuario',
  password: 'sua-senha',
};

