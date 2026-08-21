import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env file from the parent directory (root directory)
  const env = loadEnv(mode, '../', '');

  return {
    plugins: [react(), tailwindcss()],
    envDir: '../', // Load/expose environment variables from root directory to the client code
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 5173,
    }
  };
});
