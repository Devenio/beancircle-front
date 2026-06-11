export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  order: number;
  isAvailable: boolean;
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
  isPublished: boolean;
  categories: MenuCategory[];
  cafe: {
    id: string;
    name: string;
    address?: string;
    photos?: { url: string }[];
  };
};
