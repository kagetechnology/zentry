const { createCanvas, loadImage, registerFont } = require('canvas')
const path = require('path')
const fs   = require('fs')

/**
 * Generate welcome/goodbye card image
 *
 * @param {object} opts
 * @param {'welcome'|'goodbye'} opts.type    - Tipe kartu
 * @param {string} opts.username             - Nama member
 * @param {string} opts.groupName            - Nama grup
 * @param {string|null} [opts.bgImagePath]   - Path gambar background kustom (optional)
 * @returns {Promise<Buffer>}                - JPEG buffer siap kirim
 */
async function generateCard({ type = 'welcome', username, groupName, bgImagePath = null }) {
  const W = 900
  const H = 450

  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // ─── Background ─────────────────────────────────────────────
  if (bgImagePath && fs.existsSync(bgImagePath)) {
    // Pakai gambar kustom dari setimg
    try {
      const bg = await loadImage(bgImagePath)
      // Cover-fit: scale agar memenuhi canvas
      const scale = Math.max(W / bg.width, H / bg.height)
      const sw    = bg.width * scale
      const sh    = bg.height * scale
      const sx    = (W - sw) / 2
      const sy    = (H - sh) / 2
      ctx.drawImage(bg, sx, sy, sw, sh)
    } catch {
      drawDefaultBackground(ctx, W, H, type)
    }
  } else {
    drawDefaultBackground(ctx, W, H, type)
  }

  // ─── Dark overlay agar teks terbaca ──────────────────────────
  ctx.fillStyle = 'rgba(0, 0, 0, 0.52)'
  ctx.fillRect(0, 0, W, H)

  // ─── Accent bar kiri ─────────────────────────────────────────
  const accentColor = type === 'welcome' ? '#00c6ff' : '#ff6b6b'
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, 6, H)

  // ─── Garis dekorasi ──────────────────────────────────────────
  ctx.strokeStyle = accentColor
  ctx.lineWidth   = 1.5
  ctx.globalAlpha = 0.3
  ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(W - 40, 40); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(40, H - 40); ctx.lineTo(W - 40, H - 40); ctx.stroke()
  ctx.globalAlpha = 1

  // ─── Label WELCOME / GOODBYE ─────────────────────────────────
  const label = type === 'welcome' ? '✦  W E L C O M E  ✦' : '✦  G O O D B Y E  ✦'
  ctx.font      = 'bold 28px sans-serif'
  ctx.fillStyle = accentColor
  ctx.textAlign = 'center'
  ctx.fillText(label, W / 2, 85)

  // ─── Lingkaran avatar placeholder ───────────────────────────
  const cx = W / 2
  const cy = H / 2 - 10
  const r  = 72

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = accentColor
  ctx.lineWidth   = 3
  ctx.stroke()

  // Inisial nama di dalam lingkaran
  const initials = username
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')

  ctx.font      = `bold ${initials.length > 1 ? 48 : 56}px sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, cx, cy)
  ctx.textBaseline = 'alphabetic'

  // ─── Nama member ─────────────────────────────────────────────
  const displayName = username.length > 24 ? username.slice(0, 22) + '…' : username
  ctx.font      = 'bold 38px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(displayName, W / 2, cy + r + 46)

  // ─── Nama grup ───────────────────────────────────────────────
  const displayGroup = groupName.length > 32 ? groupName.slice(0, 30) + '…' : groupName
  ctx.font      = '22px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText(displayGroup, W / 2, cy + r + 82)

  // ─── Pesan bawah ─────────────────────────────────────────────
  const subMsg = type === 'welcome'
    ? 'Selamat datang di keluarga kami 🎉'
    : 'Terima kasih sudah bersama kami 🙏'

  ctx.font      = '18px sans-serif'
  ctx.fillStyle = accentColor
  ctx.fillText(subMsg, W / 2, H - 55)

  return canvas.toBuffer('image/jpeg', { quality: 0.92 })
}

/** Gambar background default dengan gradient */
function drawDefaultBackground(ctx, W, H, type) {
  const grad = ctx.createLinearGradient(0, 0, W, H)

  if (type === 'welcome') {
    grad.addColorStop(0,   '#0f0c29')
    grad.addColorStop(0.5, '#302b63')
    grad.addColorStop(1,   '#24243e')
  } else {
    grad.addColorStop(0,   '#1a0000')
    grad.addColorStop(0.5, '#3a0000')
    grad.addColorStop(1,   '#1a0000')
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Lingkaran dekorasi background
  ctx.globalAlpha = 0.07
  ctx.fillStyle   = type === 'welcome' ? '#00c6ff' : '#ff6b6b'
  ctx.beginPath(); ctx.arc(-50, -50, 200, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(W + 50, H + 50, 220, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
}

module.exports = { generateCard }
