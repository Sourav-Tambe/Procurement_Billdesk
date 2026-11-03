import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// Shared Emotion cache instance for both Page Router and App Router
export const clientSideEmotionCache = createEmotionCache()
