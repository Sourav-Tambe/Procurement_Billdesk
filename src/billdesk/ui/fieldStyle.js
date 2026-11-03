// One look for every form field on Procure screens (Sourav, 19 Oct): default outline in the Antz OutlineVariant
// colour, 1px, 8px corners. Hover, focus, error and selected keep their theme colours. Applied as sx on a wrapper,
// so shared Antz fields are not edited. Covers MUI outlined inputs and MUI X date pickers.
export const FIELD_SX = theme => ({
  '& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root, & .MuiPickersInputBase-root': { borderRadius: '8px' },
  '& .MuiOutlinedInput-root:not(:hover):not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root:not(:hover):not(.Mui-focused):not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline':
    { borderColor: theme.palette.customColors.OutlineVariant, borderWidth: '1px' },
  // the browser's autofill paints a blue tint and darker text; keep the field white and the text in the theme colour
  // (Sourav, 2 Nov)
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 100px #fff inset', WebkitTextFillColor: theme.palette.text.primary, caretColor: theme.palette.text.primary, transition: 'background-color 9999s'
  }
})
