import { Router } from 'express'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { uploadRouter } from './media.js'
import { authRouter } from './users.js'
import { emailRouter } from './email.js'
import { attendanceRouter } from './attendance.js'
import { certificateRouter } from './certificates.js'
import { subjectRouter } from './subjects.js'
import { leavesRouter } from './leaves.js'
import { grievancesRouter } from './grievances.js'
import { assignmentsRouter } from './assignments.js'
import { feedbackRouter } from './feedback.js'
import { eventsRouter } from './events.js'
import { circularsRouter } from './circulars.js'
import { internalMarksRouter } from './internalMarks.js'

export const router = Router()

router.use('/auth', authRouter)
router.use('/media', verifyFirebaseToken, uploadRouter)
router.use('/email', emailRouter)
router.use('/attendance', attendanceRouter)
router.use('/certificates', certificateRouter)
router.use('/subjects', subjectRouter)
router.use('/leaves', leavesRouter)
router.use('/grievances', grievancesRouter)
router.use('/assignments', assignmentsRouter)
router.use('/feedback', feedbackRouter)
router.use('/events', eventsRouter)
router.use('/circulars', circularsRouter)
router.use('/internal-marks', internalMarksRouter)

