module.exports = {
    apps: [
      {
        name: "tools-hub",
        script: "node_modules/next/dist/bin/next",
        args: "start",
        instances: 1,
        exec_mode: "fork", 
        env: {
          NODE_ENV:"production",
          HOST: "0.0.0.0",
          PORT: 22292,
          NEXT_PUBLIC_API_BASE_URL:"http://10.10.10.180:22291/api",
          NEXT_PUBLIC_API_FILE_URL:"http://10.10.10.180:22291/"
        },
        output: "./logs/out.log",
        error: "./logs/error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
      },
    ],
  };
  