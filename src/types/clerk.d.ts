export {};

export type UserRole = 'brand' | 'creator' | 'admin';

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: UserRole;
    };
    role?: UserRole;
  }

  interface UserPublicMetadata {
    role?: UserRole;
  }
}
