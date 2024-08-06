import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ToastContainer as ToastifyToastContainer } from "react-toastify";

const ToastContainer = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <></>;
  return createPortal(<ToastifyToastContainer icon={false} />, document.body);
};

export default ToastContainer;
