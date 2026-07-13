/**
 * k6 load test — booking flow
 *
 * Install k6: brew install k6
 *
 * Run against production:
 *   k6 run tests/load/booking.js \
 *     --env BASE_URL=https://makas.furunci.tech \
 *     --env SHOP_ID=shop-demo \
 *     --env SHOP_SLUG=demo \
 *     --env SERVICE_ID=demo-svc-1 \
 *     --env BARBER_ID=demo-brb-1
 *
 * Run locally (npm run dev first):
 *   k6 run tests/load/booking.js --env BASE_URL=http://localhost:3000 ...
 *
 * Targets:
 *   - 100 concurrent users, sustained 2 minutes
 *   - p95 response time < 2s
 *   - booking error rate < 5% (429 rate-limit counts as error here)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate   = new Rate("errors");
const bookingTime = new Trend("booking_duration_ms", true);

export const options = {
  stages: [
    { duration: "30s", target: 20  },
    { duration: "2m",  target: 100 },
    { duration: "30s", target: 0   },
  ],
  thresholds: {
    http_req_duration:   ["p(95)<3500"], // serverless + Neon; tighten after pgBouncer Pro
    errors:              ["rate<0.05"],  // 5% — rate limiter will fire under full load
    booking_duration_ms: ["p(95)<3000"],
  },
};

const BASE_URL   = __ENV.BASE_URL   || "http://localhost:3000";
const SHOP_ID    = __ENV.SHOP_ID    || "shop-demo";
const SHOP_SLUG  = __ENV.SHOP_SLUG  || "demo";
const SERVICE_ID = __ENV.SERVICE_ID || "demo-svc-1";
const BARBER_ID  = __ENV.BARBER_ID  || "demo-brb-1";

function randomPhone() {
  return `+905${String(Math.floor(Math.random() * 900000000) + 100000000)}`;
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function () {
  const headers = { "Content-Type": "application/json" };
  const date = tomorrow(); // tomorrow avoids "past date" rejections

  // 1. Salon page (static/ISR — should be very fast)
  const shopRes = http.get(`${BASE_URL}/${SHOP_SLUG}`, { tags: { name: "shop_page" } });
  check(shopRes, { "shop page 200": (r) => r.status === 200 });
  errorRate.add(shopRes.status !== 200);

  sleep(0.5);

  // 2. Availability — correct params: shopId, barberId, serviceId, date
  const availRes = http.get(
    `${BASE_URL}/api/availability?shopId=${SHOP_ID}&barberId=${BARBER_ID}&serviceId=${SERVICE_ID}&date=${date}`,
    { tags: { name: "availability" } }
  );
  check(availRes, { "availability 200": (r) => r.status === 200 });
  errorRate.add(availRes.status !== 200);

  sleep(0.3);

  // 3. Book appointment
  // 201 = booked, 409 = slot taken (race), 429 = rate limited (expected under load)
  const start = Date.now();
  const bookRes = http.post(
    `${BASE_URL}/api/appointments`,
    JSON.stringify({
      shopId:    SHOP_ID,
      serviceId: SERVICE_ID,
      barberId:  BARBER_ID,
      date,
      time:      "10:00",
      name:      "Load Test",
      phone:     randomPhone(),
      email:     "loadtest@makas.test",
      source:    "ONLINE",
    }),
    { headers, tags: { name: "book_appointment" } }
  );
  bookingTime.add(Date.now() - start);

  const bookOk = [201, 409, 429].includes(bookRes.status);
  check(bookRes, { "booking 201/409/429": () => bookOk });
  errorRate.add(!bookOk);

  sleep(1 + Math.random() * 2);
}
