const { dbGet, dbSet } = require('./functions')

/**
 * Inisialisasi struktur user RPG jika belum ada.
 */
function initRPG(userKey) {
  let user = dbGet(`users.${userKey}`) || {}
  
  if (typeof user.money !== 'number') user.money = 0
  if (typeof user.exp !== 'number') user.exp = 0
  if (typeof user.health !== 'number') user.health = 100
  if (typeof user.stamina !== 'number') user.stamina = 100
  
  if (!user.inventory) user.inventory = {}
  const items = ['potion', 'kayu', 'batu', 'besi', 'emas', 'berlian', 'lele', 'nila', 'koi', 'hiu', 'daging_monster']
  for (let item of items) {
    if (typeof user.inventory[item] !== 'number') user.inventory[item] = 0
  }
  
  if (!user.tools) user.tools = {}
  const tools = ['pickaxe', 'fishingrod', 'sword']
  for (let tool of tools) {
    if (typeof user.tools[tool] !== 'number') user.tools[tool] = 0 // 0 berarti tidak punya atau rusak
  }

  // Batasi max stat
  if (user.health > 100) user.health = 100
  if (user.stamina > 100) user.stamina = 100

  dbSet(`users.${userKey}`, user)
  return user
}

module.exports = { initRPG }
