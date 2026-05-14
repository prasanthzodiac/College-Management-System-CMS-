import mysql from 'mysql2/promise'

async function createDatabase() {
	try {
		// Connect without specifying database
		const connection = await mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '9080',
			port: 3306
		})

		// Create database
		await connection.query('CREATE DATABASE IF NOT EXISTS cms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
		console.log('✅ Database "cms_db" created successfully!')

		await connection.end()
		process.exit(0)
	} catch (error: any) {
		console.error('❌ Error creating database:', error.message)
		if (error.code === 'ECONNREFUSED') {
			console.error('\n💡 Make sure MySQL server is running!')
		} else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
			console.error('\n💡 Check your MySQL username and password!')
		}
		process.exit(1)
	}
}

createDatabase()

