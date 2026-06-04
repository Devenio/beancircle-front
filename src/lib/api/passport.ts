export type PassportStamp = {
  id: string;
  earnedAt: string;
  cafe: {
    id: string;
    name: string;
    photos?: { url: string }[];
  };
};

export type PassportBadge = {
  id: string;
  earnedAt: string;
  badge: {
    code: string;
    name: string;
    description: string;
    iconKey: string;
  };
};

export type PassportReward = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requiredStamps: number;
  rewardType: string;
  unlocked: boolean;
  redeemed: boolean;
};

export type PassportMe = {
  passport: {
    id: string;
    totalStamps: number;
    totalCheckins: number;
  };
  stamps: PassportStamp[];
  badges: PassportBadge[];
  rewards: Array<{
    id: string;
    unlockedAt: string;
    redeemedAt: string | null;
    reward: { id: string; title: string; description: string };
  }>;
  rewardCatalog: PassportReward[];
  nextReward: PassportReward | null;
  progress: {
    stamps: number;
    checkins: number;
    nextRewardAt: number | null;
  };
};

export type CheckinResult = {
  checkin: { id: string; cafeId: string };
  newStamp: boolean;
  passport: { totalStamps: number; totalCheckins: number };
  earnedBadges: PassportBadge[];
  unlockedRewards: Array<{ reward: { title: string } }>;
};
