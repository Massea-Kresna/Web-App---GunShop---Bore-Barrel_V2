import { useState, useEffect } from 'react'
import { ShoppingCart, ArrowRight, Trash2 } from 'lucide-react'
import { formatPrice } from '../utils/helpers'

export default function CartPage({ onNavigateCatalog }) {
  const [cart, setCart] = useState([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(stored)
  }, [])

  const removeFromCart = (index) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('storage')) // Memicu update badge header
  }

  const handleCheckout = () => {
    if (cart.length === 0) return alert('Keranjang belanja kosong.')
    
    const items = cart.map(item => `- ${item.name} (${item.caliber || item.type})`).join('%0A')
    const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    const message = `Hi, aku mau pesan hardware berikut:%0A%0A${items}%0A%0ATotal Estimasi: ${formatPrice(total)}%0AMohon info ketersediaannya. Terima kasih!`
    
    // Ganti nomor ini dengan nomor WhatsApp pribadimu. Format internasional tanpa tanda plus (misal: 628123456789)
    const waNumber = '6281234567890' 
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank')
    
    // Reset keranjang setelah pindah ke WA
    setCart([])
    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('storage'))
  }

  const totalCost = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  return (
    <div className="page">
      <section className="masthead">
        <h1 className="display">Procurement Cart</h1>
        <p className="lede">Review your selected hardware before confirming the order via direct link.</p>
      </section>

      {cart.length === 0 ? (
        <div className="state-box" style={{ marginTop: '24px' }}>
          <ShoppingCart size={42} stroke="var(--steel)" />
          <h3>Keranjang Kosong</h3>
          <p>Belum ada produk yang ditambahkan ke keranjang belanja Anda.</p>
          <button className="btn btn--primary" onClick={onNavigateCatalog} style={{ marginTop: '16px' }}>
            Browse Catalog <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="detail-section" style={{ marginTop: '24px' }}>
          <ul className="review-list">
            {cart.map((item, index) => (
              <li key={index} className="review-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src={item.image_url || item.image || '/guns/pistol.svg'} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }} />
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{item.name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>{item.caliber || item.type}</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--brass)' }}>{formatPrice(item.price)}</div>
                  </div>
                </div>
                <button className="btn btn--danger-ghost" onClick={() => removeFromCart(index)} title="Remove item">
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '2px dashed var(--line)' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--steel)' }}>Total Estimasi</span>
              <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{formatPrice(totalCost)}</h2>
            </div>
            <button className="btn btn--primary" onClick={handleCheckout}>
              Checkout via WhatsApp <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}