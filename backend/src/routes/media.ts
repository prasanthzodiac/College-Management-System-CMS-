import { Router } from 'express'
import { uploadBuffer } from '../services/cloudinary.js'

export const uploadRouter = Router()

uploadRouter.post('/upload', async (req, res) => {
	const { data, folder } = req.body as { data: string; folder?: string }
	if (!data) return res.status(400).json({ error: 'Missing data' })
	const base64 = data.split(',')[1] || data
	const buffer = Buffer.from(base64, 'base64')
	const result = await uploadBuffer(buffer, { folder: folder ?? 'cms' })
	return res.json({ url: result.secure_url, publicId: result.public_id })
})

