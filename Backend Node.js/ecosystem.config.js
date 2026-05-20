module.exports = {
  apps: [
    {
      name: 'gestion-stock-backend',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
}
