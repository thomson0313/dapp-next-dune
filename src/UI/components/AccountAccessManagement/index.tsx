import { useCallback, useMemo, useState } from "react";
import { useAppStore } from "@/UI/lib/zustand/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import DelegateWalletModal from "./DelegateWalletModal";
import CreateApiKeyModal from "./ApiKeyModal";
import { accessManagementColumns } from "./tableDefinition";
import { TanstackTable } from "./Table";
import cn from "classnames";

import useToast from "@/UI/hooks/useToast";
import { SingleAccountManagementKey } from "@/types/accessManagement";
import { WALLET_SWITCH_LIST_KEY } from "@/UI/utils/constants";

const ApiKeyTable = () => {
  const queryClient = useQueryClient();
  const { ithacaSDK, isAuthenticated } = useAppStore();
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
  const [isDelegateModalVisible, setIsDelegateModalVisible] = useState(false);
  const { showToast } = useToast();

  const { data: publicApiKey, refetch: refetchKey } = useQuery({
    enabled: isAuthenticated,
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const result = await ithacaSDK.auth.getLinkedRsaKey();
      return result ?? null;
    },
    select: (singleApiKey): SingleAccountManagementKey | null => {
      if (!singleApiKey) return null;
      return {
        type: "API Key",
        address: singleApiKey,
      };
    },
  });

  const { data, refetch: refetchWalletList } = useQuery({
    enabled: isAuthenticated,
    queryKey: ["walletDelegated"],
    queryFn: () => ithacaSDK.wallets.list(),
    select: (data): SingleAccountManagementKey[] =>
      data.payload.map((walletAddress: string) => ({
        type: "Wallet Delegate",
        address: walletAddress,
      })),
  });

  const tableFinalData = useMemo(() => {
    const finalWallets = data ? [...data] : [];
    if (publicApiKey) {
      finalWallets.push(publicApiKey);
    }
    return finalWallets;
  }, [data, publicApiKey]);

  const handleDeleteKey = useCallback(async () => {
    try {
      await ithacaSDK.auth.unlinkRsaKey();
      refetchKey();
      showToast({
        title: "API Key revoked",
        message: "Successfully revoked API KEY",
      });
    } catch (error) {
      console.error("failed to unlink RSA key error", error);
    }
  }, [ithacaSDK.auth]);

  const handleRefetch = () => {
    refetchWalletList();
    queryClient.refetchQueries({
      queryKey: [WALLET_SWITCH_LIST_KEY],
      exact: false,
    });
  };

  const handleDeleteWallet = async (data: SingleAccountManagementKey) => {
    await ithacaSDK.wallets.unlink(data.address);
    handleRefetch();
  };

  const handleRevoke = async (data: SingleAccountManagementKey, regenerate?: boolean) => {
    if (data.type === "API Key") {
      await handleDeleteKey();
    } else {
      await handleDeleteWallet(data);
    }
  };

  const revokeAll = async () => {
    for await (const singleItem of tableFinalData) {
      await handleRevoke(singleItem);
    }
  };

  const tableColumns = useMemo(() => {
    return accessManagementColumns;
  }, []);

  const table = useReactTable({
    data: tableFinalData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      regenerateApiKey: () => setIsApiKeyModalVisible(true),
      delegateWallet: () => setIsDelegateModalVisible(true),
      handleRevoke: handleRevoke,
      revokeAll: revokeAll,
    },
  });

  const handleCloseApiKeyModal = useCallback(() => {
    refetchKey();
    setIsApiKeyModalVisible(false);
  }, [refetchKey]);

  const handleDelegateModalClose = () => {
    showToast({
      title: "Wallet access delegated",
      message: "Delegated sucessfuly",
    });
    setIsDelegateModalVisible(false);
    handleRefetch();
  };

  return (
    <>
      <CreateApiKeyModal
        handleRevoke={() => handleRevoke(publicApiKey!, true)}
        isOpen={isApiKeyModalVisible}
        onCloseModal={handleCloseApiKeyModal}
        apiPublicKey={publicApiKey?.address}
      />
      <DelegateWalletModal isOpen={isDelegateModalVisible} onCloseModal={() => handleDelegateModalClose()} />
      <div
        className={cn("tw-flex tw-min-h-[450px] tw-flex-col tw-overflow-x-auto", { "tw-opacity-10": !isAuthenticated })}
      >
        <TanstackTable table={table} />
        {tableFinalData.length === 0 && (
          <div className='tw-flex tw-flex-1 tw-items-center tw-justify-center'>
            <p className='tw-font-lato tw-font-medium'>No Delegate Accounts / API Key found.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ApiKeyTable;
