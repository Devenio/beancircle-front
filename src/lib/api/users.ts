/**
 * Shared user-profile types for the frontend.
 *
 * Mirrors the shape produced by the backend (`GET /users/me`,
 * `GET /users/:username`). Keeping these in one place avoids the inline
 * `Me` types that were previously duplicated per page.
 */
import type { SocialLink, LinkVisibility } from '../social-platforms';

export type { SocialLink, LinkVisibility };

export interface CityRef {
  id: string;
  name: string;
}

export interface Me {
  id: string;
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  cityId?: string | null;
  city?: CityRef | null;
  website?: string | null;
  socialLinks?: SocialLink[] | null;
}

/** Public profile payload returned by `GET /users/:username`. */
export interface PublicProfile {
  id: string;
  username?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  cityId?: string;
  city?: CityRef | null;
  website?: string | null;
  /** Already filtered server-side by per-link visibility for the viewer. */
  socialLinks?: SocialLink[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isSelf?: boolean;
  restricted?: boolean;
}
