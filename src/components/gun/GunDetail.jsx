import { useState, useEffect } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, ShoppingCart, ThumbsUp, ThumbsDown, Trash2, Edit2, X } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import reviewService from '../../services/reviewService'

export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // State untuk Reviews (Create & Read)
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // State untuk Edit Review (Update)
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // State untuk Thumbs Up / Thumbs Down (Persisten via Local Storage)
  const [likes, setLikes] = useState(() => JSON.parse(localStorage.getItem('review_likes') || '{}'))

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length
  const currentUser = getUserIdentifier()

  // 1. Fitur Share Link
  const handleShare = async () => {
    try {
      const baseUrl = window.location.origin + window.location.pathname
      const uniqueUrl = `${baseUrl}?gunId=${gun.id}`
      await navigator.clipboard.writeText(uniqueUrl)
      alert('Tautan halaman unik berhasil disalin ke clipboard!')
    } catch (err) {
      console.error('Gagal menyalin link:', err)
    }
  }

  // 2. Fitur Add to Cart
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push(gun)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
    alert(`${gun.name} berhasil ditambahkan ke keranjang!`)
  }

  // 3. CREATE Review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')
    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }
    const result = await createReview(gun.id, {
      user_identifier: currentUser,
      rating,
      comment: comment.trim(),
    })
    if (result) {
      setReviewSuccess('Review berhasil ditambahkan!')
      setComment('')
      setRating(5)
      refetchReviews()
      setTimeout(() => setReviewSuccess(''), 3000)
    } else {
      setReviewError('Gagal menambahkan ulasan. Server mungkin tidak tersedia.')
    }
  }

  // 4. UPDATE Review (Edit Mode)
  const handleEditClick = (review) => {
    setEditingReviewId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment || '')
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setEditRating(5)
    setEditComment('')
  }

  const handleUpdateReview = async (e, reviewId) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const result = await reviewService.updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim()
      })
      if (result.success || result.data) {
        setEditingReviewId(null)
        refetchReviews()
      } else {
        alert('Gagal memperbarui ulasan.')
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat mengedit ulasan.')
    } finally {
      setIsUpdating(false)
    }
  }

  // 5. DELETE Review
  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) {
       await reviewService.deleteReview(reviewId)
       refetchReviews()
    }
  }

  // 6. Fitur Thumbs Up / Down
  const handleLike = (reviewId, type) => {
    setLikes(prev => {
      // Ambil state like saat ini dari review terkait
      const current = prev[reviewId] || { up: 0, down: 0, userAction: null }
      let newUp = current.up
      let newDown = current.down
      let newUserAction = current.userAction

      if (type === 'up') {
        if (newUserAction === 'up') {
          newUp -= 1; newUserAction = null; // Batal Like
        } else {
          newUp += 1;
          if (newUserAction === 'down') newDown -= 1; // Pindah dari Dislike ke Like
          newUserAction = 'up';
        }
      } else if (type === 'down') {
        if (newUserAction === 'down') {
          newDown -= 1; newUserAction = null; // Batal Dislike
        } else {
          newDown += 1;
          if (newUserAction === 'up') newUp -= 1; // Pindah dari Like ke Dislike
          newUserAction = 'down';
        }
      }

      const newState = { ...prev, [reviewId]: { up: newUp, down: newDown, userAction: newUserAction } }
      localStorage.setItem('review_likes', JSON.stringify(newState)) // Simpan persisten
      return newState
    })
  }

  // Helper untuk mengecek apakah ulasan milik user saat ini
  const isOwnReview = (reviewUserId) => {
    return String(reviewUserId).includes(String(currentUser).substring(0,8))
  }

  return (
    <div className="detail">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>
      
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">{category}{caliber ? ` · ${caliber}` : ''}</p>
          <p className="price detail-price">{formatPrice(price)}</p>
          
          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}
          
          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            <button type="button" className="btn btn--outline" onClick={handleShare} title="Share Link">
              <Share2 size={16} />
            </button>
            <button type="button" className="btn btn--primary" onClick={handleAddToCart}>
              <ShoppingCart size={16} /> Add to Cart
            </button>
            
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>Edit</button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>Delete</button>
            )}
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}><strong>{ing.name}</strong> — {ing.quantity}</li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="detail-section">
        <h2>Reviews</h2>
        
        {/* Form Create Review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="star-btn" onClick={() => setRating(n)}>
                <Star size={22} fill={n <= rating ? 'var(--brass)' : 'none'} stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'} />
              </button>
            ))}
          </div>
          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <button type="submit" className="btn btn--primary" disabled={submitting || !gun.id}>
            {submitting ? <><Loader size={16} className="spin" /> Submitting…</> : <><Send size={16} /> Submit Review</>}
          </button>
          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* List Ulasan (Read, Update, Delete) */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <div>
                    <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                    <span className="review-stars-display" style={{ marginLeft: '10px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} fill={i < rev.rating ? 'var(--brass)' : 'none'} stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'} />
                      ))}
                    </span>
                  </div>
                  
                  {/* Action Buttons (Edit & Delete) Khusus untuk ulasan milik sendiri */}
                  {isOwnReview(rev.user_identifier) && editingReviewId !== rev.id && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" style={{ padding: '4px' }} onClick={() => handleEditClick(rev)} title="Edit Ulasan">
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" style={{ padding: '4px' }} onClick={() => handleDeleteReview(rev.id)} title="Hapus Ulasan">
                        <Trash2 size={14} color="#c0392b" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tampilan Edit Mode vs Normal Mode */}
                {editingReviewId === rev.id ? (
                  <form onSubmit={(e) => handleUpdateReview(e, rev.id)} className="review-form" style={{ marginTop: '10px', padding: '12px', background: '#fff', border: '1px solid var(--brass)' }}>
                    <div className="review-stars" style={{ marginBottom: '8px' }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" className="star-btn" onClick={() => setEditRating(n)}>
                          <Star size={18} fill={n <= editRating ? 'var(--brass)' : 'none'} stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="review-input"
                      rows="2"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      required
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button type="submit" className="btn btn--primary btn--sm" disabled={isUpdating}>
                        {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                      <button type="button" className="btn btn--outline btn--sm" onClick={handleCancelEdit} disabled={isUpdating}>
                        <X size={14} /> Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {rev.comment && <p className="review-comment">{rev.comment}</p>}
                    
                    {/* Interaksi Thumbs Up & Thumbs Down */}
                    <div className="review-interactions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button 
                        className="icon-btn" 
                        style={{ padding: '4px 8px', fontSize: '0.85rem', border: likes[rev.id]?.userAction === 'up' ? '1px solid var(--brass)' : '1px solid var(--line)', background: likes[rev.id]?.userAction === 'up' ? '#fdf8f2' : 'transparent', color: likes[rev.id]?.userAction === 'up' ? 'var(--brass)' : 'var(--steel)' }} 
                        onClick={() => handleLike(rev.id, 'up')}
                      >
                        <ThumbsUp size={14} fill={likes[rev.id]?.userAction === 'up' ? 'var(--brass)' : 'none'} /> 
                        <span style={{ marginLeft: '4px' }}>{likes[rev.id]?.up || 0}</span>
                      </button>
                      <button 
                        className="icon-btn" 
                        style={{ padding: '4px 8px', fontSize: '0.85rem', border: likes[rev.id]?.userAction === 'down' ? '1px solid #c0392b' : '1px solid var(--line)', background: likes[rev.id]?.userAction === 'down' ? '#feeceb' : 'transparent', color: likes[rev.id]?.userAction === 'down' ? '#c0392b' : 'var(--steel)' }} 
                        onClick={() => handleLike(rev.id, 'down')}
                      >
                        <ThumbsDown size={14} fill={likes[rev.id]?.userAction === 'down' ? '#c0392b' : 'none'} /> 
                        <span style={{ marginLeft: '4px' }}>{likes[rev.id]?.down || 0}</span>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}