import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
  await initSequelize()
  const { User } = await import('../models/User.js')

  const updates: Array<{ email: string; role: 'student' | 'staff' | 'admin' }> = [
    { email: 'staff@college.edu', role: 'staff' },
    { email: 'admin@college.edu', role: 'admin' }
  ]

  for (const u of updates) {
    const user = await User.findOne({ where: { email: u.email } })
    if (user) {
      ;(user as any).role = u.role
      await (user as any).save()
      console.log(`Updated ${u.email} -> ${u.role}`)
    } else {
      // Create if missing (demo convenience)
      const { randomUUID } = await import('crypto')
      await User.create({ id: randomUUID(), email: u.email, name: u.email.split('@')[0], role: u.role })
      console.log(`Created ${u.email} as ${u.role}`)
    }
  }

  await sequelize.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


