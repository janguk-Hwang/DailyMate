export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 백엔드 API 요청 (/api/*)은 Railway 백엔드 서버로 프록시
    if (url.pathname.startsWith('/api')) {
      const backendUrl = env.BACKEND_URL || 'https://dailymate.up.railway.app';
      const targetUrl = new URL(url.pathname + url.search, backendUrl);

      // 원본 헤더 유지 및 프록시 헤더 설정
      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual', // OAuth 리다이렉트 302 응답을 브라우저에 그대로 반환
      });

      return fetch(proxyRequest);
    }

    // 2. 정적 파일 서빙 (Vite 빌드 폴더: ./dist)
    if (env.ASSETS) {
      let response = await env.ASSETS.fetch(request);

      // SPA 라우팅: 404이고 파일 확장자가 없는 경로일 때 index.html 반환
      if (response.status === 404 && !url.pathname.includes('.')) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        response = await env.ASSETS.fetch(indexRequest);
      }
      return response;
    }

    return new Response('DailyMate Cloudflare Worker Running', { status: 200 });
  },
};
