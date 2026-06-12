export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#F6F3EE" }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "#E5DFD6", borderTopColor: "#C62828" }}
      />
    </div>
  );
}
