export const metadata = { robots: "noindex" };

export default function WidgetLayout({ children }) {
  return (
    <html lang="tr" style={{ background: "transparent" }}>
      <body style={{ margin: 0, padding: 0, background: "transparent", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
