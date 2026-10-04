module.exports = {
  apps: [
    {
      name: "inventory-backend",
      cwd: "./backend",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
    },
    {
      name: "inventory-client",
      cwd: "./client",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
