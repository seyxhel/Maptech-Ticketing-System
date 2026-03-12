/**
 * Shared validation utilities for all forms across the application.
 * Provides consistent validation rules for email, phone, names, passwords, etc.
 */

// ── Regex patterns ──

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Philippine mobile: 09XX or +639XX, 10-13 digits */
export const PH_MOBILE_REGEX = /^(\+?63|0)9\d{9}$/;

/** Philippine landline: (02) 1234-5678, 02-9888-0123, 044-123-4567, etc. */
export const PH_LANDLINE_REGEX = /^(\(?\d{2,4}\)?[-\s]?\d{3,4}[-\s]?\d{4})$/;

/** Letters, spaces, hyphens, apostrophes, periods — common in PH names */
export const NAME_REGEX = /^[A-Za-zÀ-ÿñÑ\s\-'.]+$/;

/** Alphanumeric + underscore + dots, 3-30 chars */
export const USERNAME_REGEX = /^[A-Za-z0-9_.]{3,30}$/;

// ── Max lengths ──

export const MAX_NAME = 60;
export const MAX_EMAIL = 100;
export const MAX_PHONE = 20;
export const MAX_USERNAME = 30;
export const MAX_ADDRESS = 300;
export const MAX_DESCRIPTION = 5000;
export const MAX_REASON = 2000;
export const MAX_PASSWORD = 128;
export const MIN_PASSWORD = 8;
export const MAX_FIELD = 150;

// ── Validators (return error string or empty string) ──

export function validateEmail(val: string): string {
  const v = val.trim();
  if (!v) return 'Email is required.';
  if (v.length > MAX_EMAIL) return `Email must be under ${MAX_EMAIL} characters.`;
  if (!EMAIL_REGEX.test(v)) return 'Invalid email.';
  return '';
}

export function validatePhone(val: string, label = 'Phone number'): string {
  const v = val.replace(/[\s\-()]/g, '');
  if (!v) return `${label} is required.`;
  if (v.length > MAX_PHONE) return `${label} is too long.`;
  if (!PH_MOBILE_REGEX.test(v)) return `Enter a valid PH mobile number (e.g. 09171234567).`;
  return '';
}

export function validateLandline(val: string): string {
  const v = val.replace(/[\s]/g, '');
  if (!v) return ''; // landline is usually optional
  if (!PH_LANDLINE_REGEX.test(v)) return 'Enter a valid landline (e.g. (02) 1234-5678).';
  return '';
}

export function validateName(val: string, label = 'Name'): string {
  const v = val.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > MAX_NAME) return `${label} must be under ${MAX_NAME} characters.`;
  if (!NAME_REGEX.test(v)) return `${label} may only contain letters, spaces, hyphens, and apostrophes.`;
  return '';
}

export function validateRequired(val: string, label = 'This field'): string {
  if (!val.trim()) return `${label} is required.`;
  if (val.trim().length > MAX_FIELD) return `${label} must be under ${MAX_FIELD} characters.`;
  return '';
}

export function validateAddress(val: string): string {
  const v = val.trim();
  if (!v) return 'Address is required.';
  if (v.length > MAX_ADDRESS) return `Address must be under ${MAX_ADDRESS} characters.`;
  return '';
}

export function validateDescription(val: string, label = 'Description'): string {
  const v = val.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 10) return `${label} must be at least 10 characters.`;
  if (v.length > MAX_DESCRIPTION) return `${label} must be under ${MAX_DESCRIPTION} characters.`;
  return '';
}

export function validateUsername(val: string): string {
  const v = val.trim();
  if (!v) return 'Username is required.';
  if (v.length < 3) return 'Username must be at least 3 characters.';
  if (v.length > MAX_USERNAME) return `Username must be under ${MAX_USERNAME} characters.`;
  if (!USERNAME_REGEX.test(v)) return 'Username may only contain letters, numbers, underscores, and dots.';
  return '';
}

/**
 * Returns an object with per-rule booleans and an overall error message.
 */
export function validatePassword(val: string): { error: string; rules: PasswordRules } {
  const rules: PasswordRules = {
    minLength: val.length >= MIN_PASSWORD,
    hasUppercase: /[A-Z]/.test(val),
    hasLowercase: /[a-z]/.test(val),
    hasNumber: /\d/.test(val),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(val),
    notBreached: null, // determined asynchronously
  };
  if (!val) return { error: 'Password is required.', rules };
  if (val.length > MAX_PASSWORD) return { error: `Password must be under ${MAX_PASSWORD} characters.`, rules };
  const failing: string[] = [];
  if (!rules.minLength) failing.push(`at least ${MIN_PASSWORD} characters`);
  if (!rules.hasUppercase) failing.push('an uppercase letter');
  if (!rules.hasLowercase) failing.push('a lowercase letter');
  if (!rules.hasNumber) failing.push('a number');
  if (!rules.hasSpecial) failing.push('a special character');
  if (failing.length > 0) return { error: `Password must contain ${failing.join(', ')}.`, rules };
  return { error: '', rules };
}

export interface PasswordRules {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  notBreached: boolean | null; // null = not yet checked / checking
}

export function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export function validateReason(val: string, label = 'Reason'): string {
  const v = val.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 5) return `${label} must be at least 5 characters.`;
  if (v.length > MAX_REASON) return `${label} must be under ${MAX_REASON} characters.`;
  return '';
}

/** Sanitize text to prevent XSS — strips HTML tags */
export function sanitize(val: string): string {
  return val.replace(/<[^>]*>/g, '');
}

/**
 * Check the HIBP Passwords API using k-anonymity (only the first 5 chars
 * of the SHA-1 hash are sent to the server).
 * Returns true if the password has been found in a data breach.
 */
export async function checkPasswordPwned(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return false; // fail open
    const text = await res.text();
    return text.split('\n').some((line) => {
      const [hashSuffix] = line.split(':');
      return hashSuffix.trim() === suffix;
    });
  } catch {
    // Network error — don't block the user
    return false;
  }
}
