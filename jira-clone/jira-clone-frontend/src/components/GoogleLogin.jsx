const GOOGLE_CLIENT_ID = '856086525163-5uq2tnk46dh6rrmbg9qu0162dgr7phhj.apps.googleusercontent.com'

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.3 15.7 18.8 13 24 13c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1L31.5 34c-2.1 1.6-4.8 2.5-7.5 2.5-5.3 0-9.8-3.5-11.4-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6-4.9c3.2-2.7 5.1-6.7 5.1-11.1 0-1.3-.2-2.7-.4-3.9z"/>
    </svg>
  )
}

export function triggerGoogleLogin(onSuccess, onError) {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) onSuccess(response.credential)
      },
      auto_select: false,
      use_fedcm_for_prompt: true, // Opt-in to FedCM
    })
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: popup OAuth
        const redirectUri = window.location.origin
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=id_token` +
          `&scope=openid email profile` +
          `&nonce=${Math.random().toString(36).substr(2)}`
        const popup = window.open(authUrl, 'google-login', 'width=500,height=600')
        const check = setInterval(() => {
          try {
            if (!popup || popup.closed) { clearInterval(check); return }
            if (popup.location.origin === window.location.origin) {
              const hash = popup.location.hash
              if (hash && hash.includes('id_token')) {
                const params = new URLSearchParams(hash.substring(1))
                const idToken = params.get('id_token')
                popup.close(); clearInterval(check)
                if (idToken) onSuccess(idToken)
              }
            }
          } catch (e) { /* cross-origin */ }
        }, 500)
      }
    })
  } else {
    onError('Google Sign-In đang tải, thử lại sau vài giây...')
  }
}
