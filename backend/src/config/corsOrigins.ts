/**
 * CORS for browser + Authorization header:
 * - `credentials: true` with `origin: '*'` is invalid in browsers; use credentials:false when allowing any origin.
 * - When CORS_ORIGIN is set, trim entries and strip trailing slashes so they match the `Origin` header.
 */
export function getCorsOriginConfig(): {
	origin: string | string[] | boolean
	credentials: boolean
} {
	const raw = process.env.CORS_ORIGIN?.split(',') ?? []
	const origins = raw.map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
	if (origins.length === 0) {
		return { origin: '*', credentials: false }
	}
	if (origins.length === 1) {
		return { origin: origins[0], credentials: true }
	}
	return { origin: origins, credentials: true }
}
