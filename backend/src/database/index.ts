import { Sequelize } from 'sequelize'

export let sequelize: Sequelize

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

	// Create Sequelize instance first
	sequelize = new Sequelize(dbUrl.replace('?sslaccept=strict', ''), {
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

