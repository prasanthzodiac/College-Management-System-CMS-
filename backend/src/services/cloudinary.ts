import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary with environment variables or defaults
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ddlexqc0g'
const apiKey = process.env.CLOUDINARY_API_KEY || '113492389368635'
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'hOPUq5KkOFxj9c4YxnCSQz0exHo'

if (cloudName && apiKey && apiSecret) {
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true
	})
} else {
	console.warn('Cloudinary credentials not fully configured. File uploads may fail.')
}

export const uploadBuffer = async (buffer: Buffer, options?: { folder?: string }) => {
	return await new Promise<any>((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream({ folder: options?.folder }, (err, result) => {
			if (err || !result) return reject(err)
			resolve(result)
		})
		stream.end(buffer)
	})
}

