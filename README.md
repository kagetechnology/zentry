# Zentry WhatsApp Bot

Bot WhatsApp modular yang dikembangkan bersama, dibangun di atas [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).

## 📁 Struktur Direktori

```
Zentry/
├── src/
│   ├── commands/           ← Semua command bot
│   │   └── general/
│   │       └── ping.js
│   ├── handlers/           ← Handler event WhatsApp
│   │   └── messageHandler.js
│   ├── lib/                ← Utility / helper bersama
│   │   └── logger.js
│   └── core/               ← Koneksi & inisialisasi
│       └── client.js
├── sessions/               ← Session WA (auto-dibuat, di-gitignore)
├── index.js                ← Entry point
├── config.js               ← Konfigurasi global
└── package.json
```

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan bot
npm start

# 3. Scan QR code yang muncul di terminal dengan WhatsApp
```

## ➕ Cara Menambah Command Baru

Buat file baru di `src/commands/[kategori]/namacommand.js`:

```js
module.exports = {
  name: 'namacommand',
  description: 'Deskripsi command',
  category: 'general',
  usage: '{prefix}namacommand',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid
    await sock.sendMessage(jid, { text: 'Halo!' }, { quoted: msg })
  },
}
```

Command akan **otomatis terdaftar** saat bot restart. Tidak perlu edit file lain!

## ⚙️ Konfigurasi

Edit `config.js` untuk mengubah:
- `prefix` — Prefix command (default: `.`)
- `ownerNumber` — Nomor HP owner bot
- `sessionDir` — Lokasi penyimpanan session

## 📋 Daftar Command

| Command | Deskripsi |
|---------|-----------|
| `.ping` | Cek bot aktif & ukur latensi |

## 👥 Kontributor

- Developer 1
- Developer 2
