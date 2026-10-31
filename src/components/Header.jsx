import { Plus } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useState, useEffect } from 'react'

// NAV_ITEMS sudah dibersihkan dari About dan Contact
const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true },
  { id: 'Cart', label: 'Cart', hasBadge: true },
  { id: 'Profile', label: 'Profile' }
]

export default function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.length)
    }
    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    const interval = setInterval(updateCartCount, 1500)
    return () => {
      window.removeEventListener('storage', updateCartCount)
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="header">
      <div className="header-brand-wrap" onClick={() => onTab('Catalog')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          let badgeValue = 0;
          if (item.id === 'Favorites') badgeValue = favCount;
          if (item.id === 'Cart') badgeValue = cartCount;

          return (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'nav-link active' : 'nav-link'}
              onClick={() => onTab(item.id)}
            >
              {item.label}
              {item.hasBadge && badgeValue > 0 && (
                <span className="nav-badge">{badgeValue}</span>
              )}
            </button>
          )
        })}
      </nav>
      {onNavigateCreate && (
        <button type="button" className="btn btn--primary btn--sm header-cta" onClick={onNavigateCreate} title="Register new hardware">
          <Plus size={15} /> Add Hardware
        </button>
      )}
    </header>
  )
}