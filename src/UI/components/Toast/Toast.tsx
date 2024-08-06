import { ReactNode } from "react";

import { TypeOptions } from "react-toastify";

import { useRouter } from "next/router";
import InfoIcon from "@/assets/icons/info.svg";
import ErrorIcon from "@/assets/icons/error.svg";
import Button from "@/UI/components/Button/Button";
import SuccessIcon from "@/assets/icons/success.svg";
import LogoUsdc from "@/UI/components/Icons/LogoUsdc";

export interface ToastProps {
  title: string;
  message: ReactNode;
  type?: TypeOptions;
  netPrice?: number;
  viewOrder?: boolean;
}

export type BasicToastProps = Pick<ToastProps, "title" | "message">;

const Toast = ({ title, message, type = "success", viewOrder, netPrice }: ToastProps) => {
  const router = useRouter();

  const renderIcon = (type: string) => {
    switch (type) {
      case "success":
        return <SuccessIcon />;
      case "error":
        return <ErrorIcon />;
      case "info":
      default:
        return <InfoIcon />;
    }
  };

  return (
    <>
      <div className='tw-flex tw-space-x-2.5 tw-rounded-[16px] tw-bg-[rgba(18,23,34,.9)] tw-p-5'>
        <div>{renderIcon(type)}</div>
        <div className='tw-flex tw-flex-col tw-space-y-2.5 tw-text-white'>
          <span className='tw-font-lato tw-text-[18px] tw-font-semibold'>{title}</span>
          <span className='tw-font-lato tw-text-[16px]'>{message}</span>
          {netPrice !== undefined && (
            <div className='tw-flex tw-items-center tw-gap-1'>
              <div className={`mt-4 tw-text-xxs tw-text-ithaca-white-60`}>
                Net Premium To {netPrice < 0 ? "Receive" : "Pay"}
              </div>{" "}
              <div className='color-white fs-sm'>{netPrice < 0 ? netPrice * -1 : netPrice}</div> <LogoUsdc />{" "}
              <div className={`mt-4 tw-text-xxs tw-text-ithaca-white-60`}>USDC</div>
            </div>
          )}
          {viewOrder && (
            <div>
              <Button
                title='Click to View Live Order '
                size='sm'
                variant='secondary'
                onClick={() => router.push("/dashboard")}
              >
                View Live Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Toast;
