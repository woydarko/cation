import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = { title: "Not found · Cation" };

export default function NotFound() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-24 text-center">
      <div>
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <p className="tabular text-7xl font-bold text-volt mb-4" style={{ fontFamily: "var(--font-data)" }}>
          404
        </p>
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Nothing in the pot here.
        </h1>
        <p className="text-ink-60 mb-8">That page doesn&apos;t exist. Your money is still safe.</p>
        <Link href="/" className="btn btn-primary inline-flex px-6 py-3">
          Back home
        </Link>
      </div>
    </main>
  );
}
