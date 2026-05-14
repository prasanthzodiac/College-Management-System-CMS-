import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { getCorsOriginConfig } from './config/corsOrigins.js'

// Routes are imported after Sequelize is initialized in server.ts
export const createApp = (router: any) => {
	const app = express()
	const corsOpts = getCorsOriginConfig()
	app.use(cors({ origin: corsOpts.origin, credentials: corsOpts.credentials }))
	app.use(express.json({ limit: '2mb' }))
	app.use('/api', router)
	app.get('/health', (_req, res) => res.json({ ok: true }))
	return app
}

