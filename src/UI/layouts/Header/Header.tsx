// Packages
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

// Components
import Navigation from "@/UI/components/Navigation/Navigation";
import IthacaLogoLabel from "@/UI/components/Icons/IthacaLogoLabel";
import SlidingNav from "@/UI/components/SlidingNav/SlidingNav";
import Hamburger from "@/UI/components/Hamburger/Hamburger";
import Wallet from "@/UI/components/Wallet/Wallet";
import RewardsDropdown from "@/UI/components/RewardsDropdown/RewardsDropdown";
import EditProfileModal from "@/UI/components/EditProfileModal/EditProfileModal";
import UserProfileIcon from "@/UI/components/Icons/UserProfileIcon";

// Hooks
import useMediaQuery from "@/UI/hooks/useMediaQuery";
import { useClickOutside } from "@/UI/hooks/useClickoutside";
import { useEscKey } from "@/UI/hooks/useEscKey";
import { useAccount, useAccountEffect, useWalletClient } from "wagmi";
import { useAppStore } from "@/UI/lib/zustand/store";
import { toast } from "react-toastify";
import ReconnectWallet from "@/UI/components/ReconnectWallet";
// Constants
import { DESKTOP_BREAKPOINT, MOBILE_BREAKPOINT, TABLET_BREAKPOINT } from "@/UI/constants/breakpoints";

// Styles
import styles from "./Header.module.scss";
import Bell from "@/UI/components/Icons/Bell";

// Images
import Logo from "@/assets/logo_ithaca.png";

// Services
import { GetUserData } from "@/UI/services/PointsAPI";
import { SwitchWallet } from "../SwitchWallet";
import useToast from "@/UI/hooks/useToast";

// Types
type HeaderProps = {
  className?: string;
  isTxnPanelOpen: boolean;
  setIsTxnPanelOpen: Dispatch<SetStateAction<boolean>>;
};

const Header = ({ className, isTxnPanelOpen, setIsTxnPanelOpen }: HeaderProps) => {
  const { showToast } = useToast();
  const { isConnected } = useAccount();
  const { initIthacaSDK, disconnect, crossChainTransactions, isAuthenticated } = useAppStore();
  const { data: walletClient } = useWalletClient();
  const searchParams = useSearchParams();
  const tabletBreakpoint = useMediaQuery(TABLET_BREAKPOINT);
  const mobileBreakpoint = useMediaQuery(MOBILE_BREAKPOINT);
  const desktopBreakpoint = useMediaQuery(DESKTOP_BREAKPOINT);
  const router = useRouter();
  const pathName = usePathname();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [contentAllowed, setContentAllowed] = useState<boolean>(true);
  const [sessionInvalid, setSessionInvalid] = useState<number>(-1);

  const handleHamburgerClick = () => {
    setIsHamburgerOpen(!isHamburgerOpen);
    document.body.classList.toggle("is-active");
  };

  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const rewardsDropdownRef = useRef(null);

  useEffect(() => {
    if (isConnected) setSessionInvalid(0);
    else if (sessionInvalid === 1 && localStorage.getItem("ithaca.session") !== null)
      toast(<ReconnectWallet title={"Reconnect Wallet"} content={"Session Expired"} />, {
        autoClose: false,
        position: "bottom-right",
      });
  }, [sessionInvalid, isConnected]);

  useEffect(() => {
    const ALLOWED = process.env.NEXT_PUBLIC_POINTS_ALLOWED;
    if (pathName.includes("/points/") && ALLOWED === "false") {
      const allowed = searchParams.get("allowed");
      setContentAllowed(allowed !== null);
    }
  }, [searchParams, pathName]);

  const closeRewardsDropdown = () => {
    setIsRewardsOpen(false);
  };

  useClickOutside(rewardsDropdownRef, closeRewardsDropdown);

  useEscKey(closeRewardsDropdown);

  useAccountEffect({
    onDisconnect: () => {
      disconnect();
      setSessionInvalid(1);
    },
  });

  useEffect(() => {
    if (!walletClient) return;
    initIthacaSDK(walletClient);
    if (isAuthenticated) {
      GetUserData();
    }
  }, [initIthacaSDK, walletClient, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated)
      showToast({
        title: "Wallet Ownership Verified",
        message: "Your wallet ownership has been verified. You can now deposit funds and trade.",
      });
  }, [isAuthenticated]);
  return (
    <>
      <header className={`${styles.header} ${className || ""}`}>
        <div className={styles.container}>
          <div className={styles.left}>
            <span
              className={styles.logo}
              onClick={() => {
                router.push("/trading/dynamic-option-strategies");
              }}
            >
              {/* CSP issue workaround https://github.com/vercel/next.js/issues/61388 */}
              <Image
                src={Logo}
                width={40}
                height={40}
                className={styles.logoImage}
                style={{ color: undefined }}
                alt='Ithaca logo'
              />
              <IthacaLogoLabel className={styles.logoLabel} />
            </span>
            {!(desktopBreakpoint || tabletBreakpoint || mobileBreakpoint) && <Navigation />}
          </div>
          <div className={styles.right}>
            {contentAllowed && pathName.includes("/points/") && <EditProfileModal trigger={<UserProfileIcon />} />}
            <div
              className={styles.notificationContainer}
              title='Click to view cross-chain transactions'
              onClick={() => setIsTxnPanelOpen(!isTxnPanelOpen)}
              onKeyDown={() => setIsTxnPanelOpen(!isTxnPanelOpen)}
            >
              {!!crossChainTransactions.length && <span className={styles.badge}>{crossChainTransactions.length}</span>}
              <Bell />
            </div>
            <div>
              <SwitchWallet />
            </div>
            <Wallet />
            {(desktopBreakpoint || tabletBreakpoint || mobileBreakpoint) && (
              <Hamburger onClick={handleHamburgerClick} isActive={isHamburgerOpen} />
            )}
            {isRewardsOpen && <RewardsDropdown value={123} ref={rewardsDropdownRef} />}
          </div>
        </div>
      </header>
      {(desktopBreakpoint || tabletBreakpoint || mobileBreakpoint) && (
        <SlidingNav isActive={isHamburgerOpen} onClick={handleHamburgerClick} />
      )}
    </>
  );
};

export default Header;
