import Table from "@/UI/components/ForwardsTable/Table";

import { usePricingData } from "@/pages/pricing";
import styles from "./ForwardsTable.module.scss";

const ForwardsTable = () => {
  const { forwardsData } = usePricingData();

  return (
    <div className={styles.wrapper}>
      {forwardsData?.map((singleForwardInformation, index) => (
        <Table index={index} key={index} data={singleForwardInformation} />
      ))}
    </div>
  );
};

export default ForwardsTable;
