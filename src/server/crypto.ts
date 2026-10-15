// AES-256-GCM for GitHub tokens at rest, plus HMAC-signed OAuth state.
import crypto from 'crypto';

function key(): Buffer {
  const raw = process.env.GS_TOKEN_KEY;
  if (!raw) throw new Error('GS_TOKEN_KEY is not set');
  // Accept any string; derive a stable 32-byte key from it.
  return crypto.createHash('sha256').update(raw).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', key()).update(`state:${data}`).digest('base64url');
}

// State carries the user id and an expiry, signed so a callback can trust it.
export function signState(userId: string, ttlSeconds = 600): string {
  const data = `${userId}.${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  return `${Buffer.from(data).toString('base64url')}.${hmac(data)}`;
}

export function verifyState(state: string): string | null {
  const [encoded, sig] = (state || '').split('.');
  if (!encoded || !sig) return null;
  const data = Buffer.from(encoded, 'base64url').toString('utf8');
  const expected = hmac(data);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  const [userId, exp] = data.split('.');
  if (!userId || Number(exp) < Date.now() / 1000) return null;
  return userId;
}

export function randomToken(bytes = 18): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
