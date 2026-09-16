export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";

export interface CustomerProfile {
  wallet_balance: number | string;
  loyalty_points: number;
  membership_tier: string;
  total_bookings: number;
  total_spending: number | string;
  cancellation_count: number;
  no_show_count: number;
  birthday?: string | null;
}

export interface StaffProfile {
  employee_id: string;
  department: string;
  is_on_duty: boolean;
}

export interface User {
  id: string;
  email: string;
  google_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_image?: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  referral_code: string;
  date_joined: string;
  last_login_at?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  permissions?: string[];
  customer_profile?: CustomerProfile;
  staff_profile?: StaffProfile;
}

export type FeatureFlagKey =
  | "RECURRING_BOOKINGS"
  | "PARTIAL_PAYMENTS"
  | "WALK_IN_BOOKINGS"
  | "DYNAMIC_PRICING"
  | "QR_CHECKIN"
  | "ONLINE_PAYMENTS"
  | "OFFLINE_PAYMENTS"
  | "COUPONS"
  | "REVIEWS"
  | "ADVANCED_REPORTING";

export interface Payment {
  id: string;
  payment_id: string;
  booking: string;
  booking_reference?: string;
  customer: string;
  customer_email?: string;
  provider: "RAZORPAY" | "WALLET" | "CASH";
  provider_order_id?: string;
  provider_payment_id?: string;
  amount: number | string;
  currency: string;
  payment_method: string;
  payment_type: "FULL" | "PARTIAL" | "BALANCE";
  status:
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "SUCCESSFUL"
    | "FAILED"
    | "TIMEOUT"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";
  failure_reason?: string;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
}

export interface Facility {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Turf {
  id: string;
  name: string;
  slug: string;
  sport_type: "FOOTBALL" | "CRICKET" | "MULTI_SPORT" | "BADMINTON" | "TENNIS";
  description: string;
  location: string;
  address: string;
  base_price: number | string;
  capacity: number;
  surface_spec?: string;
  is_fifa_certified?: boolean;
  lighting_spec?: string;
  dugout_spec?: string;
  dimensions?: string;
  fast_fill_threshold?: number;
  facilities_data: Facility[];
  images: string[];
  operating_hours_start: string;
  operating_hours_end: string;
  slot_duration_minutes: number;
  is_active: boolean;
  rating: number | string;
  total_reviews: number;
}

export interface TimeSlot {
  id: string;
  turf: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "LOCKED" | "BOOKED" | "MAINTENANCE";
  price: number;
  base_price?: number;
  applied_rules?: { name: string; type: string; amount: number }[];
  is_available: boolean;
  locked_until?: string | null;
  booking_id?: string;
}

export interface QRTicketData {
  ticket_code: string;
  qr_base64: string;
  is_used: boolean;
  used_at?: string | null;
}

export interface Booking {
  id: string;
  booking_id: string;
  customer: string;
  customer_details?: User;
  turf: string;
  turf_details?: Turf;
  date: string;
  start_time: string;
  end_time: string;
  slots: string[];
  slots_data?: TimeSlot[];
  booking_type: "REGULAR" | "RECURRING" | "GROUP" | "WALK_IN";
  status:
    | "UPCOMING"
    | "PAYMENT_PENDING"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "REFUNDED";
  total_amount: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  final_amount: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  coupon_code?: string;
  pricing_breakdown?: any;
  participants?: any[];
  notes?: string;
  checked_in_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string;
  completed_at?: string | null;
  qr_ticket_data?: QRTicketData;
  created_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  rule_type: string;
  turf?: string | null;
  turf_name?: string;
  adjustment_type: "PERCENTAGE" | "FIXED";
  adjustment_value: number | string;
  applicable_days: number[];
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  priority: number;
  is_active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number | string;
  min_booking_amount: number | string;
  max_discount_amount?: number | string | null;
  start_date: string;
  end_date: string;
  usage_limit: number;
  per_user_limit: number;
  usage_count: number;
  coupon_type: string;
  is_active: boolean;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  tier_level: number;
  description: string;
  discount_percentage: number | string;
  priority_booking_days: number;
  loyalty_point_multiplier: number | string;
  monthly_price: number | string;
  annual_price: number | string;
  features: string[];
  badge_color: string;
  is_active: boolean;
}

export interface WalletTransaction {
  id: string;
  amount: number | string;
  transaction_type: "CREDIT" | "DEBIT";
  source: string;
  reference_id: string;
  description: string;
  balance_after: number | string;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  transaction_type: "EARN" | "REDEEM" | "BONUS" | "EXPIRE";
  source: string;
  reference_id: string;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  booking: string;
  booking_reference: string;
  customer: string;
  customer_name: string;
  turf: string;
  turf_name: string;
  rating: number;
  facility_rating: number;
  staff_rating: number;
  review_text: string;
  suggestions?: string;
  admin_response?: string;
  is_flagged: boolean;
  is_hidden: boolean;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  turf: string;
  turf_name: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  assigned_staff?: string | null;
  staff_name?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface DashboardMetrics {
  kpis: {
    today_bookings: number;
    today_revenue: number;
    upcoming_bookings: number;
    pending_payments: number;
    cancellations: number;
    no_shows: number;
    occupancy_rate: number;
    available_slots: number;
    active_customers: number;
    average_rating: number;
  };
  revenue_trend: { date: string; revenue: number; bookings: number }[];
  peak_hours: { hour: string; count: number }[];
  turf_utilization: {
    turf_name: string;
    sport: string;
    total_bookings: number;
    base_price: number;
  }[];
}

export interface AuditLogEntry {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address?: string;
  created_at: string;
}
