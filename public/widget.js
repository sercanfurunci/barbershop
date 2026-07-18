/**
 * MAKAS Chat Widget — embed SDK
 *
 * Usage:
 *   <script src="https://makas.furunci.tech/widget.js" data-shop="SHOP_SLUG"></script>
 *
 * Optional attributes:
 *   data-position="bottom-left"   (default: bottom-right)
 *   data-primary-color="#111111"  (widget header + launcher color)
 *   data-accent-color="#FFFFFF"   (icon color on header)
 *
 * The script injects a fixed-position iframe that hosts the chat UI.
 * No external dependencies, works in any HTML page.
 */
(function () {
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var shopSlug     = script.getAttribute("data-shop");
  var position     = script.getAttribute("data-position") || "bottom-right";
  var primaryColor = script.getAttribute("data-primary-color") || "#111111";
  var accentColor  = script.getAttribute("data-accent-color")  || "#FFFFFF";

  if (!shopSlug) {
    console.warn("[MAKAS Widget] Missing data-shop attribute.");
    return;
  }

  // Base URL: same origin as the script, or makas.furunci.tech fallback
  var base = (script.src || "").replace(/\/widget\.js.*$/, "") || "https://makas.furunci.tech";

  var params = new URLSearchParams({
    primaryColor: primaryColor,
    accentColor:  accentColor,
    position:     position,
  });

  var iframeSrc = base + "/widget/" + encodeURIComponent(shopSlug) + "?" + params.toString();

  // Fixed-position container sized to fit an open widget (380×600).
  // The widget page renders in embedded mode so it manages its own chat open/close.
  // We use a launcher-only iframe approach: iframe is sized to launcher button
  // initially and resizes on open message from the widget page.
  var CLOSED_SIZE  = 72;   // px — launcher button + badge
  var OPEN_WIDTH   = 396;  // px — panel width + some buffer
  var OPEN_HEIGHT  = 640;  // px — panel height

  var iframe = document.createElement("iframe");
  iframe.src         = iframeSrc;
  iframe.title       = "MAKAS Canlı Destek";
  iframe.allow       = "";
  iframe.frameBorder = "0";
  iframe.scrolling   = "no";

  var isLeft = position === "bottom-left";
  var inset  = "24px";

  Object.assign(iframe.style, {
    position:   "fixed",
    bottom:     inset,
    right:      isLeft ? "auto" : inset,
    left:       isLeft ? inset  : "auto",
    zIndex:     "2147483647",           // max z-index
    width:      CLOSED_SIZE + "px",
    height:     CLOSED_SIZE + "px",
    border:     "none",
    background: "transparent",
    colorScheme: "normal",
    transition: "width 0.22s cubic-bezier(0.34,1.56,0.64,1), height 0.22s cubic-bezier(0.34,1.56,0.64,1)",
  });

  // Listen for open/close messages from the widget page.
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.source !== "makas-widget" || e.data.shopSlug !== shopSlug) return;
    if (e.data.type === "open") {
      iframe.style.width  = OPEN_WIDTH  + "px";
      iframe.style.height = OPEN_HEIGHT + "px";
    } else if (e.data.type === "close") {
      iframe.style.width  = CLOSED_SIZE + "px";
      iframe.style.height = CLOSED_SIZE + "px";
    }
  });

  document.body.appendChild(iframe);
})();
