import { io as socketIO } from 'socket.io-client'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080'

export const socket = socketIO(API_BASE_URL, {
	autoConnect: true,
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionAttempts: 5
})

socket.on('connect', () => {
	console.log('Connected to server:', socket.id)
})

socket.on('disconnect', () => {
	console.log('Disconnected from server')
})

export default socket

