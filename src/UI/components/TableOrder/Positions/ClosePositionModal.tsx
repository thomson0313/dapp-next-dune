import { useEffect, useMemo, useState } from "react";
import { calculateNetPrice, ClientConditionalOrder, createClientOrderId } from "@ithaca-finance/sdk";

import { SIDE } from "@/utils/types";
import useToast from "@/UI/hooks/useToast";
import Input from "@/UI/components/Input/Input";
import Modal from "@/UI/components/Modal/Modal";
import Button from "@/UI/components/Button/Button";
import { useAppStore } from "@/UI/lib/zustand/store";
import LogoUsdc from "@/UI/components/Icons/LogoUsdc";
import { usePrice } from "@/services/pricing/usePrice";
import { OrderSummaryType } from "@/types/orderSummary";
import { POSITIONS_DECIMAL_PLACES } from "@/UI/utils/constants";
import { AuctionSubmission } from "@/pages/trading/position-builder";
import SubmitButton from "@/UI/components/OrderSummary/SubmitButton";
import ConnectWalletButton from "@/UI/components/ConnectWalletButton";
import TableStrategy from "@/UI/components/TableStrategy/TableStrategy";
import OrderMoneySummary from "@/UI/components/SubmitModal/OrderMoneySummary";
import { formatNumberByFixedPlaces, getNumber, getNumberValue } from "@/UI/utils/Numbers";

import { PositionRow } from "../types";
interface ClosePositionModalProps {
  closePositionRow: PositionRow;
  closeModal: () => void;
}

const SUGGESTED_OPTIONS = ["25", "50", "100"];

