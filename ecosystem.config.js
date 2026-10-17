module.exports = {
  apps: [
    {
      name: "inventory-backend",
      cwd: "./backend",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "src/server.ts",
      interpreter: "node",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "inventory-client",
      cwd: "./client",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
