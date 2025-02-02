// vite.config.mts
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import react from "file:///Users/mohamed/Documents/reor/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/mohamed/Documents/reor/node_modules/vite/dist/node/index.js";
import electron from "file:///Users/mohamed/Documents/reor/node_modules/vite-plugin-electron/dist/index.mjs";
import renderer from "file:///Users/mohamed/Documents/reor/node_modules/vite-plugin-electron-renderer/dist/index.mjs";
import { sentryVitePlugin } from "file:///Users/mohamed/Documents/reor/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { tamaguiExtractPlugin, tamaguiPlugin } from "file:///Users/mohamed/Documents/reor/node_modules/@tamagui/vite-plugin/dist/esm/index.mjs";
import tailwindcss from "file:///Users/mohamed/Documents/reor/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///Users/mohamed/Documents/reor/node_modules/autoprefixer/lib/autoprefixer.js";
import { createRequire } from "module";
var __vite_injected_original_import_meta_url = "file:///Users/mohamed/Documents/reor/vite.config.mts";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var pkg = require2("./package.json");
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
console.log(`Resolved: @shm/ui:`, path.join(__dirname, "./src/components/Editor/ui/src/index.tsx"));
var vite_config_default = defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });
  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = true;
  return {
    resolve: {
      alias: {
        "@": path.join(__dirname, "./src"),
        "@shared": path.join(__dirname, "./shared"),
        "@shm/ui": path.join(__dirname, "./src/components/Editor/ui/src")
      }
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    plugins: [
      tamaguiPlugin({
        config: "./tamagui.config.ts",
        components: ["tamagui"]
      }),
      tamaguiExtractPlugin(),
      react(),
      electron([
        {
          entry: "electron/main/index.ts",
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log("[startup] Electron App");
            } else {
              options.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: [
                  ...Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
                  "@shared/utils"
                ]
              }
            },
            resolve: {
              alias: {
                "@shared": path.join(__dirname, "shared"),
                "@shm/ui": path.join(__dirname, "src/components/Editor/ui/src")
              }
            }
          }
        },
        {
          entry: "electron/preload/index.ts",
          onstart(options) {
            options.reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : void 0,
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: [
                  ...Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
                  "@shared/utils"
                ]
              }
            },
            resolve: {
              alias: {
                "@shared": path.join(__dirname, "shared"),
                "@shm/ui": path.join(__dirname, "src/components/Editor/ui/src")
              }
            }
          }
        }
      ]),
      renderer(),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "reor",
        project: "electron"
      })
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer
        ]
      }
    },
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
      return {
        host: url.hostname,
        port: +url.port
      };
    })(),
    clearScreen: false,
    build: {
      sourcemap: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL21vaGFtZWQvRG9jdW1lbnRzL3Jlb3JcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9tb2hhbWVkL0RvY3VtZW50cy9yZW9yL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbW9oYW1lZC9Eb2N1bWVudHMvcmVvci92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBybVN5bmMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgZWxlY3Ryb24gZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24nXG5pbXBvcnQgcmVuZGVyZXIgZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXInXG5pbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSBcIkBzZW50cnkvdml0ZS1wbHVnaW5cIlxuaW1wb3J0IHsgdGFtYWd1aUV4dHJhY3RQbHVnaW4sIHRhbWFndWlQbHVnaW4gfSBmcm9tICdAdGFtYWd1aS92aXRlLXBsdWdpbidcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICd0YWlsd2luZGNzcydcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJ1xuXG4vLyBGb3IgQ29tbW9uSlMgY29tcGF0aWJpbGl0eVxuaW1wb3J0IHsgY3JlYXRlUmVxdWlyZSB9IGZyb20gJ21vZHVsZSdcbmNvbnN0IHJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybClcbmNvbnN0IHBrZyA9IHJlcXVpcmUoJy4vcGFja2FnZS5qc29uJylcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpXG5cbmNvbnNvbGUubG9nKGBSZXNvbHZlZDogQHNobS91aTpgLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cy9FZGl0b3IvdWkvc3JjL2luZGV4LnRzeCcpKVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiB7XG4gIHJtU3luYygnZGlzdC1lbGVjdHJvbicsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KVxuXG4gIGNvbnN0IGlzU2VydmUgPSBjb21tYW5kID09PSAnc2VydmUnXG4gIGNvbnN0IGlzQnVpbGQgPSBjb21tYW5kID09PSAnYnVpbGQnXG4gIGNvbnN0IHNvdXJjZW1hcCA9IHRydWVcblxuICByZXR1cm4ge1xuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAgICdAc2hhcmVkJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4vc2hhcmVkJyksXG4gICAgICAgICdAc2htL3VpJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4vc3JjL2NvbXBvbmVudHMvRWRpdG9yL3VpL3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGV4dGVuc2lvbnM6IFsnLnRzJywgJy50c3gnLCAnLmpzJywgJy5qc3gnLCAnLmpzb24nXSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICB0YW1hZ3VpUGx1Z2luKHtcbiAgICAgICAgY29uZmlnOiAnLi90YW1hZ3VpLmNvbmZpZy50cycsXG4gICAgICAgIGNvbXBvbmVudHM6IFsndGFtYWd1aSddLFxuICAgICAgfSksXG4gICAgICB0YW1hZ3VpRXh0cmFjdFBsdWdpbigpLFxuICAgICAgcmVhY3QoKSxcbiAgICAgIGVsZWN0cm9uKFtcbiAgICAgICAge1xuICAgICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vbWFpbi9pbmRleC50cycsXG4gICAgICAgICAgb25zdGFydChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc3RhcnR1cF0gRWxlY3Ryb24gQXBwJylcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9wdGlvbnMuc3RhcnR1cCgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB2aXRlOiB7XG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICBzb3VyY2VtYXAsXG4gICAgICAgICAgICAgIG1pbmlmeTogaXNCdWlsZCxcbiAgICAgICAgICAgICAgb3V0RGlyOiAnZGlzdC1lbGVjdHJvbi9tYWluJyxcbiAgICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICAgICAgICAgICAuLi5PYmplY3Qua2V5cygnZGVwZW5kZW5jaWVzJyBpbiBwa2cgPyBwa2cuZGVwZW5kZW5jaWVzIDoge30pLFxuICAgICAgICAgICAgICAgICAgJ0BzaGFyZWQvdXRpbHMnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgICAgICdAc2hhcmVkJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NoYXJlZCcpLFxuICAgICAgICAgICAgICAgICdAc2htL3VpJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NyYy9jb21wb25lbnRzL0VkaXRvci91aS9zcmMnKSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vcHJlbG9hZC9pbmRleC50cycsXG4gICAgICAgICAgb25zdGFydChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zLnJlbG9hZCgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICB2aXRlOiB7XG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICBzb3VyY2VtYXA6IHNvdXJjZW1hcCA/ICdpbmxpbmUnIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBtaW5pZnk6IGlzQnVpbGQsXG4gICAgICAgICAgICAgIG91dERpcjogJ2Rpc3QtZWxlY3Ryb24vcHJlbG9hZCcsXG4gICAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBleHRlcm5hbDogW1xuICAgICAgICAgICAgICAgICAgLi4uT2JqZWN0LmtleXMoJ2RlcGVuZGVuY2llcycgaW4gcGtnID8gcGtnLmRlcGVuZGVuY2llcyA6IHt9KSxcbiAgICAgICAgICAgICAgICAgICdAc2hhcmVkL3V0aWxzJyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgICAgICAnQHNoYXJlZCc6IHBhdGguam9pbihfX2Rpcm5hbWUsICdzaGFyZWQnKSxcbiAgICAgICAgICAgICAgICAnQHNobS91aSc6IHBhdGguam9pbihfX2Rpcm5hbWUsICdzcmMvY29tcG9uZW50cy9FZGl0b3IvdWkvc3JjJyksXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICAgIHJlbmRlcmVyKCksXG4gICAgICBzZW50cnlWaXRlUGx1Z2luKHtcbiAgICAgICAgYXV0aFRva2VuOiBwcm9jZXNzLmVudi5TRU5UUllfQVVUSF9UT0tFTixcbiAgICAgICAgb3JnOiBcInJlb3JcIixcbiAgICAgICAgcHJvamVjdDogXCJlbGVjdHJvblwiLFxuICAgICAgfSlcbiAgICBdLFxuICAgIGNzczoge1xuICAgICAgcG9zdGNzczoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgdGFpbHdpbmRjc3MsXG4gICAgICAgICAgYXV0b3ByZWZpeGVyXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgc2VydmVyOlxuICAgICAgcHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHICYmXG4gICAgICAoKCkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHBrZy5kZWJ1Zy5lbnYuVklURV9ERVZfU0VSVkVSX1VSTClcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBob3N0OiB1cmwuaG9zdG5hbWUsXG4gICAgICAgICAgcG9ydDogK3VybC5wb3J0LFxuICAgICAgICB9XG4gICAgICB9KSgpLFxuICAgIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgICBidWlsZDoge1xuICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgIH0sXG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyUSxTQUFTLGNBQWM7QUFDbFMsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLGNBQWM7QUFDckIsT0FBTyxjQUFjO0FBQ3JCLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsc0JBQXNCLHFCQUFxQjtBQUNwRCxPQUFPLGlCQUFpQjtBQUN4QixPQUFPLGtCQUFrQjtBQUd6QixTQUFTLHFCQUFxQjtBQWJxSSxJQUFNLDJDQUEyQztBQWNwTixJQUFNQSxXQUFVLGNBQWMsd0NBQWU7QUFDN0MsSUFBTSxNQUFNQSxTQUFRLGdCQUFnQjtBQUNwQyxJQUFNLFlBQVksS0FBSyxRQUFRLGNBQWMsd0NBQWUsQ0FBQztBQUU3RCxRQUFRLElBQUksc0JBQXNCLEtBQUssS0FBSyxXQUFXLDBDQUEwQyxDQUFDO0FBRWxHLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQzNDLFNBQU8saUJBQWlCLEVBQUUsV0FBVyxNQUFNLE9BQU8sS0FBSyxDQUFDO0FBRXhELFFBQU0sVUFBVSxZQUFZO0FBQzVCLFFBQU0sVUFBVSxZQUFZO0FBQzVCLFFBQU0sWUFBWTtBQUVsQixTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssS0FBSyxXQUFXLE9BQU87QUFBQSxRQUNqQyxXQUFXLEtBQUssS0FBSyxXQUFXLFVBQVU7QUFBQSxRQUMxQyxXQUFXLEtBQUssS0FBSyxXQUFXLGdDQUFnQztBQUFBLE1BQ2xFO0FBQUEsSUFDRjtBQUFBLElBQ0EsWUFBWSxDQUFDLE9BQU8sUUFBUSxPQUFPLFFBQVEsT0FBTztBQUFBLElBQ2xELFNBQVM7QUFBQSxNQUNQLGNBQWM7QUFBQSxRQUNaLFFBQVE7QUFBQSxRQUNSLFlBQVksQ0FBQyxTQUFTO0FBQUEsTUFDeEIsQ0FBQztBQUFBLE1BQ0QscUJBQXFCO0FBQUEsTUFDckIsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLFFBQ1A7QUFBQSxVQUNFLE9BQU87QUFBQSxVQUNQLFFBQVEsU0FBUztBQUNmLGdCQUFJLFFBQVEsSUFBSSxjQUFjO0FBQzVCLHNCQUFRLElBQUksd0JBQXdCO0FBQUEsWUFDdEMsT0FBTztBQUNMLHNCQUFRLFFBQVE7QUFBQSxZQUNsQjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLE1BQU07QUFBQSxZQUNKLE9BQU87QUFBQSxjQUNMO0FBQUEsY0FDQSxRQUFRO0FBQUEsY0FDUixRQUFRO0FBQUEsY0FDUixlQUFlO0FBQUEsZ0JBQ2IsVUFBVTtBQUFBLGtCQUNSLEdBQUcsT0FBTyxLQUFLLGtCQUFrQixNQUFNLElBQUksZUFBZSxDQUFDLENBQUM7QUFBQSxrQkFDNUQ7QUFBQSxnQkFDRjtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBQUEsWUFDQSxTQUFTO0FBQUEsY0FDUCxPQUFPO0FBQUEsZ0JBQ0wsV0FBVyxLQUFLLEtBQUssV0FBVyxRQUFRO0FBQUEsZ0JBQ3hDLFdBQVcsS0FBSyxLQUFLLFdBQVcsOEJBQThCO0FBQUEsY0FDaEU7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxPQUFPO0FBQUEsVUFDUCxRQUFRLFNBQVM7QUFDZixvQkFBUSxPQUFPO0FBQUEsVUFDakI7QUFBQSxVQUNBLE1BQU07QUFBQSxZQUNKLE9BQU87QUFBQSxjQUNMLFdBQVcsWUFBWSxXQUFXO0FBQUEsY0FDbEMsUUFBUTtBQUFBLGNBQ1IsUUFBUTtBQUFBLGNBQ1IsZUFBZTtBQUFBLGdCQUNiLFVBQVU7QUFBQSxrQkFDUixHQUFHLE9BQU8sS0FBSyxrQkFBa0IsTUFBTSxJQUFJLGVBQWUsQ0FBQyxDQUFDO0FBQUEsa0JBQzVEO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUFBLFlBQ0EsU0FBUztBQUFBLGNBQ1AsT0FBTztBQUFBLGdCQUNMLFdBQVcsS0FBSyxLQUFLLFdBQVcsUUFBUTtBQUFBLGdCQUN4QyxXQUFXLEtBQUssS0FBSyxXQUFXLDhCQUE4QjtBQUFBLGNBQ2hFO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxTQUFTO0FBQUEsTUFDVCxpQkFBaUI7QUFBQSxRQUNmLFdBQVcsUUFBUSxJQUFJO0FBQUEsUUFDdkIsS0FBSztBQUFBLFFBQ0wsU0FBUztBQUFBLE1BQ1gsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxRQUNQLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFDRSxRQUFRLElBQUksaUJBQ1gsTUFBTTtBQUNMLFlBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxNQUFNLElBQUksbUJBQW1CO0FBQ3JELGFBQU87QUFBQSxRQUNMLE1BQU0sSUFBSTtBQUFBLFFBQ1YsTUFBTSxDQUFDLElBQUk7QUFBQSxNQUNiO0FBQUEsSUFDRixHQUFHO0FBQUEsSUFDTCxhQUFhO0FBQUEsSUFDYixPQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJyZXF1aXJlIl0KfQo=
