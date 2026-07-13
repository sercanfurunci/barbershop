"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch, normalizeAppointment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import CompleteAppointmentModal from "@/components/admin/CompleteAppointmentModal";
import CancelAppointmentModal   from "@/components/admin/CancelAppointmentModal";

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const { user, loaded: authLoaded } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loaded, setLoaded]             = useState(false);
  // ponytail: completion modal lives at the provider so every callsite
  // (AppointmentsList / CalendarView / AdminDashboard / BarberDashboard)
  // keeps its existing updateStatus(id,"completed") call — no UI churn.
  const [completing, setCompleting] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const data = await apiFetch("/api/appointments");
      setAppointments(data.map(normalizeAppointment));
    } catch {
      // silently keep current state
    } finally {
      setLoaded(true);
    }
  }, []);

  // Only start fetching after auth is confirmed AND a user is logged in.
  // Pauses polling when the browser tab is hidden to avoid wasted DB queries.
  useEffect(() => {
    if (!authLoaded || !user) {
      if (authLoaded) { setAppointments([]); setLoaded(false); }
      return;
    }

    fetchAll();
    let id = setInterval(fetchAll, 60_000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(id);
      } else {
        fetchAll(); // immediate refresh on tab restore
        id = setInterval(fetchAll, 60_000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [authLoaded, user?.id, fetchAll]);

  const addAppointment = useCallback(async (appt) => {
    const payload = {
      name:      appt.client,
      phone:     appt.phone,
      email:     appt.email ?? "",
      serviceId: appt.serviceId,
      barberId:  appt.barberId,
      date:      appt.date,
      time:      appt.time,
      notes:     appt.notes ?? "",
      source:    (appt.source ?? "MANUAL").toUpperCase(),
    };

    const created = await apiFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const normalized = normalizeAppointment(created);
    setAppointments((prev) => [normalized, ...prev]);
    return normalized;
  }, []);

  const updateStatus = useCallback(async (id, status, extra) => {
    // Completion needs finalPrice + paymentMethod; cancellation captures reason
    // + actor. If extras are missing, open the matching modal and let it call
    // back with the user-entered values. This keeps existing callsites simple:
    // they still call updateStatus(id, "cancelled") with no extras.
    if (status === "completed" && !extra) {
      const current = appointments.find((a) => a.id === id);
      if (current) { setCompleting(current); return; }
    }
    if (status === "cancelled" && !extra) {
      const current = appointments.find((a) => a.id === id);
      if (current) { setCancelling(current); return; }
    }

    const apiStatus = status.toUpperCase().replace("-", "_");
    const body = { status: apiStatus, ...(extra ?? {}) };
    const updated = await apiFetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    setAppointments((prev) =>
      prev.map((a) => a.id === id
        ? { ...a, ...normalizeAppointment(updated), status }
        : a
      )
    );
  }, [appointments]);

  const handleCompleteSubmit = useCallback(async (values) => {
    if (!completing) return;
    await updateStatus(completing.id, "completed", values);
    setCompleting(null);
  }, [completing, updateStatus]);

  const handleCancelSubmit = useCallback(async (values) => {
    if (!cancelling) return;
    await updateStatus(cancelling.id, "cancelled", values);
    setCancelling(null);
  }, [cancelling, updateStatus]);

  const updateAppointment = useCallback(async (id, patch) => {
    await apiFetch(`/api/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }, []);

  const deleteAppointment = useCallback(async (id) => {
    await apiFetch(`/api/appointments/${id}`, { method: "DELETE" });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getByDate = useCallback(
    (date) => appointments.filter((a) => a.date === date),
    [appointments]
  );

  const getByBarberDate = useCallback(
    (barberId, date) => appointments.filter((a) => a.barberId === barberId && a.date === date),
    [appointments]
  );

  const value = useMemo(() => ({
    appointments, loaded,
    addAppointment, updateStatus, updateAppointment,
    deleteAppointment, getByDate, getByBarberDate,
    refresh: fetchAll,
  }), [appointments, loaded, addAppointment, updateStatus, updateAppointment, deleteAppointment, getByDate, getByBarberDate, fetchAll]);

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
      {completing && (
        <CompleteAppointmentModal
          appointment={completing}
          onClose={() => setCompleting(null)}
          onSubmit={handleCompleteSubmit}
        />
      )}
      {cancelling && (
        <CancelAppointmentModal
          appointment={cancelling}
          defaultCancelledBy={user?.role === "BARBER" ? "barber" : "shop"}
          onClose={() => setCancelling(null)}
          onSubmit={handleCancelSubmit}
        />
      )}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be inside AppointmentsProvider");
  return ctx;
}
