// Config-driven filter drawer: the canonical CustomFilterDrawer (left category menu, Clear all / Apply filter) with
// FilterContent on the right (search + multi-select). Each list passes `categories` [{ label, options: [{ value,
// label }] }]; the drawer hands back { [label]: [values] }. The wrapper follows compliance-lite's ListFilterDrawer
// (Sourav pointed at it on the species page, 31 Oct); the two parts it wraps are the Antz codebase's.
import { useCallback, useEffect, useState } from 'react'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'

const ListFilterDrawer = ({ open, onClose, onApply, setFilterCount, initialSelected, categories }) => {
  const menu = categories.map(c => c.label)
  const emptyState = () => Object.fromEntries(menu.map(m => [m, []]))
  const [selectedMenu, setSelectedMenu] = useState(menu[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState(emptyState)

  useEffect(() => {
    if (open) { setSelected({ ...emptyState(), ...(initialSelected || {}) }); if (!menu.includes(selectedMenu)) setSelectedMenu(menu[0]); setSearchQuery('') }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const optionsFor = label => {
    const pool = categories.find(c => c.label === label)?.options ?? []

    return searchQuery ? pool.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase())) : pool
  }
  const count = s => Object.values(s).reduce((a, c) => a + c.length, 0)
  const toggle = useCallback((value, label) => setSelected(prev => { const cur = prev[label] ?? []; return { ...prev, [label]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] } }), [])
  const selectAll = label => setSelected(prev => { const all = optionsFor(label).map(o => o.value); return { ...prev, [label]: (prev[label] ?? []).length === all.length ? [] : all } })
  const isAllSelected = label => { const all = optionsFor(label); return all.length > 0 && (selected[label] ?? []).length === all.length }
  const handleClearAll = () => { setSelected(emptyState()); setFilterCount(0) }
  const handleApply = () => { setFilterCount(count(selected)); onApply(selected) }
  const menuName = menu.includes(selectedMenu) ? selectedMenu : menu[0]

  return (
    <CustomFilterDrawer open={open} onClose={onClose} onApply={handleApply} onClearAll={handleClearAll} filterLists={menu} selectedOptions={selected} selectedItem={menuName} onSelectItem={m => { setSelectedMenu(m); setSearchQuery('') }}>
      <FilterContent menuName={menuName} searchQuery={searchQuery} onSearch={setSearchQuery} selectedOptions={selected[menuName] ?? []} onOptionChange={toggle} selectAllHandler={() => selectAll(menuName)} items={optionsFor(menuName)} isAllSelected={isAllSelected(menuName)} enableSelectAll searchLoading={false} placeholder={`Search ${menuName.toLowerCase()}...`} />
    </CustomFilterDrawer>
  )
}

export default ListFilterDrawer
