import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // Removido
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Para Cloudflare Pages, o caminho base deve ser a raiz "/".
  const base = '/';

  console.log('Build environment:', { mode, base });

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // mode === 'development' && componentTagger(), // Removido
      {
        name: 'inject-sw-version',
        closeBundle() {
          // Gerar versão única baseada no timestamp do build
          const buildVersion = Date.now().toString();
          const swPath = path.resolve(__dirname, 'dist', 'sw.js');
          
          if (fs.existsSync(swPath)) {
            let swContent = fs.readFileSync(swPath, 'utf-8');
            swContent = swContent.replace('__BUILD_VERSION__', buildVersion);
            fs.writeFileSync(swPath, swContent);
            console.log(`SW version injected: ${buildVersion}`);
          }
        }
      }
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-toast', 'sonner']
          }
        }
      }
    },
  };
});
