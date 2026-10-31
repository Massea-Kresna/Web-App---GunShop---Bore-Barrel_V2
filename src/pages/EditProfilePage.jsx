import { useState } from 'react'
import { Save, ArrowLeft, Camera, Check } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Error: Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => setAvatar(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    }
    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setFeedback('Profile successfully updated.')
      setTimeout(() => {
        setFeedback('')
        onBack() 
      }, 1000)
    } else {
      setFeedback('Failed to save profile.')
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
      </div>
      <div className="form-title-group">
        <h1 className="display">Edit Profile</h1>
        <p className="lede">Update your armorer credentials and details.</p>
      </div>

      {feedback && (
        <div className={`toast ${feedback.includes('Error') || feedback.includes('Failed') ? 'toast--error' : 'toast--success'}`}>
          <Check size={18} /> {feedback}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="entry-form">
        <div className="card-box" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div className="avatar-wrap" style={{ width: '80px', height: '80px', position: 'relative' }}>
            {avatar ? (
              <img src={avatar} alt="Avatar" className="avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#eee' }} />
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--ink)', color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}>
              <Camera size={14} />
              <input id="avatar-file-input" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div>
            <strong>Visual Identifier</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--steel)' }}>JPG, PNG max 2MB.</p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="prof-name" className="form-label">Callsign / Operator Alias</label>
          <input id="prof-name" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. Operator Delta" className="form-input" required />
        </div>
        <div className="form-group">
          <label htmlFor="prof-bio" className="form-label">Armory Notes / Station Bio</label>
          <textarea id="prof-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Qualifications, preferred calibers..." rows={4} className="form-textarea" />
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>Cancel</button>
          <button type="submit" className="btn btn--primary"><Save size={16} /> Save Changes</button>
        </div>
      </form>
    </div>
  )
}