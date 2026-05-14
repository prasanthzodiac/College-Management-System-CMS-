import { Sequelize } from 'sequelize'

export let sequelize: Sequelize

/** Strip params some hosts add (e.g. Aiven `ssl-mode=REQUIRED`); SSL still enabled via dialectOptions. */
function normalizeMysqlUrlForSequelize(mysqlUrl: string): string {
	let out = mysqlUrl.trim()
	out = out.replace(/\?sslaccept=strict/gi, '').replace(/&sslaccept=strict/gi, '')
	out = out.replace(/\?ssl-mode=[^&]*/gi, '')
	out = out.replace(/&ssl-mode=[^&]*/gi, '')
	out = out.replace(/\?+$/, '')
	return out
}

export const initSequelize = async () => {
	const dbUrl = process.env.DATABASE_URL?.trim()
	if (!dbUrl) throw new Error('Missing DATABASE_URL')

	// Must be a full connection URI (Render/MySQL hosts often give mysql://user:pass@host/db)
	if (!/^mysql:\/\//i.test(dbUrl)) {
		throw new Error(
			'DATABASE_URL must be a full MySQL URI starting with mysql:// (e.g. mysql://user:password@hostname:3306/dbname). ' +
				'Do not use the raw database id, password only, or a host name without the mysql:// scheme—copy the full "Internal" or "External" database URL from your provider.'
		)
	}

	let url: URL
	try {
		url = new URL(dbUrl.replace(/^mysql:\/\//i, 'http://'))
	} catch {
		throw new Error(
			'DATABASE_URL is not a valid URL. If the password has special characters (@, :, #, etc.), URL-encode them in the connection string (e.g. @ → %40).'
		)
	}
	const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'

	const h = url.hostname.toLowerCase()
	const placeholderHosts = new Set([
		'host',
		'hostname',
		'example.com',
		'your-db-host.onrender.com',
		'replace_real_hostname',
	])
	if (!h || placeholderHosts.has(h)) {
		throw new Error(
			`DATABASE_URL hostname is invalid or still a placeholder ("${url.hostname}"). ` +
				'Use the real hostname from your MySQL provider (Render: open your **MySQL** service → copy **Internal Database URL** or **External Database URL** — do not leave template text like @HOST: or @your-db-host.onrender.com without replacing it).'
		)
	}

	const connectUrl = normalizeMysqlUrlForSequelize(dbUrl)

	// Create Sequelize instance first
	sequelize = new Sequelize(connectUrl, {
		dialect: 'mysql',
		dialectModule: undefined,
		dialectOptions: isLocalhost ? {} : {
			ssl: {
				rejectUnauthorized: false
			}
		},
		logging: false
	})

	// Import models after sequelize is created
	await import('./models.js')

	await sequelize.authenticate()
	// Note: sync() is called separately to allow for custom sync options
}

