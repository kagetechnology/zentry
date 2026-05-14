module.exports = {
  // ─── Bot Identity ───────────────────────────────────────────
  botName: 'Zentry',
  botVersion: '1.0.0',

  // ─── Prefix ─────────────────────────────────────────────────
  // Multi-prefix: Bot akan merespon jika pesan diawali salah satu simbol ini
  prefix: ['.', '!', '/', '#'],

  // ─── Owner ──────────────────────────────────────────────────
  // Format: '628xxxxxxxxxx' (tanpa +)
  ownerNumber: ['62881038727987'],

  // ─── API Keys ───────────────────────────────────────────────
  // Dapatkan API Key gratis dari https://openrouter.ai/
  openrouter: 'KODE_API_KEY_KAMU_DISINI',


  // ─── Settings ───────────────────────────────────────────────
  // Apakah bot aktif di grup?
  groupOnly: false,
  // Apakah bot aktif di private chat?
  privateOnly: false,

  // ─── Session ────────────────────────────────────────────────
  sessionDir: './sessions',
}
