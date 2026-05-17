/* eslint-disable prettier/prettier */
const { createVuePlugin } = require('vite-plugin-vue2')
const path = require('path')

module.exports = {
    plugins: [createVuePlugin()],
    optimizeDeps: {
        include: ["vue", "vuetify", "three"],
    },
    build: {
        sourcemap: true,
    },
    server: {
        strict: false,
        port: 5173,
        watch: {
            usePolling: true,
        },
        proxy: {
            '^/api': {
                target: 'http://localhost:6200',
                rewrite: (path) => path.replace(/^\/api\//, '/'),
                ws: true,
                changeOrigin: true,
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@import "src/styles/_variables.scss";`,
                quietDeps: true,
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            "icons": path.resolve(__dirname, "node_modules/vue-material-design-icons"),
            "bootstrap-vue": path.resolve(__dirname, "node_modules/bootstrap-vue"),
            "highcharts": path.resolve(__dirname, "node_modules/highcharts"),
        },
        extensions: [
            ".vue", ".js"
        ]
    }
}
