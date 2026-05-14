import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
  await initSequelize()
  const { AttendanceSession } = await import('../models/Attendance.js')

  const sessions = await AttendanceSession.findAll({ attributes: ['date'], order: [['date', 'ASC']] })
  const grouped = sessions.reduce((acc: Record<string, number>, session: any) => {
    acc[session.date] = (acc[session.date] || 0) + 1
    return acc
  }, {})

  console.log(grouped)
  await sequelize.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


