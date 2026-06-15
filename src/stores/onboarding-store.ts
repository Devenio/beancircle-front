import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Activation steps after the mandatory username gate, in flow order. */
export const ACTIVATION_STEPS = [
  'welcome',
  'interests',
  'avatar',
  'circle',
  'firstPost',
  'cafe',
  'achievement',
  'profile',
  'invite',
] as const;

export type StepKey = (typeof ACTIVATION_STEPS)[number];

/** Discrete bean-avatar option keys (mirror beancircle-api BeanAvatar). */
export type AvatarConfig = {
  bg: string;
  skin: string;
  hair: string;
  glasses: string;
  beard: string;
  outfit: string;
  accessory: string;
  coffeeCup: string;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  bg: 'crema',
  skin: 'roast',
  hair: 'none',
  glasses: 'none',
  beard: 'none',
  outfit: 'apron',
  accessory: 'none',
  coffeeCup: 'latte',
};

type OnboardingState = {
  /** Whether the username gate has been cleared (mirrors needsOnboarding=false). */
  identityDone: boolean;
  /** Selected interest slugs (UPPER_CASE matching InterestSlug). */
  interests: string[];
  /** Live avatar draft. */
  avatar: AvatarConfig;
  avatarTouched: boolean;
  /** Ids of people followed during the circle step (for optimistic UI). */
  followedIds: string[];
  /** Whether the user posted their first bean. */
  posted: boolean;
  /** Resume hint — last step the user was on. */
  lastStep: StepKey;

  setIdentityDone: (v: boolean) => void;
  toggleInterest: (slug: string) => void;
  setInterests: (slugs: string[]) => void;
  setAvatar: (patch: Partial<AvatarConfig>) => void;
  replaceAvatar: (cfg: AvatarConfig) => void;
  markFollowed: (id: string) => void;
  setPosted: (v: boolean) => void;
  setLastStep: (s: StepKey) => void;
  reset: () => void;
};

const initial = {
  identityDone: false,
  interests: [] as string[],
  avatar: DEFAULT_AVATAR,
  avatarTouched: false,
  followedIds: [] as string[],
  posted: false,
  lastStep: 'welcome' as StepKey,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      setIdentityDone: (v) => set({ identityDone: v }),
      toggleInterest: (slug) =>
        set((s) => ({
          interests: s.interests.includes(slug)
            ? s.interests.filter((i) => i !== slug)
            : [...s.interests, slug],
        })),
      setInterests: (slugs) => set({ interests: slugs }),
      setAvatar: (patch) =>
        set((s) => ({ avatar: { ...s.avatar, ...patch }, avatarTouched: true })),
      replaceAvatar: (cfg) => set({ avatar: cfg, avatarTouched: true }),
      markFollowed: (id) =>
        set((s) => ({
          followedIds: s.followedIds.includes(id)
            ? s.followedIds
            : [...s.followedIds, id],
        })),
      setPosted: (v) => set({ posted: v }),
      setLastStep: (s) => set({ lastStep: s }),
      reset: () => set(initial),
    }),
    { name: 'beancircle-onboarding' },
  ),
);
