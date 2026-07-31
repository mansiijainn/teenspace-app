export const AUTH_REDIRECT_URL = 'spillr://auth/callback';

export function parseSupabaseAuthUrl(url = '') {
  const [, hash = ''] = url.split('#');
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const params = new URLSearchParams(hash || query || '');

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    type: params.get('type'),
  };
}
