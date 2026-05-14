import 'dotenv/config'

type Row = { name: string; ok: boolean; required: 'yes' | 'recommended' | 'optional'; where: string }

function hasFirebaseAdmin(): boolean {
	if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== 'demo') return true
	return Boolean(
		process.env.FIREBASE_PROJECT_ID?.trim() &&
			process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
			process.env.FIREBASE_PRIVATE_KEY?.trim()
	)
}

const rows: Row[] = [
	{
		name: 'DATABASE_URL',
		ok: Boolean(process.env.DATABASE_URL?.trim()?.startsWith('mysql://')),
		required: 'yes',
		where: 'Render or backend/.env — paste full Aiven Service URI (mysql://...)',
	},
	{
		name: 'CORS_ORIGIN',
		ok: Boolean(process.env.CORS_ORIGIN?.trim()),
		required: 'recommended',
		where: 'Render — Vercel URL(s), comma-separated, no spaces after commas',
	},
	{
		name: 'FIREBASE_SERVICE_ACCOUNT or (PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY)',
		ok: hasFirebaseAdmin(),
		required: 'recommended',
		where: 'Render — match Vercel VITE_FIREBASE_* project',
	},
	{
		name: 'NODE_ENV',
		ok: Boolean(process.env.NODE_ENV),
		required: 'optional',
		where: 'Render: production',
	},
	{
		name: 'SENDGRID_API_KEY / EMAIL_FROM',
		ok: Boolean(process.env.SENDGRID_API_KEY?.trim()),
		required: 'optional',
		where: 'Render — email features',
	},
	{
		name: 'CLOUDINARY_*',
		ok: Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()),
		required: 'optional',
		where: 'Render — uploads (defaults exist in code)',
	},
]

console.log('\nBackend environment check (from process.env / backend/.env)\n')
console.log('Variable'.padEnd(52), 'OK?', 'Level', 'Where to set')
console.log('-'.repeat(100))
for (const r of rows) {
	console.log(r.name.padEnd(52), r.ok ? 'yes' : 'NO', r.required.padEnd(12), r.where)
}

const missingRequired = rows.filter((r) => r.required === 'yes' && !r.ok)
const missingRec = rows.filter((r) => r.required === 'recommended' && !r.ok)

if (missingRequired.length) {
	console.log('\nMissing required:', missingRequired.map((r) => r.name).join(', '))
	process.exit(1)
}
if (missingRec.length) {
	console.log('\nMissing recommended (fix before production):', missingRec.map((r) => r.name).join(', '))
}

const missingOpt = rows.filter((r) => r.required === 'optional' && !r.ok)
if (missingOpt.length && !missingRequired.length) {
	console.log('\nUnset optional:', missingOpt.map((r) => r.name).join(', '))
}

if (!missingRequired.length && !missingRec.length) {
	console.log('\nAll required and recommended variables are set.\n')
}
process.exit(missingRequired.length ? 1 : 0)
