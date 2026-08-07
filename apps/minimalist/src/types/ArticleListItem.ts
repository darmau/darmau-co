type ArticleListItem = {
  title: string;
  subtitle?: string;
  slug: string;
  published_at: string;
  language: string;
  category: string;
  is_premium: boolean;
  is_featured: boolean;
}

export type { ArticleListItem };