// Packages
import React from "react";

// Lib
import { useAppStore } from "../lib/zustand/store";

// Layout
import Main from "@/UI/layouts/Main/Main";

// Components
import Loader from "@/UI/components/Loader/Loader";

const ReadyState: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isLoading, ithacaSDK } = useAppStore();
  const isReady = !isLoading && ithacaSDK;
  return isReady ? (
    children
  ) : (
    <Main>
      <Loader type='lg' />
    </Main>
  );
};

export default ReadyState;
