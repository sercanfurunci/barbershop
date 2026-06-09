// Lightweight API client — wraps fetch with base URL + auth token

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // send httpOnly cookie
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = new Error(err.error ?? "API error");
    e.status = res.status;
    throw e;
  }

  return res.json();
}

// Normalize API appointment → UI shape
export function normalizeAppointment(a) {
  return {
    id:        a.id,
    client:    a.client?.name  ?? a.client  ?? "",
    phone:     a.client?.phone ?? a.phone   ?? "",
    email:     a.client?.email ?? "",
    service:   a.service?.nameTr ?? a.service ?? "",
    serviceId: a.serviceId,
    barber:    a.barber?.nameTr  ?? a.barber  ?? "",
    barberId:  a.barberId,
    date:      a.date,
    time:      a.time,
    duration:  a.duration,
    price:     a.price,
    status:    (a.status  ?? "pending").toLowerCase().replace("_", "-"),
    source:    (a.source  ?? "online").toLowerCase(),
    notes:     a.notes ?? "",
  };
}
