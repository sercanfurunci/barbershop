/**
 * AI Tool Schema Manifest
 *
 * Provider-agnostic definitions of every callable tool an AI agent can invoke
 * against MAKAS. Format mirrors OpenAI function-calling spec so it can be
 * passed directly to compatible providers; wrap in the provider's envelope as
 * needed (Anthropic tool_use, Gemini function declarations, etc.).
 *
 * Each tool maps to one or more existing API routes or service functions.
 * No AI is wired here — this is a schema manifest only.
 */

export const AI_TOOLS = [
  {
    name: "GetAvailability",
    description: "Return available appointment slots for a barber on a given date.",
    parameters: {
      type: "object",
      required: ["shopId", "barberId", "date"],
      properties: {
        shopId:    { type: "string", description: "Shop ID" },
        barberId:  { type: "string", description: "Barber ID" },
        serviceId: { type: "string", description: "Service ID — used to calculate slot duration" },
        date:      { type: "string", description: "YYYY-MM-DD" },
      },
    },
    // Maps to: GET /api/availability/range or POST validateBookingWindow per slot
    handler: "availability.getSlots",
  },
  {
    name: "CreateAppointment",
    description: "Book an appointment. Requires customer name, phone, service, barber, date, time.",
    parameters: {
      type: "object",
      required: ["shopId", "name", "phone", "serviceId", "barberId", "date", "time"],
      properties: {
        shopId:    { type: "string" },
        name:      { type: "string", maxLength: 100 },
        phone:     { type: "string", description: "Turkish mobile number, any format" },
        email:     { type: "string" },
        serviceId: { type: "string" },
        barberId:  { type: "string" },
        date:      { type: "string", description: "YYYY-MM-DD" },
        time:      { type: "string", description: "HH:MM" },
        notes:     { type: "string", maxLength: 500 },
        source:    { type: "string", enum: ["AI_CHAT", "WHATSAPP", "INSTAGRAM", "VOICE", "MESSENGER"] },
      },
    },
    // Maps to: BookingService.createBooking()
    handler: "booking.create",
  },
  {
    name: "CancelAppointment",
    description: "Cancel an appointment by ID. Customer must be identified first.",
    parameters: {
      type: "object",
      required: ["appointmentId"],
      properties: {
        appointmentId:      { type: "string" },
        cancellationReason: { type: "string", maxLength: 500 },
      },
    },
    // Maps to: PATCH /api/appointments/[id] with status=CANCELLED
    handler: "appointment.cancel",
  },
  {
    name: "RescheduleAppointment",
    description: "Move an existing appointment to a new date and time.",
    parameters: {
      type: "object",
      required: ["appointmentId", "date", "time"],
      properties: {
        appointmentId: { type: "string" },
        date:          { type: "string", description: "YYYY-MM-DD" },
        time:          { type: "string", description: "HH:MM" },
      },
    },
    // Maps to: PATCH /api/appointments/[id]/reschedule
    handler: "appointment.reschedule",
  },
  {
    name: "FindCustomer",
    description: "Look up a customer by phone, email, or external channel identity.",
    parameters: {
      type: "object",
      properties: {
        shopId:     { type: "string" },
        phone:      { type: "string" },
        email:      { type: "string" },
        channel:    { type: "string", description: "Channel constant (e.g. WHATSAPP)" },
        externalId: { type: "string", description: "Channel-specific sender ID" },
      },
    },
    // Maps to: CustomerService.resolveIdentity()
    handler: "customer.resolve",
  },
  {
    name: "FindServices",
    description: "List active services offered by a shop, optionally filtered by barber.",
    parameters: {
      type: "object",
      required: ["shopId"],
      properties: {
        shopId:   { type: "string" },
        barberId: { type: "string" },
      },
    },
    // Maps to: GET /api/shops/[slug]/route or prisma.service.findMany
    handler: "catalog.services",
  },
  {
    name: "FindBarbers",
    description: "List available barbers at a shop.",
    parameters: {
      type: "object",
      required: ["shopId"],
      properties: {
        shopId: { type: "string" },
      },
    },
    // Maps to: GET /api/admin/barbers (or public equivalent)
    handler: "catalog.barbers",
  },
  {
    name: "GetWorkingHours",
    description: "Return a barber's working hours for the week.",
    parameters: {
      type: "object",
      required: ["barberId"],
      properties: {
        barberId: { type: "string" },
      },
    },
    // Maps to: prisma.workingHours.findUnique({ where: { barberId } })
    handler: "catalog.workingHours",
  },
  {
    name: "GetBusinessInfo",
    description: "Return shop name, address, phone, hours, and amenities.",
    parameters: {
      type: "object",
      required: ["shopId"],
      properties: {
        shopId: { type: "string" },
        slug:   { type: "string", description: "Alternative to shopId" },
      },
    },
    // Maps to: GET /api/shops/[slug]
    handler: "catalog.shopInfo",
  },
  {
    name: "GetPricing",
    description: "Return service prices for a shop, optionally filtered by category.",
    parameters: {
      type: "object",
      required: ["shopId"],
      properties: {
        shopId:   { type: "string" },
        category: { type: "string", enum: ["CUTS", "BEARD", "COMBO", "PREMIUM"] },
      },
    },
    // Maps to: prisma.service.findMany({ where: { shopId, active: true } })
    handler: "catalog.pricing",
  },
  {
    name: "GetCampaigns",
    description: "Return active promotions and birthday campaign info for a shop.",
    parameters: {
      type: "object",
      required: ["shopId"],
      properties: {
        shopId: { type: "string" },
      },
    },
    // Maps to: prisma.shop.findUnique (birthdayCampaign* fields)
    handler: "catalog.campaigns",
  },
  {
    name: "GetReviews",
    description: "Return recent barber reviews for a shop.",
    parameters: {
      type: "object",
      required: ["shopId"],
      properties: {
        shopId:   { type: "string" },
        slug:     { type: "string" },
        barberId: { type: "string" },
        take:     { type: "integer", minimum: 1, maximum: 20, default: 5 },
      },
    },
    // Maps to: GET /api/shops/[slug]/reviews
    handler: "reviews.list",
  },
];

// Tool name → definition lookup for O(1) access by AI runtime
export const AI_TOOLS_MAP = Object.fromEntries(AI_TOOLS.map(t => [t.name, t]));
