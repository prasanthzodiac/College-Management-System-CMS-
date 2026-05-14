import { Sequelize } from 'sequelize'

export let sequelize: Sequelize

export const initSequelize = async () => {
	const dbUrl = process.env.DATABASE_URL
	if (!dbUrl) throw new Error('Missing DATABASE_URL')

	// Parse URL to check if it's localhost
	const url = new URL(dbUrl.replace('mysql://', 'http://'))
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

