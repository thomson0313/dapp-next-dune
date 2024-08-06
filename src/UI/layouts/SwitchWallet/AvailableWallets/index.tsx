import { useEffect } from "react";

import { useWalletClient } from "wagmi";

import useToast from "@/UI/hooks/useToast";
import { maskString } from "@/UI/utils/Text";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/UI/lib/zustand/store";
import { getSessionInfo } from "@/UI/services/PointsAPI";
import { CloseButton } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { WALLET_SWITCH_LIST_KEY } from "@/UI/utils/constants";
import DelegatedWalletButton from "../DelegatedWalletButton";

export const AvailableWallets = () => {
  const router = useRouter();
  const { ithacaSDK, isAuthenticated, setDelegatedWalletAddress, delegatedWalletAddress } = useAppStore();
  const { data: walletClient } = useWalletClient();
  const { showToast, showErrorToast } = useToast();

  const { data: { payload } = { payload: [] }, refetch: refetchWallets } = useQuery({
    queryKey: [WALLET_SWITCH_LIST_KEY],
    queryFn: () => ithacaSDK.wallets.switchList(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const checkSession = () => {
      const session = getSessionInfo();
      if (session.origAddr) {
        setDelegatedWalletAddress(session.ethAddress);
      }
    };

    if (isAuthenticated) {
      checkSession();
      const interval = setInterval(() => checkSession(), 5_000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const selectWallet = async (addr: string) => {
    if (addr.toLocaleLowerCase() === delegatedWalletAddress?.toLocaleLowerCase()) {
      showErrorToast({
        title: "Wallet information",
        message: `You are already on ${maskString(addr)}`,
      });
      return;
    }
    try {
      const newSession = await ithacaSDK.auth.switchAuth({ addr: addr.toLocaleLowerCase() });
      setDelegatedWalletAddress(newSession.origAddr ? newSession.ethAddress : null);
      localStorage.setItem("ithaca.session", JSON.stringify(newSession));
      refetchWallets();
      showToast({
        title: "Wallet switched",
        message: `Wallet switched to ${maskString(addr)} successfully`,
      });
    } catch (error) {
      showErrorToast({
        title: "Wallet switch failed",
        message: `Wallet switch to ${maskString(addr)} failed`,
      });
      console.error(error);
    }
  };

  if (!isAuthenticated) return null;

  const mainWalletAddress = walletClient?.account.address;

  const addressesToUse = payload.filter(
    (item: string) => item.toLocaleLowerCase() !== mainWalletAddress?.toLocaleLowerCase()
  );

  return (
    <>
      {payload.length === 0 && (
        <CloseButton className=' tw-flex tw-cursor-default tw-flex-row tw-items-center tw-justify-center tw-gap-2 tw-rounded-tl-lg tw-rounded-tr-lg tw-px-4 tw-py-3 tw-text-white hover:tw-text-ithaca-green-30 '>
          <div className='tw-flex tw-flex-col'>
            <p>To delegate a wallet go to</p>
            <button className='tw-p-2 tw-underline' onClick={() => router.push("/account-access-management")}>
              Account Access Management
            </button>
          </div>
        </CloseButton>
      )}

      {(addressesToUse.length > 0 || delegatedWalletAddress) && mainWalletAddress && (
        <>
          <DelegatedWalletButton
            address={mainWalletAddress}
            selectWallet={selectWallet}
            title='Connected Wallet'
            isSelected={false}
          />
          <div className='tw-mx-4 tw-my-1 tw-border-b tw-border-ithaca-white-60' />
        </>
      )}
      {delegatedWalletAddress && (
        <DelegatedWalletButton
          address={delegatedWalletAddress}
          selectWallet={selectWallet}
          title='Connected Wallet'
          isSelected={true}
        />
      )}
      {addressesToUse.map((address: string, index: number) => (
        <DelegatedWalletButton
          isSelected={delegatedWalletAddress?.toLocaleLowerCase() === address.toLocaleLowerCase()}
          key={maskString(address)}
          address={address}
          selectWallet={selectWallet}
          title={`Delegate Wallet ${++index}`}
        />
      ))}
    </>
  );
};
