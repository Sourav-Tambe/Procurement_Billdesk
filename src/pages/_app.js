// Bill Desk lite app wrapper (from procure-web-lite): only the theme, toasts and the Bill Desk layout (no sign-in).
import 'src/lib/liteApi'
import Head from 'next/head'
import { CacheProvider } from '@emotion/react'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'src/configs/i18n'
import themeConfig from 'src/configs/themeConfig'
import ThemeComponent from 'src/@core/theme/ThemeComponent'
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'
import ReactHotToast from 'src/@core/styles/libs/react-hot-toast'
import LiteLayout from 'src/layouts/LiteLayout'
import { AuthProvider } from 'src/context/AuthContext'
import 'react-perfect-scrollbar/dist/css/styles.css'
import 'src/iconify-bundle/icons-bundle-react'
import '../../styles/globals.css'
import '../../styles/custom.css'
import { clientSideEmotionCache } from 'src/lib/shared/emotionCache'

const queryClient = new QueryClient()

const App = ({ Component, emotionCache = clientSideEmotionCache, pageProps }) => {
  const getLayout = Component.getLayout ?? (page => <LiteLayout>{page}</LiteLayout>)
  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={emotionCache}>
        <Head><title>Bill Desk · lite</title><meta name='viewport' content='initial-scale=1, width=device-width' /></Head>
        <AuthProvider>
          <SettingsProvider>
            <SettingsConsumer>
              {({ settings }) => (
                <ThemeComponent settings={settings}>
                  {getLayout(<Component {...pageProps} />)}
                  <ReactHotToast><Toaster position={settings.toastPosition} containerClassName='react-hot-toast-container' toastOptions={{ className: 'react-hot-toast' }} /></ReactHotToast>
                </ThemeComponent>
              )}
            </SettingsConsumer>
          </SettingsProvider>
        </AuthProvider>
      </CacheProvider>
    </QueryClientProvider>
  )
}
export default App
