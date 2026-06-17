"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch, normalizeAppointment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const { user, loaded: authLoaded } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loaded, setLoaded]             = useState(false);

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
  // Re-runs when the logged-in user changes (login / logout / navigation).
  useEffect(() => {
    if (!authLoaded || !user) {
      // Not logged in — clear stale data so the next login sees a clean slate
      if (authLoaded) { setAppointments([]); setLoaded(false); }
      return;
    }
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
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
      source:    (appt.source ?? "PHONE").toUpperCase(),
    };

    const created = await apiFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const normalized = normalizeAppointment(created);
    setAppointments((prev) => [normalized, ...prev]);
    return normalized;
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    // status comes in as lowercase ("confirmed") — convert to API format
    const apiStatus = status.toUpperCase().replace("-", "_");
    await apiFetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: apiStatus }),
    });
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }, []);

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

  return (
    <AppointmentsContext.Provider value={{
      appointments, loaded,
      addAppointment, updateStatus, updateAppointment,
      deleteAppointment, getByDate, getByBarberDate,
      refresh: fetchAll,
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be inside AppointmentsProvider");
  return ctx;
}
