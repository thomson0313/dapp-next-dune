import classNames from "classnames";

import { maskString } from "@/UI/utils/Text";
import { CloseButton } from "@headlessui/react";
import WalletIcon from "@/assets/icons/wallet.svg";
import LinkGreenIcon from "@/assets/icons/link-green.svg";
import WalletGreenIcon from "@/assets/icons/wallet-green.svg";

interface DelegatedWalletButtonProps {
  address: string;
  selectWallet: (address: string) => void;
  title: string;
  isSelected: boolean;
}

const DelegatedWalletButton = ({ address, selectWallet, title, isSelected }: DelegatedWalletButtonProps) => {
  return (
    <CloseButton
      onClick={() => selectWallet(address)}
      className={classNames(
        "tw-group tw-flex tw-flex-row tw-items-center tw-gap-2 tw-rounded-tl-lg tw-rounded-tr-lg tw-px-4 tw-py-3 tw-text-white hover:tw-text-ithaca-green-30",
        {
          "!tw-text-ithaca-green-30": isSelected,
        }
      )}
    >
      <WalletIcon
        className={classNames("group-hover:tw-hidden", {
          "tw-hidden": isSelected,
        })}
      />
      <WalletGreenIcon
        className={classNames("tw-hidden group-hover:tw-block", {
          "!tw-block": isSelected,
        })}
      />
      <span className='tw-ml-1 tw-text-sm tw-font-bold'>
        {title} <span className='tw-ml-2'>{maskString(address)}</span>
      </span>
      {isSelected && <LinkGreenIcon className='tw-ml-2' />}
    </CloseButton>
  );
};
export default DelegatedWalletButton;
