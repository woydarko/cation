"use client";
import { useRouter } from "next/navigation";
import { useWallet } from "./WalletProvider";

/** Landing call-to-action. Opens the wallet modal directly (or goes to the
 * dashboard if already connected) instead of navigating to /app first. */
export default function ConnectCta({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "white";
}) {
  const { address, connect, connecting } = useWallet();
  const router = useRouter();

  const onClick = () => {
    if (address) router.push("/app");
    else connect(); // WalletProvider redirects to /app after a successful connect
  };

  const cls =
    variant === "white"
      ? "btn inline-flex px-8 py-4 text-lg bg-white text-volt font-semibold"
      : "btn btn-primary inline-flex px-8 py-4 text-lg";

  return (
    <button onClick={onClick} disabled={connecting} className={cls}>
      {connecting ? "Connecting…" : children}
    </button>
  );
}
