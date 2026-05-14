import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
  try {
    await initSequelize()
    const { User } = await import('../models/User.js')

    const names = [
      'Dr. John Doe',
      'Dr. Jane Smith',
      'Prof. Robert Johnson',
      'Dr. Sarah Williams',
      'Prof. Michael Brown'
    ]

    for (let i = 1; i <= 5; i++) {
      const email = `staff${i}@college.edu`
      const user = await User.findOne({ where: { email } })
      if (!user) continue
      const current = (user.name || '').toString().trim()
      const shouldUpdate = !current || current.toLowerCase().startsWith('staff ')
      if (shouldUpdate) {
        user.name = names[i - 1]
        await user.save()
        console.log(`Updated name for ${email} -> ${user.name}`)
      }
    }

    await sequelize.close()
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to fix staff names:', err?.message || err)
    process.exit(1)
  }
}

main()

