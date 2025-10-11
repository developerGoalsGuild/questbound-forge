import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins: any[] = [react()];
  if (mode === 'development') {
    const { componentTagger } = await import('lovable-tagger');
    plugins.push(componentTagger());
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy API Gateway during development to avoid CORS
        // Use VITE_API_BASE_URL="/v1" to enable this path
        "/v1": {
          target: env.VITE_API_GATEWAY_URL,
          changeOrigin: true,
          secure: true,
        },
        // Proxy AppSync GraphQL during development to avoid CORS
        "/appsync": {
          target: env.VITE_APPSYNC_ENDPOINT?.replace('/graphql', ''),
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/appsync/, "/graphql"),
        },
      },
    },
    build: {
      // Enable minification and compression
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
            'chart-vendor': ['recharts'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
            // Feature chunks
            'quest-components': [
              './src/components/quests/QuestCard.tsx',
              './src/components/quests/QuestDetails.tsx',
              './src/components/quests/QuestEditForm.tsx',
              './src/components/quests/QuestFilters.tsx',
              './src/components/quests/QuestList.tsx',
              './src/components/quests/QuestQuickActions.tsx',
              './src/components/quests/QuestStatisticsCard.tsx',
              './src/components/quests/QuestTabs.tsx',
            ],
            'analytics-components': [
              './src/components/quests/analytics/QuestAnalyticsDashboard.tsx',
              './src/components/quests/analytics/TrendChart.tsx',
              './src/components/quests/analytics/CategoryPerformanceChart.tsx',
              './src/components/quests/analytics/ProductivityHeatmap.tsx',
            ],
            'template-components': [
              './src/components/quests/QuestTemplateList.tsx',
              './src/components/quests/QuestTemplateCard.tsx',
            ],
          },
        },
      },
      // Enable source maps for debugging
      sourcemap: mode === 'development',
      // Optimize asset handling
      assetsInlineLimit: 4096,
      // Enable CSS code splitting
      cssCodeSplit: true,
    },
    css: {
      // Inline PostCSS config to avoid external config parsing issues
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Enable compression
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    },
  };
});
