import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import type {
  BaseGlaze,
  Blend,
  Corner,
  GridConfig,
  MeasurementConfig,
} from '../types'
import { blendFromUrl, syncBlendToUrl } from '../lib/share'
import { defaultBlend } from '../lib/blend'

type Action =
  | { type: 'rename'; name: string }
  | { type: 'update-base'; base: Partial<BaseGlaze> }
  | { type: 'update-grid'; grid: Partial<GridConfig> }
  | { type: 'update-measurement'; measurement: Partial<MeasurementConfig> }
  | { type: 'update-corner'; index: 0 | 1 | 2; corner: Partial<Corner> }
  | { type: 'reset' }

function reducer(blend: Blend, action: Action): Blend {
  switch (action.type) {
    case 'rename':
      return { ...blend, name: action.name }
    case 'update-base':
      return { ...blend, base: { ...blend.base, ...action.base } }
    case 'update-grid':
      return { ...blend, grid: { ...blend.grid, ...action.grid } }
    case 'update-measurement':
      return {
        ...blend,
        measurement: { ...blend.measurement, ...action.measurement },
      }
    case 'update-corner': {
      const corners = [...blend.corners] as Blend['corners']
      corners[action.index] = { ...corners[action.index], ...action.corner }
      return { ...blend, corners }
    }
    case 'reset':
      return defaultBlend()
  }
}

type Store = {
  blend: Blend
  dispatch: (action: Action) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [blend, dispatch] = useReducer(reducer, undefined, blendFromUrl)

  // Debounced URL sync: the address bar is the only persistence there is.
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => syncBlendToUrl(blend), 300)
    return () => window.clearTimeout(timer.current)
  }, [blend])

  const value = useMemo(() => ({ blend, dispatch }), [blend])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore outside provider')
  return store
}
