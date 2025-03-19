import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const envDir = path.resolve(__dirname, "..");
    const env = loadEnv(mode, envDir, "");
    return {
        plugins: [
            react(),
            tsconfigPaths(),
            visualizer(),
            viteCompression({
                algorithm: "brotliCompress",
                ext: ".br",
                threshold: 1024,
                verbose: true,
            }),
        ],
        optimizeDeps: {
            include: [
                "@elizaos/core"
            ]
        },
        clearScreen: false,
        envDir,
        define: {
            "import.meta.env.VITE_SERVER_PORT": JSON.stringify(
                env.SERVER_PORT || "3000"
            ),
            "import.meta.env.VITE_SERVER_URL": JSON.stringify(
                env.SERVER_URL || "http://localhost"
            ),
            "import.meta.env.VITE_SERVER_BASE_URL": JSON.stringify(
                env.SERVER_BASE_URL
            )
        },
        build: {
            outDir: "dist",
            emptyOutDir: true,
            minify: true,
            cssMinify: true,
            sourcemap: false,
            cssCodeSplit: true,
            manifest: false,
            chunkSizeWarningLimit: 1000,
            assetsDir: "assets",
            rollupOptions: {
                external: ['@tanstack/query-core'],
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom']
                    }
                }
            }
        },
        base: "./",
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
            preserveSymlinks: true,
            dedupe: ["react", "react-dom"]
        },
    };
});
