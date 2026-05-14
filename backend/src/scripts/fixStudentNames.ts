import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
  try {
    await initSequelize()
    const { User } = await import('../models/User.js')

    const names = [
      'Alice Johnson',
      'Bob Anderson',
      'Charlie Brown',
      'Diana Prince',
      'Ethan Hunt',
      'Fiona Apple',
      'George Washington',
      'Hannah Montana',
      'Ian Fleming',
      'Jessica Jones'
    ]

    for (let i = 1; i <= 10; i++) {
      const email = `student${i}@college.edu`
      const user = await User.findOne({ where: { email } })
      if (!user) continue
      const current = (user.name || '').toString().trim()
      const isNumeric = /^\d+$/.test(current)
      const shouldUpdate = !current || isNumeric || current.toLowerCase().startsWith('student ')
      if (shouldUpdate) {
        user.name = names[i - 1]
        await user.save()
        console.log(`Updated name for ${email} -> ${user.name}`)
      }
    }

    await sequelize.close()
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to fix names:', err?.message || err)
    process.exit(1)
  }
}

main()


