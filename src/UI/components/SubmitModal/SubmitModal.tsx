// Packages
import { AuctionSubmission, PositionBuilderStrategy } from "@/pages/trading/position-builder";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";
import TableStrategy from "../TableStrategy/TableStrategy";

// Styles
import styles from "./SubmitModal.module.scss";
import { OrderSummaryType } from "@/types/orderSummary";
import OrderMoneySummary from "./OrderMoneySummary";

type SubmitModalProps = {
  isOpen: boolean;
  submitOrder: (auctionSubmission: AuctionSubmission) => void;
  auctionSubmission?: AuctionSubmission;
  closeModal: (close: boolean) => void;
  positionBuilderStrategies: PositionBuilderStrategy[];
  orderSummary?: OrderSummaryType;
};

const SubmitModal = ({
  isOpen,
  submitOrder,
  auctionSubmission,
  closeModal,
  positionBuilderStrategies,
  orderSummary,
}: SubmitModalProps) => {
  return (
    <Modal title='Submit to Auction' isOpen={isOpen} hideFooter={true} onCloseModal={() => closeModal(false)}>
      <>
        {!!positionBuilderStrategies.length && (
          <TableStrategy strategies={positionBuilderStrategies} hideClear={true} />
        )}
        {!!positionBuilderStrategies.length && (
          <Button
            className={`${styles.confirmButton}`}
            onClick={() => {
              if (!auctionSubmission) return;
              submitOrder(auctionSubmission);
            }}
            title='Click to confirm'
          >
            Confirm
          </Button>
        )}
        <OrderMoneySummary auctionSubmission={auctionSubmission} orderSummary={orderSummary} />
        {!positionBuilderStrategies.length && (
          <Button
            className={`${styles.confirmButton}`}
            onClick={() => {
              if (!auctionSubmission) return;
              submitOrder(auctionSubmission);
            }}
            title='Click to confirm'
          >
            Confirm
          </Button>
        )}
      </>
    </Modal>
  );
};

export default SubmitModal;
