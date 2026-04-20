"use client"

import * as React from "react"

interface TableViewContextType {
  isCardView: boolean
  setIsCardView: (isCard: boolean) => void
}

const TableViewContext = React.createContext<TableViewContextType | undefined>(undefined)

export function TableViewProvider({ children }: { children: React.ReactNode }) {
  const [isCardView, setIsCardView] = React.useState(false)

  const value = React.useMemo(() => ({
    isCardView,
    setIsCardView
  }), [isCardView])

  return (
    <TableViewContext.Provider value={value}>
      {children}
    </TableViewContext.Provider>
  )
}

export function useTableIsCardContext() {
  const context = React.useContext(TableViewContext)
  if (context === undefined) {
    throw new Error("useTableIsCardContext must be used within a TableViewProvider")
  }
  return context
}