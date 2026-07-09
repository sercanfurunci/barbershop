export type Role = "SUPER_ADMIN" | "ADMIN" | "BARBER" | "RECEPTIONIST" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  avatarUrl?: string | null;
  phone?: string | null;
  notifAppt?: boolean;
  notifReminder?: boolean;
  notifPromo?: boolean;
  barber?: {
    id: string;
    slug: string;
    nameTr: string;
    avatar: string | null;
    profilePhoto?: string | null;
  } | null;
  shop?: {
    id: string;
    slug: string;
    name: string;
    status: string;
    subscriptionStatus: string;
    planTier: string;
    trialEndsAt?: string | null;
  } | null;
}

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NOSHOW";

export interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  price: number;
  grossAmount?: number | null;
  barberAmount?: number | null;
  shopAmount?: number | null;
  isWalkIn: boolean;
  notes?: string | null;
  client: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  barber: {
    id: string;
    nameTr: string;
    avatar?: string | null;
  };
  service: {
    id: string;
    nameTr: string;
    nameEn?: string | null;
  };
}

export interface ApiError {
  error: string;
}

export type CoverStyle = "auto" | "custom" | "gallery_hero" | "logo_hero" | "no_hero";

export interface MobileSettings {
  coverStyle?: CoverStyle;
  barberDisplay?: {
    showPhotos?: boolean;
    showRatings?: boolean;
    showYearsExp?: boolean;
    showSpecialties?: boolean;
    showAvailability?: boolean;
    hideInactive?: boolean;
    showUnavailableDisabled?: boolean;
  };
  serviceDisplay?: {
    showPrices?: boolean;
    showDuration?: boolean;
    showCategories?: boolean;
    highlightPopular?: boolean;
  };
  sectionVisibility?: {
    showReviews?: boolean;
    showGallery?: boolean;
    showTeam?: boolean;
    showAddress?: boolean;
    showInstagram?: boolean;
    showWhatsapp?: boolean;
    showGoogleRating?: boolean;
    showInternalRating?: boolean;
  };
}

export interface PublicShop {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  gallery?: string[];
  avgRating?: number | null;
  reviewCount?: number;
  totalReviews?: number | null;
  description?: string | null;
  instagramUrl?: string | null;
  shopType?: string | null;
  barbers?: PublicBarber[];
  services?: PublicService[];
  website?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  foundedYear?: number | null;
  ownerName?: string | null;
  about?: string | null;
  mapsEmbed?: string | null;
  featuredImage?: string | null;
  mobileSettings?: MobileSettings | null;
  workingHours?: Array<{
    day: string;
    label: string;
    open: string;
    close: string;
    closed: boolean;
  }>;
  faq?: Array<{ q: string; a: string }>;
}

export interface PublicBarber {
  id: string;
  slug: string;
  nameTr: string;
  avatar?: string | null;
  profilePhoto?: string | null;
  available?: boolean | null;
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  yearsExp?: number;
}

export interface PublicService {
  id: string;
  nameTr: string;
  nameEn?: string | null;
  price: number;
  duration: number;
  icon?: string;
  category?: string;
  popular?: boolean;
}

export interface CustomerProfile {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  birthday: string | null;
  gender: string | null;
  avatarUrl: string | null;
  notifAppt: boolean;
  notifReminder: boolean;
  notifPromo: boolean;
}

export interface BarberAdmin {
  id: string;
  slug: string;
  nameTr: string;
  nameEn?: string | null;
  titleTr: string;
  titleEn?: string | null;
  bioTr?: string | null;
  avatar: string;
  profilePhoto?: string | null;
  color?: string;
  available: boolean;
  yearsExp: number;
  specialties: string[];
  rating: number;
  reviewCount: number;
  paymentType: "PERCENTAGE" | "FIXED";
  commissionRate: number;
  fixedSalary?: number | null;
  shopId: string;
  workingHours?: {
    monStart?: number | null; monEnd?: number | null;
    tueStart?: number | null; tueEnd?: number | null;
    wedStart?: number | null; wedEnd?: number | null;
    thuStart?: number | null; thuEnd?: number | null;
    friStart?: number | null; friEnd?: number | null;
    satStart?: number | null; satEnd?: number | null;
    sunStart?: number | null; sunEnd?: number | null;
  } | null;
}

export interface BarberHoliday {
  id: string;
  shopId: string;
  barberId: string | null;
  date: string;
  label: string;
  createdAt: string;
}

export interface PublicReview {
  id: string;
  shopRating: number;
  barberRating?: number | null;
  comment?: string | null;
  clientName: string;
  customerName?: string;
  createdAt: string;
  barber?: { id: string; nameTr: string; avatar?: string | null } | null;
}

export interface GuestBooking {
  shopId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  notes?: string;
  source?: string;
}

export interface PublicAppointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  price: number;
  notes?: string | null;
  shop: { id: string; name: string; slug: string; address?: string | null; phone?: string | null; logo?: string | null };
  barber: { id: string; nameTr: string; avatar?: string | null; profilePhoto?: string | null };
  service: { id: string; nameTr: string; duration: number };
}
