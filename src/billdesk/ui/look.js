// Strict Antz type on Setup screens (Sourav, 19 Oct): the shared Antz parts come in off the ladder, so they're
// corrected here, never in the shared files. AddButtonContained is 15px uppercase → NewButton (14/600, sentence
// case); grid headers are 12/500 → 12/600 (uppercase caption); drawer footer buttons are uppercase → sentence case.
import { Button, GlobalStyles } from '@mui/material'
import Icon from 'src/@core/components/icon'

export const NewButton = ({ title, onClick }) => (
  <Button variant='contained' startIcon={<Icon icon='mdi:plus' fontSize={20} />} onClick={onClick} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 14, height: 42, px: 5, whiteSpace: 'nowrap' }}>
    {title}
  </Button>
)

export const TABLE_SX = { '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 } }

// mounted while a Setup screen is open; drawers render in a portal, so this is global for that time
export const DrawerLook = () => <GlobalStyles styles={{ '.MuiDrawer-paper .MuiButton-root': { textTransform: 'none', fontWeight: 600, fontSize: 14 } }} />
