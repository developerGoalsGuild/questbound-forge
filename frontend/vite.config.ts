import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
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
          target: "https://tuffc5cto8.execute-api.us-east-2.amazonaws.com",
          changeOrigin: true,
          secure: true,
        },
        // Proxy AppSync GraphQL during development to avoid CORS
        "/appsync": {
          target: "https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/appsync/, "/graphql"),
        },
      },
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
  };
});
