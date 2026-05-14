import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
	service: 'SendGrid',
	auth: {
		user: 'apikey',
		pass: process.env.SENDGRID_API_KEY
	}
})

export async function sendEmail(opts: { to: string; subject: string; html: string; from?: string }) {
	const from = opts.from || process.env.EMAIL_FROM || 'no-reply@example.com'
	await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html })
}

