import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/services/:path*',
    '/api/queries/:path*',
    '/api/join/:path*',
    '/api/user/:path*',
  ],
};