const ClosePositionModal = ({ closePositionRow, closeModal }: ClosePositionModalProps) => {
  const [sellValue, setSellValue] = useState<string>("100");

  const [unitPrice, setUnitPrice] = useState("");
  const [orderSummary, setOrderSummary] = useState<OrderSummaryType | undefined>();
  const [auctionSubmission, setAuctionSubmission] = useState<AuctionSubmission | undefined>();

  const { showOrderErrorToast, showOrderConfirmationToast } = useToast();
  const { ithacaSDK, spotContract, getContractsByPayoff, currencyPrecision } = useAppStore();
  const isForward = closePositionRow.product === "Forward";

  const { unitPrice: unitRemotePrice, isLoading: isRemotePriceLoading } = usePrice({
    isForward: isForward,
    optionType: closePositionRow.product,
    expiryDate: closePositionRow.expiry,
    strike: isForward ? "-" : `${closePositionRow.strike}`,
    side: closePositionRow.quantity < 0 ? SIDE.SELL : SIDE.BUY,
  });

  useEffect(() => {
    setUnitPrice(unitRemotePrice);
  }, [unitRemotePrice]);

  const prepareOrder = async () => {
    if (!closePositionRow || !sellValue || !unitRemotePrice) return;
    const contractsList = getContractsByPayoff(closePositionRow.product);
    const finalSize = Math.abs(closePositionRow.quantity) * (getNumber(sellValue) / 100);

    const legs = [
      {
        contractId:
          closePositionRow.product === "NEXT_AUCTION"
            ? spotContract.contractId
            : contractsList[closePositionRow.strike].contractId,
        quantity: formatNumberByFixedPlaces(finalSize, POSITIONS_DECIMAL_PLACES, true) as `${number}`,
        side: closePositionRow.quantity < 0 ? SIDE.BUY : SIDE.SELL,
      },
    ];

    const totalNetPrice = calculateNetPrice(legs, [Number(unitPrice)], currencyPrecision.strike);
    const order = {
      clientOrderId: createClientOrderId(),
      totalNetPrice: totalNetPrice,
      legs,
    };

    try {
      const [orderLock, orderFees] = await Promise.all([
        ithacaSDK.calculation.estimateOrderLockPositioned(order),
        ithacaSDK.calculation.estimateOrderFees(order),
      ]);

      setOrderSummary({
        order,
        orderLock,
        orderFees,
      });
      setAuctionSubmission({
        order: order,
        type: "Position Builder",
      });
    } catch (error) {
      setOrderSummary({
        order,
        orderLock: null,
        orderFees: null,
      });
      console.error("Order estimation for position builder failed", error);
    }
  };

  useEffect(() => {
    prepareOrder();
  }, [closePositionRow, sellValue, unitPrice]);

  const strategiesFormatted = useMemo(() => {
    if (!orderSummary || !closePositionRow || !unitPrice) return [];
    return [
      {
        leg: orderSummary?.order.legs[0],
        referencePrice: Number(unitPrice),
        payoff: closePositionRow?.product,
        strike: `${closePositionRow?.strike}`,
      },
    ];
  }, [orderSummary, closePositionRow, unitPrice]);

  const submitOrder = () => {
    if (!auctionSubmission) return;
    submitToAuction(auctionSubmission.order, auctionSubmission.type);
  };

  const submitToAuction = async (order: ClientConditionalOrder, orderDescr: string) => {
    try {
      await ithacaSDK.orders.newOrder(order, orderDescr);
      showOrderConfirmationToast();
    } catch (error) {
      showOrderErrorToast();
    } finally {
      setAuctionSubmission(undefined);
      closeModal();
    }
  };

  return (
    <>
      <Modal title='Order Summary' isOpen={Boolean(closePositionRow)} onCloseModal={closeModal}>
        <div className=' tw-flex tw-flex-col tw-gap-2'>
          <div className='tw-flex tw-items-center tw-justify-between'>
            <p className='tw-font-semibold'>Close Order</p>
            <div className='tw-flex tw-items-center tw-gap-1'>
              {SUGGESTED_OPTIONS.map(option => (
                <Button
                  key={option}
                  onClick={() => setSellValue(option)}
                  className='!tw-h-[24px] !tw-w-[60px]'
                  title={`Click to select ${option}%`}
                  variant={sellValue === option ? "primary" : "outline"}
                >
                  {option}%
                </Button>
              ))}

              <Input
                max={100}
                min={1}
                value={sellValue}
                onChange={e => setSellValue(getNumberValue(e.target.value))}
                icon={<div>%</div>}
              />
            </div>
          </div>
          <div className='tw-flex tw-items-center tw-justify-between'>
            <p className='tw-font-semibold'>Unit Price</p>
            <div className='tw-flex tw-items-center tw-gap-1'>
              <Input
                isLoading={isRemotePriceLoading}
                type='number'
                width={200}
                value={unitPrice}
                icon={<LogoUsdc />}
                onChange={({ target }) => {
                  setUnitPrice(getNumberValue(target.value));
                }}
              />
            </div>
          </div>
          {strategiesFormatted.length ? (
            <div className='tw-mt-8'>
              <p className='tw-mb-4 tw-font-semibold'>Strategy</p>
              <TableStrategy tableClassName='!tw-min-h-fit' strategies={strategiesFormatted} hideClear={true} />
            </div>
          ) : (
            <></>
          )}
          <p className='tw-mb-4 tw-mt-8 tw-font-lato'>Please Confirm: Submit to Auction</p>
          <div className='tw-mb-4 tw-h-[1px] tw-bg-rgba-white-10' />
          <OrderMoneySummary auctionSubmission={auctionSubmission} orderSummary={orderSummary} />
          <ConnectWalletButton>
            {({ connected, openConnectModal }) => {
              return (
                <SubmitButton
                  isSubmitButtonDisabled={false}
                  onlyProtiftableOrders={false}
                  submitAuction={submitOrder}
                  openConnectModal={openConnectModal}
                  connected={connected}
                  orderSummary={orderSummary}
                />
              );
            }}
          </ConnectWalletButton>
        </div>
      </Modal>
    </>
  );
};

export default ClosePositionModal;
