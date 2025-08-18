import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'antd/dist/reset.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/routes.tsx'
import { ConfigProvider, theme } from 'antd'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00BD97',
          borderRadius: 8,
        },
        components: {
          Menu: {
            itemSelectedBg: '#E6F4FF',
            itemSelectedColor: '#00BD97',
          },
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
)
