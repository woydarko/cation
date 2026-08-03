"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import WalletModal from "./WalletModal";
import {
  currentAddress,
  disconnect as kitDisconnect,
  listWallets,
  selectWallet,
  deposit as doDeposit,
  withdraw as doWithdraw,
  getTestUsdc,
  wasConnected,
  type Wallet,
} from "@/lib/client/wallet";

type WalletCtx = {
  address: string | null;
  connecting: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  deposit: (amountStroops: string, lockUntil: bigint) => Promise<void>;
  withdraw: (amountStroops: string, forceEarly: boolean) => Promise<void>;
  getTestUsdc: () => Promise<void>;
};

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (wasConnected()) currentAddress().then((a) => a && setAddress(a));
  }, []);

  // Opening our own picker (not the kit's default modal).
  const connect = useCallback(() => {
    setSelectError(null);
    setPickerOpen(true);
    setWallets([]);
    listWallets().then(setWallets).catch(() => setWallets([]));
  }, []);

  const select = useCallback(
    async (w: Wallet) => {
      if (!w.isAvailable) {
        window.open(w.url, "_blank", "noopener,noreferrer");
        return;
      }
      setSelectError(null);
      setConnectingId(w.id);
      try {
        const a = await selectWallet(w.id);
        setAddress(a);
        setPickerOpen(false);
        router.push("/app");
      } catch (e) {
        // Wallet declined or an extension conflict. Surface a hint, don't crash.
        console.warn("wallet connect failed", e);
        setSelectError(`Couldn't connect ${w.name}. Try again or pick another wallet.`);
      } finally {
        setConnectingId(null);
      }
    },
    [router]
  );

  const disconnect = useCallback(async () => {
    await kitDisconnect();
    setAddress(null);
  }, []);

  const deposit = useCallback(
    async (amountStroops: string, lockUntil: bigint) => {
      if (!address) throw new Error("no wallet");
      await doDeposit(address, amountStroops, lockUntil);
    },
    [address]
  );

  const withdraw = useCallback(
    async (amountStroops: string, forceEarly: boolean) => {
      if (!address) throw new Error("no wallet");
      await doWithdraw(address, amountStroops, forceEarly);
    },
    [address]
  );

  const claimUsdc = useCallback(async () => {
    if (!address) throw new Error("no wallet");
    await getTestUsdc(address);
  }, [address]);

  const value = useMemo<WalletCtx>(
    () => ({
      address,
      connecting: connectingId !== null,
      connect,
      disconnect,
      deposit,
      withdraw,
      getTestUsdc: claimUsdc,
    }),
    [address, connectingId, connect, disconnect, deposit, withdraw, claimUsdc]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {pickerOpen && (
        <WalletModal
          wallets={wallets}
          connectingId={connectingId}
          error={selectError}
          onSelect={select}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet outside WalletProvider");
  return c;
}
