export type MenuTheme =
  | 'MINIMAL'
  | 'MODERN'
  | 'LUXURY'
  | 'DARK'
  | 'VINTAGE'
  | 'NEON'
  | 'CUSTOM';

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  calories?: number | null;
  ingredients?: string[];
  allergens?: string[];
  prepTimeMin?: number | null;
  imageUrl?: string | null;
  images?: string[];
  videoUrl?: string | null;
  order: number;
  isAvailable: boolean;
  viewCount?: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  order: number;
  items: MenuItem[];
};

export type CafeMenuData = {
  id: string | null;
  cafeId: string;
  slug: string;
  welcomeTitle?: string | null;
  welcomeMessage?: string | null;
  welcomeImageUrl?: string | null;
  accentColor: string;
  theme?: MenuTheme;
  themeConfig?: Record<string, unknown> | null;
  isPublished: boolean;
  categories: MenuCategory[];
  cafe: {
    id: string;
    name: string;
    address?: string;
    description?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
    wifiName?: string | null;
    wifiPassword?: string | null;
    photos?: { url: string }[];
  };
};
