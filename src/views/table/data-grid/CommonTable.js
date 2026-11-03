/* eslint-disable lines-around-comment */
import { useMemo, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@emotion/react'

/**
 * Ensures the last visible column stretches to fill remaining space,
 * preventing an empty filler column from appearing at the end.
 */
const applyFlexToLastColumn = columns => {
  if (!columns || columns.length === 0) return columns

  // Check if any column already has flex set
  const hasFlexColumn = columns.some(col => col.flex)
  if (hasFlexColumn) return columns

  // Apply flex: 1 and minWidth to the last column
  const lastIndex = columns.length - 1

  return columns.map((col, index) => {
    if (index === lastIndex) {
      return { ...col, flex: 1, minWidth: col.width || col.minWidth || 100 }
    }

    return col
  })
}

const CommonTable = ({
  onRowClick,
  indexedRows,
  total,
  columns,
  paginationModel,
  handleSortModel,
  setPaginationModel,
  pageSizeOptions,
  loading,
  hideFooterPagination = false,
  searchValue,
  onCellClick,
  columnVisibilityModel,
  checkBoxOption,
  onRowSelectionModelChange,
  selectedRows,
  disablePagination = false, // New prop to control pagination
  maxHeight,
  rowHeight = 52,
  externalTableStyle,
  getRowHeight,
  handleSearch,
  hideFooter = false,
  getRowClassName, // New prop for conditional row styling
  getRowId,
  // Bill Desk lite additions (not in the Antz copy): which rows may be ticked, and the empty-table text
  isRowSelectable,
  noRowsLabel
}) => {
  const theme = useTheme()

  /**
   * selectionModel — Adapts consumer's selectedRows array to DataGrid v8 format.
   *
   * DataGrid v8 expects: { type: 'include' | 'exclude', ids: Set<GridRowId> }
   * Consumers pass:      plain array of IDs [1, 2, 3] or row objects [{ id: 1, ... }]
   *
   * This converts the consumer array → v8 format so checkboxes render correctly.
   */
  const selectionModel = useMemo(() => {
    if (!Array?.isArray(selectedRows) || selectedRows?.length === 0) {
      return { type: 'include', ids: new Set() }
    }
    const ids = selectedRows?.map(row => (typeof row === 'object' && row !== null ? row?.id : row))
    return { type: 'include', ids: new Set(ids) }
  }, [selectedRows])

  /**
   * handleSelectionChange — Converts DataGrid v8 selection callback back to a plain ID array.
   *
   * DataGrid v8 fires this with: { type: 'include' | 'exclude', ids: Set<GridRowId> }
   *   - type 'include': only the IDs in the Set are selected (normal click)
   *   - type 'exclude': ALL visible rows are selected EXCEPT the IDs in the Set (header "Select All")
   *
   * This converts it back to a plain array of IDs [1, 2, 3] and passes it
   * to the consumer's onRowSelectionModelChange callback.
   */
  const handleSelectionChange = useCallback(
    newModel => {
      if (!onRowSelectionModelChange) return

      let selectedIds = []

      if (newModel?.type === 'exclude') {
        // "Select All" was clicked — all visible rows selected, minus any unchecked ones
        const excludedIds = newModel?.ids || new Set()
        selectedIds = (indexedRows || []).map(row => row.id)?.filter(id => !excludedIds?.has(id))
      } else {
        // Normal selection — only the checked row IDs
        selectedIds = newModel?.ids ? Array?.from(newModel?.ids) : []
      }

      onRowSelectionModelChange(selectedIds)
    },
    [onRowSelectionModelChange, indexedRows]
  )

  // Base styles object
  const baseStyles = {
    '--DataGrid-cellFocusOutline': 'none',
    mt: 5,
    '.MuiDataGrid-cell:focus': {
      outline: 'none'
    },
    '.MuiDataGrid-cell:focus-within': {
      outline: 'none'
    },

    // Header styling - MUI X v8
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: theme.palette.customColors.customTableHeaderBg,
      color: theme.palette.customColors.customHeadingTextColor,
      minHeight: '56px !important',
      maxHeight: '56px !important'
    },
    '& .MuiDataGrid-columnHeader': {
      backgroundColor: theme.palette.customColors.customTableHeaderBg,
      color: theme.palette.customColors.customHeadingTextColor,
      display: 'flex',
      alignItems: 'center'
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      color: theme.palette.customColors.customHeadingTextColor,
      fontWeight: 500,
      lineHeight: 'normal'
    },
    '& .MuiDataGrid-columnHeaderTitleContainer': {
      display: 'flex',
      alignItems: 'center'
    },
    '& .MuiDataGrid-filler': {
      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
    },
    '& .MuiDataGrid-scrollbarFiller': {
      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
    },
    '& .MuiDataGrid-filler--pinnedColumns': {
      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
    },
    '& .MuiDataGrid-scrollbarFiller--header': {
      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
    },
    '& .MuiDataGrid-cellEmpty': {
      display: 'none !important'
    },

    // Cell alignment - vertically center content
    '& .MuiDataGrid-cell': {
      display: 'flex',
      alignItems: 'center',
      lineHeight: 'normal'
    },
    '& .MuiDataGrid-columnHeader--alignCenter .MuiDataGrid-columnHeaderDraggableContainer': {
      justifyContent: 'center'
    },
    '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderDraggableContainer': {
      justifyContent: 'flex-end'
    },

    // Column menu icon button styling
    '& .MuiDataGrid-menuIcon': {
      visibility: 'visible',
      width: 'auto'
    },
    '& .MuiDataGrid-iconButtonContainer': {
      visibility: 'visible',
      width: 'auto'
    },
    '& .MuiDataGrid-menuIconButton': {
      backgroundColor: 'transparent',
      color: theme.palette.customColors.customHeadingTextColor,
      '&:hover': {
        backgroundColor: theme.palette.action.hover
      }
    },
    '& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer .MuiIconButton-root': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent'
      }
    },

    '& .MuiDataGrid-row:hover': {
      cursor: 'pointer'
    },
    '.MuiDataGrid-virtualScroller': {
      ...(maxHeight && { maxHeight: maxHeight, overflowY: 'auto !important' })
    },
    '.MuiDataGrid-main': {
      // margin: '2px',
      borderLeft: '1px solid #0000000D',
      borderRight: '1px solid #0000000D',

      // borderBottom: '1px solid #0000000D',
      borderRadius: '8px', // Ensure the right border extends to last row
      // Apply margin to the main container
      // borderRadius: '8px', // Apply border-radius to the main container
      border: '1px solid rgba(233, 233, 236, 1)' // Apply border to the main container
    },
    '& .MuiDataGrid-footerContainer': {
      borderTop: 'none' // Remove the border-top from footer container
    },
    '& .MuiDataGrid-row:last-of-type .MuiDataGrid-cell': {
      borderBottom: 'none' // Make sure no extra bottom border is applie
    },
    '.MuiDataGrid-columnHeader .MuiDataGrid-sortButton': {
      backgroundColor: 'transparent !important'
    }
  }

  // Function to deep merge styles
  const mergeStyles = (base, external) => {
    if (!external) return base

    const merged = { ...base }

    Object.keys(external).forEach(key => {
      // If the key exists in base and both are objects, merge them
      if (key in base && typeof base[key] === 'object' && typeof external[key] === 'object') {
        merged[key] = { ...base[key], ...external[key] }
      } else {
        // Otherwise, override with external value
        merged[key] = external[key]
      }
    })

    return merged
  }

  // Merge base styles with external styles
  const mergedStyles = mergeStyles(baseStyles, externalTableStyle)

  return (
    <DataGrid
      sx={mergedStyles}
      columnVisibilityModel={columnVisibilityModel ? columnVisibilityModel : {}}
      hideFooterSelectedRowCount
      disableColumnSelector={true}
      autoHeight
      // pagination
      pagination={!disablePagination}
      rows={indexedRows === undefined ? [] : indexedRows}
      // rowCount={total}
      rowCount={disablePagination ? undefined : total}
      columns={applyFlexToLastColumn(columns)}
      sortingMode='server'
      rowHeight={rowHeight}
      hideFooterPagination={hideFooterPagination}
      hideFooter={hideFooter}
      // paginationMode='server'
      // pageSizeOptions={[7, 10, 25, 50]}
      paginationMode={disablePagination ? undefined : 'server'}
      pageSizeOptions={
        pageSizeOptions && pageSizeOptions.length > 0
          ? pageSizeOptions
          : disablePagination
          ? [total || 10]
          : [7, 10, 25, 50, 100]
      }
      localeText={{
        noRowsLabel: noRowsLabel || 'No rows',
        noResultsOverlayLabel: noRowsLabel || 'No rows' // 👈 override the "No results found" case
      }}
      onCellClick={onCellClick ? onCellClick : null}
      // paginationModel={paginationModel}
      paginationModel={disablePagination ? undefined : paginationModel || { page: 0, pageSize: 50 }}
      onSortModelChange={handleSortModel}
      // onPaginationModelChange={setPaginationModel}
      onPaginationModelChange={disablePagination ? undefined : setPaginationModel}
      loading={loading ? loading : null}
      disableColumnMenu
      slotProps={{
        baseButton: {
          variant: 'outlined'
        },
        toolbar: {
          value: searchValue,
          clearSearch: () => handleSearch(''),
          onChange: event => handleSearch(event.target.value)
        }
      }}
      onRowClick={onRowClick ? onRowClick : null}
      checkboxSelection={checkBoxOption ? true : false}
      {...(checkBoxOption && {
        onRowSelectionModelChange: handleSelectionChange,
        rowSelectionModel: selectionModel,
        keepNonExistentRowsSelected: true
      })}
      getRowHeight={getRowHeight ? getRowHeight : null}
      getRowClassName={getRowClassName ? getRowClassName : undefined}
      {...(getRowId && { getRowId })}
      {...(isRowSelectable && { isRowSelectable })}
    />
  )
}

export default CommonTable
