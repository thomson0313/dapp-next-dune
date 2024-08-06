import { useAppStore } from "@/UI/lib/zustand/store";
import SwitchGreenIcon from "@/assets/icons/switch-green.svg";
import SwitchIcon from "@/assets/icons/switch.svg";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import classNames from "classnames";
import { AvailableWallets } from "./AvailableWallets";

export const SwitchWallet = () => {
  const { isAuthenticated, delegatedWalletAddress } = useAppStore();

  if (!isAuthenticated) return null;

  return (
    <div>
      <Popover className='tw-relative '>
        <PopoverButton className='tw-group tw-mr-2 tw-flex tw-items-center tw-justify-center tw-outline-none'>
          {delegatedWalletAddress ? (
            <SwitchGreenIcon />
          ) : (
            <>
              <SwitchIcon className={classNames("group-hover:tw-hidden")} />
              <SwitchGreenIcon className={classNames("tw-hidden group-hover:tw-block")} />
            </>
          )}
        </PopoverButton>
        <PopoverPanel
          anchor='bottom'
          className='tw-shadow-panel tw-z-10 tw-mt-5 tw-box-border tw-flex tw-flex-col tw-rounded-lg tw-bg-black-dark tw-backdrop-blur-[100px] focus:tw-ring-0'
        >
          <AvailableWallets />
        </PopoverPanel>
      </Popover>
    </div>
  );
};
