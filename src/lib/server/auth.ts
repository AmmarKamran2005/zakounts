import { NextRequest } from 'next/server';
import { verifyAccessToken, type TokenPayload } from './jwt';

/**
 * Extract and verify JWT from Authorization header.
 * Returns the token payload or null if invalid/missing.
 */
export function authenticateRequest(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Helper to create a JSON error response.
 */
export function unauthorized() {
  return Response.json({ success: false, error: 'Access token required' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
}

export function badRequest(message: string, details?: unknown) {
  return Response.json({ success: false, error: message, ...(details ? { details } : {}) }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return Response.json({ success: false, error: message }, { status: 404 });
}

export function success(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function serverError(err: unknown) {
  console.error('API error:', err);
  const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error';
  return Response.json({ success: false, error: message }, { status: 500 });
}
