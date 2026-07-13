/**
 * k6 load test — booking flow
 *
 * Install k6: brew install k6
 * Run:        k6 run tests/load/booking.js --env BASE_URL=https://makas.furunci.tech
 * Local:      k6 run tests/load/booking.js --env BASE_URL=http://localhost:3000
 *
 * Targets:
 *   - 100 concurrent users, sustained 2 minutes
 *   - p95 response time < 2s
 *   - error rate < 1%
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate   = new Rate("errors");
const bookingTime = new Trend("booking_duration_ms", true);

export const options = {
  stages: [
    { duration: "30s", target: 20  }, // ramp up
    { duration: "2m",  target: 100 }, // sustained load
    { duration: "30s", target: 0   }, // ramp down
  ],
  thresholds: {
    http_req_duration:  ["p(95)<2000"],
    errors:             ["rate<0.01"],
    booking_duration_ms:["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const SHOP_SLUG = __ENV.SHOP_SLUG || "demo";

function randomPhone() {
  return `+905${String(Math.floor(Math.random() * 900000000) + 100000000)}`;
}

export default function () {
  const headers = { "Content-Type": "application/json" };

  // 1. Load salon page (public, no auth)
  const shopRes = http.get(`${BASE_URL}/${SHOP_SLUG}`, { tags: { name: "shop_page" } });
  check(shopRes, { "shop page 200": (r) => r.status === 200 });
  errorRate.add(shopRes.status !== 200);

  sleep(0.5);

  // 2. Get availability
  const today = new Date().toISOString().split("T")[0];
  const availRes = http.get(
    `${BASE_URL}/api/availability?shopSlug=${SHOP_SLUG}&date=${today}`,
    { tags: { name: "availability" } }
  );
  check(availRes, { "availability 200": (r) => r.status === 200 });
  errorRate.add(availRes.status !== 200);

  sleep(0.3);

  // 3. Book appointment
  const start = Date.now();
  const bookRes = http.post(
    `${BASE_URL}/api/appointments`,
    JSON.stringify({
      shopSlug:   SHOP_SLUG,
      serviceId:  __ENV.SERVICE_ID  || null,
      barberId:   __ENV.BARBER_ID   || null,
      date:       today,
      startTime:  "10:00",
      clientName: "Load Test User",
      clientPhone: randomPhone(),
      source:     "ONLINE",
    }),
    { headers, tags: { name: "book_appointment" } }
  );
  bookingTime.add(Date.now() - start);

  // 409 SLOT_TAKEN is expected under load — not an error
  const bookOk = bookRes.status === 201 || bookRes.status === 409;
  check(bookRes, { "booking 201 or 409": () => bookOk });
  errorRate.add(!bookOk);

  sleep(1);

  // 4. Health check (baseline)
  const healthRes = http.get(`${BASE_URL}/api/health`, { tags: { name: "health" } });
  check(healthRes, { "health ok": (r) => r.status === 200 });

  sleep(Math.random() * 2);
}
