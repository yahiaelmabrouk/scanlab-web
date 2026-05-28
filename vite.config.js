/* eslint-disable prettier/prettier */
import { env } from 'process'
import { createVuePlugin } from 'vite-plugin-vue2'
import viteSentry from 'vite-plugin-sentry'
import path from 'path'

export default ({ mode }) => {
    const plugins = [createVuePlugin()]

    if (mode === 'production') {
        plugins.push(viteSentry({
            authToken: 'de2ce2363d754721ac9b60be7732ed105222eb866af9459d80b8fa75ef2d993e',
            org: 'scanlab',
            project: 'scanlab-web',
            deploy: {
                env: env.CONTEXT === 'production' ? 'production' : 'staging',
            },
            setCommits: {
                auto: true
            },
            sourceMaps: {
                include: ['./dist/assets'],
            }
        }))
    }
    return {
        plugins,
        optimizeDeps: {
            include: ["vue", "vuetify", "three"],
        },
        build: {
            sourcemap: true,
        },
        server: {
            strict: false,
            port: 8080,
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
}
