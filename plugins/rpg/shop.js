let handler = async (m) => {
  let shopText = `
🛒 *PASAR & TOKO (SHOP)* 🛒
Gunakan perintah \`.buy <item> <jumlah>\` untuk membeli.
Gunakan perintah \`.sell <item> <jumlah>\` untuk menjual.

🟢 *BARANG YANG DIJUAL (BISA DIBELI):*
- 🧪 Potion : Rp 100
- ⛏️ Pickaxe : Rp 2.000 (Durability 100%)
- 🎣 Fishingrod: Rp 1.500 (Durability 100%)
- 🗡️ Sword : Rp 5.000 (Durability 100%)

🔴 *BARANG YANG DIBELI TOKO (BISA DIJUAL):*
*Hasil Tambang:*
- 🪨 Batu : Rp 20
- ⛓️ Besi : Rp 100
- 🪙 Emas : Rp 1.000
- 💎 Berlian : Rp 10.000

*Hasil Pancing:*
- 🐟 Lele : Rp 50
- 🐠 Nila : Rp 150
- 🎏 Koi : Rp 800
- 🦈 Hiu : Rp 5.000

*Hasil Buruan:*
- 🥩 Daging Monster : Rp 500
`.trim()

  m.reply(shopText)
}

handler.help = ['shop', 'toko', 'pasar']
handler.tags = ['rpg']
handler.command = /^(shop|toko|pasar)$/i

module.exports = handler
