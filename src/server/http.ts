// Small helpers shared by the Netlify functions.
import type { HandlerEvent, HandlerResponse } from '@netlify/functions';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export function json(statusCode: number, body: unknown): HandlerResponse {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export function redirect(location: string): HandlerResponse {
  return { statusCode: 302, headers: { Location: location, 'Cache-Control': 'no-store' }, body: '' };
}

export function parseBody<T = any>(event: HandlerEvent): T {
  if (!event.body) return {} as T;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || 'https://gitsense.dev').replace(/\/$/, '');
}

// Thrown by helpers to end a request with a specific status and message.
export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export function errorResponse(err: unknown): HandlerResponse {
  if (err instanceof HttpError) return json(err.status, { error: err.message, ...err.extra });
  console.error(err);
  return json(500, { error: 'Something went wrong on our side. Please try again.' });
}
