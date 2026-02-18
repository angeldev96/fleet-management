import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import IconButton from "@material-ui/core/IconButton";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";

const useStyles = makeStyles(() => ({
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    flexWrap: "wrap",
    gap: "16px",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#6b7280",
  },
  pageControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageNumbers: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  pageButton: {
    minWidth: "36px",
    height: "36px",
    padding: "0",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    border: "1px solid #E5E7EB",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      borderColor: "#D1D5DB",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  activePageButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    borderColor: "#3E4D6C",
    "&:hover": {
      backgroundColor: "#2E3B55",
      borderColor: "#2E3B55",
    },
  },
  navButton: {
    padding: "6px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "6px",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      borderColor: "#D1D5DB",
    },
    "&:disabled": {
      opacity: 0.5,
    },
  },
  pageSizeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageSizeLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  pageSizeSelect: {
    backgroundColor: "#FFFFFF",
    borderRadius: "6px",
    fontSize: "14px",
    "& .MuiSelect-select": {
      padding: "8px 32px 8px 12px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#E5E7EB",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#D1D5DB",
    },
  },
  ellipsis: {
    padding: "0 4px",
    color: "#9CA3AF",
  },
}));

export default function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  hasNextPage,
  hasPrevPage,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const classes = useStyles();

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate page numbers to display with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis-start");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis-end");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={classes.paginationContainer}>
      <div className={classes.pageInfo}>
        Showing {startItem} to {endItem} of {totalCount} items
      </div>

      <div className={classes.pageControls}>
        <IconButton
          className={classes.navButton}
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          size="small"
        >
          <ChevronLeft />
        </IconButton>

        <div className={classes.pageNumbers}>
          {getPageNumbers().map((pageNum) => {
            if (typeof pageNum === "string") {
              return (
                <span key={pageNum} className={classes.ellipsis}>
                  ...
                </span>
              );
            }
            return (
              <button
                key={pageNum}
                className={`${classes.pageButton} ${
                  pageNum === page ? classes.activePageButton : ""
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <IconButton
          className={classes.navButton}
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          size="small"
        >
          <ChevronRight />
        </IconButton>
      </div>

      <div className={classes.pageSizeContainer}>
        <span className={classes.pageSizeLabel}>Items per page:</span>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(e.target.value)}
          variant="outlined"
          className={classes.pageSizeSelect}
        >
          {pageSizeOptions.map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </Select>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  hasPrevPage: PropTypes.bool.isRequired,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
};
