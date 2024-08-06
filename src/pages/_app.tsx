// Packages
import { useEffect, useRef, useState } from "react";
import App, { AppContext, AppInitialProps, AppProps } from "next/app";
import { RainbowKitProvider, darkTheme, cssStringFromTheme } from "@rainbow-me/rainbowkit";
import classNames from "classnames";
import { WagmiProvider } from "wagmi";
// Constants
import { LATO, ROBOTO } from "@/UI/constants/fonts";

// Utils
import { appInfo, wagmiConfig } from "@/UI/utils/RainbowKit";
import mixPanel from "@/services/mixpanel";

// Lib
import { useAppStore } from "@/UI/lib/zustand/store";
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

// Layouts
import Header from "@/UI/layouts/Header/Header";
import ReadyState from "@/UI/utils/ReadyState";

// Hooks
import useToast from "@/UI/hooks/useToast";

// Components
import Footer from "@/UI/layouts/Footer/Footer";
import Avatar from "@/UI/components/Icons/Avatar";
import CrossChainStatusPanel from "@/UI/components/CollateralPanel/CrossChainStatusPanel";
import { useSearchParams } from "next/navigation";
import Plug from "@/UI/components/Plug/Plug";

// Styles
import "@rainbow-me/rainbowkit/styles.css";
import "@/UI/stylesheets/vendor/_prism-onedark.scss";
import "@/UI/stylesheets/_global.scss";
import AppWrapper from "@/UI/layouts/AppWrapper/AppWrapper";
import { OnboardingProvider } from "@/UI/providers/onboarding-provider";
import { TypeOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getActiveChain } from "@/UI/utils/RainbowKitHelpers";
import ToastContainer from "@/UI/components/Toast/ToastContainer";
import DataProvider from "@/UI/providers/data-provider";

const STATUS_MAP: Record<string, TypeOptions> = {
  NEW: "success",
  FILLED: "success",
  REJECTED: "error",
  CANCEL_REJECTED: "info",
};

const TITLE_MAP: Record<string, string> = {
  NEW: "Order Placed",
  FILLED: "Order Executed",
  REJECTED: "Order Rejected",
  CANCEL_REJECTED: "Order Cancelled",
  CANCELLED_BY_USER: "Order Cancelled",
};

const MESSAGE_MAP: Record<string, string> = {
  NEW: "We have received your order",
  FILLED: "Position details will be updated shortly",
  REJECTED: "Order Rejected, please try again",
  CANCEL_REJECTED: "We have received your request",
  CANCELLED_BY_USER: "Order Cancelled",
};

type Props = { nonce?: string };

const queryClient = new QueryClient();

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

const Ithaca = ({ Component, pageProps, nonce, router }: AppProps & Props) => {
  const { showToast } = useToast();
  const { newToast } = useAppStore();
  const searchParams = useSearchParams();
  const [isTxnPanelOpen, setIsTxnPanelOpen] = useState<boolean>(false);
  const [contentAllowed, setContentAllowed] = useState<boolean>(true);

  useEffect(() => {
    const ALLOWED = process.env.NEXT_PUBLIC_POINTS_ALLOWED;
    if (router.asPath.includes("/points/") && ALLOWED === "false") {
      const allowed = searchParams.get("allowed");
      setContentAllowed(allowed !== null);
    }
  }, [searchParams, router, router.asPath]);

  useEffect(() => {
    if (newToast) {
      showToast({
        title: TITLE_MAP[newToast.orderStatus],
        message: newToast.ordRejReason || MESSAGE_MAP[newToast.orderStatus],
        type: STATUS_MAP[newToast.orderStatus],
        netPrice: newToast.netPrice,
        viewOrder: newToast.orderStatus === "NEW" || newToast.orderStatus === "FILLED",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newToast]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          dehydrateOptions: {
            shouldDehydrateQuery: query => {
              return Boolean(query?.meta?.persist && query?.state?.status === "success" && query.state.data);
            },
          },
        }}
      >
        <RainbowKitProvider
          initialChain={getActiveChain()}
          theme={null}
          modalSize='compact'
          appInfo={appInfo}
          avatar={() => (
            <div className='customUsetAvatar'>
              <Avatar />
            </div>
          )}
        >
          <style
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
            :root {
              ${cssStringFromTheme(
                darkTheme({
                  accentColor: "rgba(94, 225, 146, 0.60)",
                  accentColorForeground: "white",
                  borderRadius: "large",
                  overlayBlur: "small",
                })
              )}
            }
          `,
            }}
          />
          <AppWrapper
            className={classNames(LATO.className, ROBOTO.className, LATO.variable, ROBOTO.variable, "tw-text-white")}
          >
            <OnboardingProvider>
              <ToastContainer />
              <DataProvider />
              <Header isTxnPanelOpen={isTxnPanelOpen} setIsTxnPanelOpen={setIsTxnPanelOpen} />
              <ReadyState>{contentAllowed ? <Component {...pageProps} /> : <Plug />}</ReadyState>
              <CrossChainStatusPanel isTxnPanelOpen={isTxnPanelOpen} setIsTxnPanelOpen={setIsTxnPanelOpen} />
              <Footer />
            </OnboardingProvider>
          </AppWrapper>
        </RainbowKitProvider>
      </PersistQueryClientProvider>
    </WagmiProvider>
  );
};

function MyApp({ Component, pageProps, router, nonce }: AppProps & Props) {
  const { initIthacaProtocol, ithacaSDK, isAuthenticated, isMaintenanceEnabled, isLoading } = useAppStore();
  const nonceRef = useRef(nonce);
  const [pageLoadTime, setPageLoadTime] = useState<number>(Date.now());

  useEffect(() => {
    const handleRouteChange = () => {
      setPageLoadTime(Date.now());
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    if (isAuthenticated) {
      // POINTS_EVENTS: Page view - service connected
      mixPanel.track("Page view", {
        path: router.pathname,
      });

      const handleUnload = () => {
        const timeSpent = Date.now() - pageLoadTime;
        // POINTS_EVENTS: Page view time - service connected
        mixPanel.track("Page view time", {
          path: router.pathname,
          spentTime: timeSpent,
        });
      };

      router.events.on("routeChangeComplete", handleUnload);

      return () => {
        router.events.off("routeChangeComplete", handleUnload);
      };
    }
  }, [isAuthenticated, pageLoadTime]);

  useEffect(() => {
    if (nonce) {
      nonceRef.current = nonce;
    }
  }, [nonce]);

  useEffect(() => {
    initIthacaProtocol();
  }, [initIthacaProtocol]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isLoading) {
        ithacaSDK.auth.heartbeat();
      }
    }, 20_000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated, isLoading]);

  if (isMaintenanceEnabled) {
    return (
      <AppWrapper>
        <Plug />
      </AppWrapper>
    );
  }

  return <Ithaca Component={Component} pageProps={pageProps} nonce={nonceRef.current} router={router} />;
}

MyApp.getInitialProps = async (Context: AppContext): Promise<Props & AppInitialProps> => {
  const props = await App.getInitialProps(Context);
  const { ctx } = Context;
  const nonce = ctx.req?.headers?.["x-nonce"] as string | undefined;

  return {
    ...props,
    nonce,
  };
};

export default MyApp;
