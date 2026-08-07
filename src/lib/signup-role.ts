export type SignupRole = 'brand' | 'creator';

const ROLE_STORAGE_KEY = 'crevio_signup_role';

export function getSelectedSignupRole(): SignupRole | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(ROLE_STORAGE_KEY);
  return raw === 'brand' || raw === 'creator' ? raw : null;
}

export function setSelectedSignupRole(role: SignupRole): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function clearSelectedSignupRole(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(ROLE_STORAGE_KEY);
}