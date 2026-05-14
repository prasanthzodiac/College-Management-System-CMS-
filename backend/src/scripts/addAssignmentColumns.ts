import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
	await initSequelize()
	
	console.log('Adding missing columns to assignment_submissions table...')
	
	try {
		// Add new columns if they don't exist
		await sequelize.query(`
			ALTER TABLE assignment_submissions 
			ADD COLUMN IF NOT EXISTS obtainedMark INT NULL,
			ADD COLUMN IF NOT EXISTS minMark INT NULL,
			ADD COLUMN IF NOT EXISTS maxMark INT NULL,
			ADD COLUMN IF NOT EXISTS remarks TEXT NULL,
			ADD COLUMN IF NOT EXISTS gradedAt DATETIME NULL,
			ADD COLUMN IF NOT EXISTS gradedBy VARCHAR(255) NULL
		`)
		
		console.log('✅ Successfully added columns to assignment_submissions table')
	} catch (error: any) {
		// If IF NOT EXISTS is not supported, try without it
		if (error.message.includes('IF NOT EXISTS')) {
			console.log('IF NOT EXISTS not supported, trying without it...')
			try {
				await sequelize.query(`
					ALTER TABLE assignment_submissions 
					ADD COLUMN obtainedMark INT NULL,
					ADD COLUMN minMark INT NULL,
					ADD COLUMN maxMark INT NULL,
					ADD COLUMN remarks TEXT NULL,
					ADD COLUMN gradedAt DATETIME NULL,
					ADD COLUMN gradedBy VARCHAR(255) NULL
				`)
				console.log('✅ Successfully added columns to assignment_submissions table')
			} catch (err2: any) {
				// Check if columns already exist
				if (err2.message.includes('Duplicate column name')) {
					console.log('⚠️  Some columns already exist. Checking which ones need to be added...')
					// Try adding them one by one
					const columns = [
						{ name: 'obtainedMark', type: 'INT NULL' },
						{ name: 'minMark', type: 'INT NULL' },
						{ name: 'maxMark', type: 'INT NULL' },
						{ name: 'remarks', type: 'TEXT NULL' },
						{ name: 'gradedAt', type: 'DATETIME NULL' },
						{ name: 'gradedBy', type: 'VARCHAR(255) NULL' }
					]
					
					for (const col of columns) {
						try {
							await sequelize.query(`ALTER TABLE assignment_submissions ADD COLUMN ${col.name} ${col.type}`)
							console.log(`✅ Added column: ${col.name}`)
						} catch (e: any) {
							if (e.message.includes('Duplicate column name')) {
								console.log(`⚠️  Column ${col.name} already exists`)
							} else {
								console.error(`❌ Error adding column ${col.name}:`, e.message)
							}
						}
					}
				} else {
					console.error('❌ Error adding columns:', err2.message)
					throw err2
				}
			}
		} else {
			console.error('❌ Error:', error.message)
			throw error
		}
	}
	
	// Also create assignments table if it doesn't exist
	console.log('\nChecking assignments table...')
	try {
		await sequelize.query(`
			CREATE TABLE IF NOT EXISTS assignments (
				id VARCHAR(255) PRIMARY KEY,
				subjectId VARCHAR(255) NOT NULL,
				subjectCode VARCHAR(255) NOT NULL,
				subjectName VARCHAR(255) NOT NULL,
				assignmentName VARCHAR(255) NOT NULL,
				description TEXT NULL,
				dueDate VARCHAR(255) NOT NULL,
				minMark INT NOT NULL DEFAULT 0,
				maxMark INT NOT NULL DEFAULT 100,
				createdBy VARCHAR(255) NOT NULL,
				createdAt DATETIME NOT NULL,
				updatedAt DATETIME NOT NULL
			)
		`)
		console.log('✅ Assignments table is ready')
	} catch (err: any) {
		if (err.message.includes('already exists')) {
			console.log('✅ Assignments table already exists')
		} else {
			console.error('❌ Error creating assignments table:', err.message)
		}
	}
	
	await sequelize.close()
	process.exit(0)
}

main().catch((err) => {
	console.error('Error:', err)
	process.exit(1)
})

