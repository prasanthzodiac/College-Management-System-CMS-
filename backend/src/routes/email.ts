import { Router } from 'express'
import { sendEmail } from '../services/email.js'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'

export const emailRouter = Router()

emailRouter.post('/send', verifyFirebaseToken, async (req, res) => {
	const { to, subject, html } = req.body as { to: string; subject: string; html: string }
	setImmediate(async () => {
		try {
			await sendEmail({ to, subject, html })
		} catch (e) {
			// log error
		}
	})
	return res.json({ queued: true })
})

