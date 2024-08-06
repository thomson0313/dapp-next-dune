import { toast, ToastOptions } from "react-toastify";
import Toast, { BasicToastProps, ToastProps } from "../components/Toast/Toast";
import Close from "@/UI/components/Icons/Close";

const AUTO_CLOSE_TOAST_DURATION = 5000;

const useToast = () => {
  const showOrderConfirmationToast = () => {
    showToast({
      title: "Transaction Confirmed",
      message: "Order received & submitted into the auction",
    });
  };

  const showOrderErrorToast = () => {
    showToast({
      title: "Failed to Send Order",
      message: "Failed to Send Order, please try again.",
      type: "error",
    });
  };

  const showErrorToast = ({ title, message }: BasicToastProps) => {
    showToast({
      title: title,
      message: message,
      type: "error",
    });
  };

  const showToast = (props: ToastProps, options?: ToastOptions) => {
    const { type } = props;

    toast(<Toast {...props} />, {
      position: "bottom-right",
      autoClose: AUTO_CLOSE_TOAST_DURATION,
      type,
      closeButton: ({ closeToast }) => (
        <button className='tw-absolute tw-right-[20px] tw-top-[20px]' onClick={closeToast}>
          <Close />
        </button>
      ),
      ...options,
    });
  };

  const dismissAllToasts = () => toast.dismiss();

  return {
    showToast,
    showErrorToast,
    dismissAllToasts,
    showOrderConfirmationToast,
    showOrderErrorToast,
  };
};

export default useToast;
