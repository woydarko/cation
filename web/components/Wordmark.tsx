import Link from "next/link";

/** The Cation wordmark - a positively charged ion, so the "+" sparks. */
export default function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-lg" : "text-xl";
  return (
    <Link href="/" className={`font-bold tracking-tight ${cls}`} style={{ fontFamily: "var(--font-display)" }}>
      Cation<span className="text-volt spark inline-block">+</span>
    </Link>
  );
}
