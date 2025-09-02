import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'antd/dist/reset.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/routes.tsx'
import { ConfigProvider, theme, App } from 'antd'

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
      {/* 2. 在这里用 App 组件包裹 RouterProvider */}
      <App>
        <RouterProvider router={router} />
      </App>
    </ConfigProvider>
  </StrictMode>,
)
