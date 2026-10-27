/** Stable feature identifiers shared by clients; server-side checks remain authoritative. */
export const FEATURE_KEYS = [
  'property.listing.create',
  'property.listing.media.video',
  'property.listing.media.photo_limit',
  'property.search.saved',
  'property.contact.seller',
  'admin.analytics.view',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type PlanKey = 'free' | (string & {});

export interface FeatureEntitlement {
  key: FeatureKey;
  enabled: boolean;
  limit?: number;
}
