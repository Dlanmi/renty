export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rented"
  | "inactive"
  | "rejected";

export type ListingKind =
  | "apartment"
  | "house"
  | "studio"
  | "room_private"
  | "room_shared";

export type ResidentialContext =
  | "barrio"
  | "conjunto"
  | "edificio"
  | "casa_familiar";

export type ListingPoiKind =
  | "park"
  | "transport"
  | "supermarket"
  | "pharmacy"
  | "school"
  | "hospital"
  | "other";

export type ListingPhotoRoomType =
  | "facade"
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "laundry"
  | "common_area"
  | "other";

/** Row shape returned by Supabase for public.listings */
export interface Listing {
  id: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;

  city: string;
  zone: string | null;
  neighborhood: string;
  approx_location: string;
  residential_context: ResidentialContext;
  residential_name: string | null;

  price_cop: number;
  billing_period: string;
  admin_fee_cop: number;
  utilities_cop_min: number | null;
  utilities_cop_max: number | null;

  listing_kind: ListingKind;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_m2: number | null;
  independent: boolean;
  furnished: boolean;
  parking_car_count: number;
  parking_motorcycle_count: number;
  pets_allowed: boolean | null;
  floor_number: number | null;
  has_elevator: boolean | null;
  room_bathroom_private: boolean | null;
  kitchen_access: boolean | null;
  cohabitants_count: number | null;

  includes: string[];
  utilities_notes: string | null;

  requirements: string[];
  requirements_notes: string | null;

  available_from: string | null;
  min_stay_months: number | null;
  published_at: string | null;
  rented_at: string | null;

  whatsapp_e164: string;

  title: string;
  description: string | null;

  cover_photo_url: string;
}

/** Row shape returned by Supabase for public.listing_photos */
export interface ListingPhoto {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  room_type: ListingPhotoRoomType | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
}

/** Row shape returned by Supabase for public.listing_pois */
export interface ListingPoi {
  id: string;
  listing_id: string;
  kind: ListingPoiKind;
  name: string;
  distance_m: number | null;
  walk_minutes: number | null;
  created_at: string;
  updated_at: string;
}

/** Row shape returned by Supabase for public.listing_audit_logs */
export interface ListingAuditLog {
  id: number;
  listing_id: string;
  actor_user_id: string | null;
  action:
    | "create"
    | "update"
    | "status_change"
    | "activate"
    | "deactivate"
    | "mark_rented"
    | "photo_add"
    | "photo_remove"
    | "photo_reorder";
  payload: Record<string, unknown>;
  created_at: string;
}
