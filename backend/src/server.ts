import http from 'http'
import { Server } from 'socket.io'
import { createApp } from './app.js'
import { initSequelize, sequelize } from './database/index.js'

const basePort = Number(process.env.PORT || 8080)

export let io: Server

async function main() {
	// Initialize Sequelize first (this imports models)
	await initSequelize()
	// Sync database after models are loaded
	await sequelize.sync()
	// Import routes AFTER Sequelize is initialized
	const { router } = await import('./routes/index.js')
	// Create app after database is ready
	const app = createApp(router)
	const server = http.createServer(app)
	io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN?.split(',') || '*' } })

	io.on('connection', (socket) => {
		console.log('Client connected:', socket.id)
		
		socket.on('chat:message', (msg) => {
			io.emit('chat:message', msg)
		})

		// Join room for attendance updates
		socket.on('attendance:join', (data: { studentId?: string; subjectId?: string }) => {
			if (data.studentId) {
				socket.join(`student:${data.studentId}`)
			}
			if (data.subjectId) {
				socket.join(`subject:${data.subjectId}`)
			}
		})

		socket.on('disconnect', () => {
			console.log('Client disconnected:', socket.id)
		})
	})

  const listenWithRetry = async (startPort: number, attempts: number = 15): Promise<number> => {
    let currentPort = startPort
    for (let i = 0; i < attempts; i++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const onError = (err: any) => {
            server.off('listening', onListening)
		if (err && err.code === 'EADDRINUSE') {
              reject(err)
		} else {
              reject(err)
            }
          }
          const onListening = () => {
            server.off('error', onError)
            resolve()
          }
          server.once('error', onError)
          server.once('listening', onListening)
          server.listen(currentPort)
        })
        console.log(`API listening on :${currentPort}`)
        return currentPort
      } catch (err: any) {
        if (err?.code === 'EADDRINUSE') {
          currentPort += 1
          // Remove any previous listeners before retrying
          server.removeAllListeners('error')
          server.removeAllListeners('listening')
          continue
        }
        console.error('Server error during startup:', err)
        throw err
      }
    }
    throw new Error(`No free port found starting from ${startPort}`)
  }

  await listenWithRetry(basePort)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})

