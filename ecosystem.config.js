// module.exports = {
//   apps: [
//     {
//       name: "inventory-backend",
//       cwd: "./backend",
//       script: "npm",
//       args: "run dev",
//       env: {
//         NODE_ENV: "development",
//         PORT: 4000,
//       },
//     },
//     {
//       name: "inventory-client",
//       cwd: "./client",
//       script: "npm",
//       args: "run start",
//       env: {
//         NODE_ENV: "production",
//       },
//     },
//   ],
// };
module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./backend",
      script: "npm",
      args: "dev",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "client",
      cwd: "./client",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
