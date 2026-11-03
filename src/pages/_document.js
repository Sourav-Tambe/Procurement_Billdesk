// ** React Import
import { Children } from 'react'

// ** Next Import
import Document, { Html, Head, Main, NextScript } from 'next/document'

// ** Emotion Imports
import createEmotionServer from '@emotion/server/create-instance'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

class CustomDocument extends Document {
  render() {
    return (
      <Html lang='en-IN'>
        <Head>
                    <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' />
          <link
            rel='stylesheet'
            href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
          />
          <link rel='apple-touch-icon' sizes='180x180' href='/images/branding/Antz_logomark_h_color.svg' />
          <link rel='shortcut icon' href='/images/branding/Antz_logomark_h_color.svg' />
          {/* Figma capture (dev only; the toolbar shows when the address ends in #figmacapture). Next's dev server hides
              the body (style[data-next-hide-fouc] body{display:none}) until the page's CSS is in, and capture.js
              refuses a body that measures 0×0 ("Document does not have valid layout"), so the script is added only
              once the page has loaded and the body is showing (2 Nov) */}
          {process.env.NODE_ENV === 'development' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(){function add(){var s=document.createElement('script');s.src='https://mcp.figma.com/mcp/html-to-design/capture.js';s.async=true;document.head.appendChild(s)}function wait(){if(document.querySelector('style[data-next-hide-fouc]')||getComputedStyle(document.body).display==='none'||!document.body.getBoundingClientRect().height)return setTimeout(wait,100);add()}if(document.readyState==='complete')wait();else window.addEventListener('load',wait)})()`
              }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
CustomDocument.getInitialProps = async ctx => {
  const originalRenderPage = ctx.renderPage
  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props =>
        (
          <App
            {...props} // @ts-ignore
            emotionCache={cache}
          />
        )
    })
  const initialProps = await Document.getInitialProps(ctx)
  const emotionStyles = extractCriticalToChunks(initialProps.html)

  const emotionStyleTags = emotionStyles.styles.map(style => {
    return (
      <style
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
      />
    )
  })

  return {
    ...initialProps,
    styles: [...Children.toArray(initialProps.styles), ...emotionStyleTags]
  }
}

export default CustomDocument
