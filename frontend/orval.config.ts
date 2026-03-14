import { defineConfig } from 'orval'

export default defineConfig({
  mintpass: {
    input: {
      target: `${process.env.VITE_API_URL ?? 'http://localhost:8000'}/openapi.json`,
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      client: 'axios',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/axiosInstance.ts',
          name: 'axiosInstance',
        },
      },
    },
  },
})
