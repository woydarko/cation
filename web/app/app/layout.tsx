import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your pool · Cation",
  description:
    "Deposit USDC, earn tickets, and go for the daily prize. Withdraw your principal anytime, so you never lose a cent.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
