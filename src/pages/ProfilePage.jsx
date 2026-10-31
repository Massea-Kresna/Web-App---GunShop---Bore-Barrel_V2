import { useState } from 'react'
import { Shield, Copy, Check, Heart, FileText, Play, Edit3, Trash2, ArchiveRestore } from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { getAllDraftIds, loadDraft, deleteDraft } from '../utils/draftStorage'

export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const { favorites } = useFavorites()
  
  const [drafts, setDrafts] = useState(() => getAllDraftIds().map(id => ({ id, ...loadDraft(id) })))
  const [archives, setArchives] = useState(() => JSON.parse(localStorage.getItem('archived_guns_detail') || '[]'))

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (id) => {
     deleteDraft(id)
     setDrafts(getAllDraftIds().map(dId => ({ id: dId, ...loadDraft(dId) })))
  }

  const handleRestore = (id) => {
    if (window.confirm('Pulihkan perangkat keras ini kembali ke katalog utama?')) {
      const newArchivesData = archives.filter(a => a.id !== id)
      setArchives(newArchivesData)
      localStorage.setItem('archived_guns_detail', JSON.stringify(newArchivesData))
      const newArchiveIds = JSON.parse(localStorage.getItem('archived_guns') || '[]').filter(aId => aId !== id)
      localStorage.setItem('archived_guns', JSON.stringify(newArchiveIds))
      alert('Hardware berhasil dipulihkan!')
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">Operator credentials, procurement statistics, and armorer details.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onReplaySplash && (
            <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}>
              <Play size={14} /> Replay Intro
            </button>
          )}
          <button type="button" className="btn btn--primary btn--sm" onClick={() => onNavigate('EditProfile')}>
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </section>

      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>
          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <p style={{ color: 'var(--steel)', margin: '0 0 10px 0' }}>{profile.bio || 'No bio provided.'}</p>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button type="button" className="icon-btn" onClick={handleCopyId}>
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
        </div>
      </div>

      <section className="detail-section" style={{ marginTop: '24px' }}>
        <h2>Offline Drafts History</h2>
        {drafts.length > 0 ? (
          <ul className="review-list">
            {drafts.map(d => (
              <li key={d.id} className="review-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{d.formData?.name || 'Unnamed Product Draft'}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
                    ID: {d.id} | Dibuat: {d.savedAt ? new Date(d.savedAt).toLocaleString() : 'Unknown'}
                  </div>
                </div>
                <button className="btn btn--danger-ghost" onClick={() => handleDeleteDraft(d.id)} title="Hapus Draft">
                  <Trash2 size={18}/>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="form-hint">Tidak ada data draft yang tersimpan di perangkat.</p>
        )}
      </section>

      <section className="detail-section" style={{ marginTop: '24px' }}>
        <h2>Archived Hardware</h2>
        <p style={{ color: 'var(--steel)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Hardware yang dihapus (soft delete) disimpan di sini. Anda dapat memulihkannya kembali ke katalog.
        </p>
        
        {archives.length > 0 ? (
          <ul className="review-list">
            {archives.map(item => (
              <li key={item.id} className="review-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img 
                    src={item.image_url || item.image || '/guns/pistol.svg'} 
                    alt={item.name} 
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }} 
                  />
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{item.name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
                      Diarsipkan pada: {item.archivedAt ? new Date(item.archivedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
                <button className="btn btn--outline btn--sm" onClick={() => handleRestore(item.id)} title="Restore ke Katalog">
                  <ArchiveRestore size={16} /> Restore
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="form-hint">Tidak ada hardware yang berada di dalam arsip saat ini.</p>
        )}
      </section>

      <section className="detail-section" style={{ marginTop: '24px' }}>
        <h2>About Bore & Barrel</h2>
        <p>A one-room armory. Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced from the bench — no markup theatre, no filler.</p>
      </section>

      <section className="detail-section" style={{ marginTop: '24px' }}>
        <h2>Contact & Headquarters</h2>
        <p><strong>Location:</strong> 123 Range Road, Sector 7.</p>
        <p><strong>Operational:</strong> Open Tuesday to Saturday, 10:00 AM to 18:00 PM.</p>
        <p><strong>Comms:</strong> (555) 010-0100</p>
      </section>
    </div>
  )
}