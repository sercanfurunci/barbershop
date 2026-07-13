"use client";

import AppointmentsTab from "./AppointmentsTab";

export default function HistoryTab({ appointments, setAppointments }) {
  return <AppointmentsTab type="history" appointments={appointments} setAppointments={setAppointments} />;
}
