import { signatureVerify } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';

// Store active sessions
const activeSessions = new Map<string, {
  address: string,
  timestamp: number
}>();

export interface AuthenticatedRequest {
  address: string;
  signature: string;
  message: string;
}

export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const { isValid } = signatureVerify(message, signature, address);
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export function createSession(address: string) {
  activeSessions.set(address, {
    address,
    timestamp: Date.now()
  });
}

export function verifySession(address: string): boolean {
  const session = activeSessions.get(address);
  if (!session) return false;
  
  // Session expires after 24 hours
  if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
    activeSessions.delete(address);
    return false;
  }
  
  return session.address === address;
}