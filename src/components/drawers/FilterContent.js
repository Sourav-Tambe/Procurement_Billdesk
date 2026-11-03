// Copied as is from the Antz compliance-v2 codebase (antz-reference/compliance-v2, 2 Nov): the filter drawer's right pane.
import React from 'react'
import { Box, Checkbox, Typography, Divider, CircularProgress } from '@mui/material'
import Search from 'src/views/utility/Search'
import ImageWithShimmer from '../utility/ImageWithShimmer'
import { useTheme } from '@mui/material/styles'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const FilterContent = ({
  menuName,
  searchQuery,
  onSearch,
  selectedOptions,
  onOptionChange,
  selectAllHandler,
  items,
  isAllSelected,
  enableSelectAll = false,
  searchLoading,
  placeholder = `Search ${menuName.toLowerCase()}...`
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Search
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          onClear={() => onSearch('')}
        />
      </Box>
      {searchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {enableSelectAll && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={selectedOptions?.length > 0 && !isAllSelected}
                  onChange={selectAllHandler}
                />
                <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>Select All</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </>
          )}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
            {items?.map(item => (
              <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={selectedOptions?.includes(item.value)}
                  onChange={() => onOptionChange(item.value, menuName)}
                />
                {/* {item.image && <ImageWithShimmer src={item.image} alt={item.label} />} */}

                <SpeciesCard
                  species={{
                    common_name: item?.label,
                    scientific_name: item?.scientific_name,
                    default_icon: item?.default_icon
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default FilterContent
