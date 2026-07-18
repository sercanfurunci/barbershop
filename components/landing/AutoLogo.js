import Logo from "@/components/common/Logo";

// ponytail: no useTheme/window — CSS dark: handles the swap, no hydration mismatch
export default function AutoLogo({ href, size }) {
  return <Logo href={href} size={size} />;
}
