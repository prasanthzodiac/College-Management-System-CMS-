import 'dotenv/config'
import express from 'express'
import cors from 'cors'

// Routes are imported after Sequelize is initialized in server.ts
export const createApp = (router: any) => {
	const app = express()
	app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }))
	app.use(express.json({ limit: '2mb' }))
	app.use('/api', router)
	app.get('/health', (_req, res) => res.json({ ok: true }))
	return app
}

