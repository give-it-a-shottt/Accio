import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 배포(Vercel)에서는 프론트와 /api 가 같은 주소라 CORS 가 필요 없다.
// 개발 중에는 /api 를 로컬 FastAPI(uvicorn :8000)로 넘겨 같은 구조를 흉내 낸다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
