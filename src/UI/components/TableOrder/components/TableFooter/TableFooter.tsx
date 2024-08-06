import DisconnectedWallet from "@/UI/components/DisconnectedWallet/DisconnectedWallet";
import Pagination from "@/UI/components/Pagination/Pagination";

import Flex from "@/UI/layouts/Flex/Flex";

import styles from "../../TableOrder.module.scss";

import Loader from "@/UI/components/Loader/Loader";
import Container from "@/UI/layouts/Container/Container";
import { PAGE_LIMIT } from "../../usePagination";

interface TableFooterProps {
  displayIsLoading: boolean;
  displayNoResults: boolean;
  isAuthenticated: boolean;
  totalItems: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
  description?: boolean;
}

export const TableFooter = (props: TableFooterProps) => {
  const { displayIsLoading, displayNoResults, isAuthenticated, totalItems, currentPage, handlePageChange } = props;
  return (
    <>
      {displayIsLoading && (
        <Container size='loader' className='ptb-150'>
          <Loader type='lg' />
        </Container>
      )}

      {displayNoResults && <p className={styles.emptyTable}>No results found</p>}

      {/* Connect wallet */}
      {!isAuthenticated && (
        <Container size='loader' className='ptb-150'>
          <DisconnectedWallet showButton={false} />
        </Container>
      )}

      {/* Footer and pagination */}
      <Flex direction='row-space-between' margin='mt-35'>
        <Pagination
          totalItems={totalItems}
          itemsPerPage={PAGE_LIMIT}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Flex>
    </>
  );
};
