import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { Dashboard } from './routes/Dashboard'
import { AdminDashboard } from './routes/AdminDashboard'
import { StaffDashboard } from './routes/StaffDashboard'
import StaffSubjectCard from './features/staff/SubjectCard'
import StaffSubjectAttendance from './features/staff/Attendance'
import AssignmentPage from './features/staff/AssignmentPage'
import { AcademicRegulations, ClassTimeTable, ContinuousAssessment, CourseSubject, EventPage, HallBooking, LessonPlan, OpenElectiveCBCS, OutcomeBasedEducation, StudentAttendanceList, TutorWardSystem, AdmissionPage, CorePage, ExamPage, FeedbackPage, HumanResourcePage, ReportPage } from './features/staff/AcademicPages'
import { GrievancePage } from './features/staff/GrievancePage'
import { LeaveApproval } from './features/staff/LeaveApproval'
import { StaffCircularPage } from './features/staff/CircularPage'
import { InternalMarksPage as StaffInternalMarksPage } from './features/staff/InternalMarksPage'
import { StudentDashboard } from './routes/StudentDashboard'
import Grievances from './features/student/Grievances'
import CertificateRequest from './features/student/CertificateRequest'
import UploadAssignment from './features/student/UploadAssignment'
import ProgramOutcome from './features/student/ProgramOutcome'
import Attendance from './features/student/Attendance'
import Circular from './features/student/Circular'
import InternalMarkReport from './features/student/InternalMarkReport'
import Events from './features/student/Events'
import LeaveApply from './features/student/LeaveApply'
import HostelSoon from './features/student/HostelSoon'
import Feedback from './features/student/Feedback'
import FeePayment from './features/student/FeePayment'
import FeeDetails from './features/student/FeeDetails'
import { Login } from './routes/Login'
import { Protected } from './routes/Protected'
import { UserManagement } from './features/admin/UserManagement'
import { SubjectManagement } from './features/admin/SubjectManagement'
import { AttendanceOverview } from './features/admin/AttendanceOverview'
import { AssignmentOverview } from './features/admin/AssignmentOverview'
import { AdminFeedbackPage } from './features/admin/AdminFeedbackPage'
import { AdminGrievancePage } from './features/admin/AdminGrievancePage'
import { AdminLeavePage } from './features/admin/AdminLeavePage'
import { AdminCertificatePage } from './features/admin/AdminCertificatePage'
import { AdminEventsPage } from './features/admin/AdminEventsPage'
import { AdminCircularPage } from './features/admin/AdminCircularPage'
import { AdminInternalMarksPage } from './features/admin/InternalMarksPage'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		children: [
			{ index: true, element: <Login /> },
			{
				path: 'dashboard',
				element: (
					<Protected>
						<Dashboard />
					</Protected>
				),
				children: [
					{ index: true, element: <StudentDashboard /> },
                    { path: 'student', element: <StudentDashboard />,
                        children: [
                            { index: true, element: <div className="p-8 text-center"><h2 className="text-2xl font-semibold mb-4">Welcome to Student Dashboard</h2><p className="text-gray-600">Select an option from the menu above to get started.</p></div> },
                            { path: 'grievances', element: <Grievances /> },
                            { path: 'certificates', element: <CertificateRequest /> },
                            { path: 'academic/upload-assignment', element: <UploadAssignment /> },
                            { path: 'academic/program-outcome', element: <ProgramOutcome /> },
                            { path: 'academic/attendance', element: <Attendance /> },
                            { path: 'academic/circular', element: <Circular /> },
                            { path: 'academic/internal-marks', element: <InternalMarkReport /> },
                            { path: 'academic/events', element: <Events /> },
                            { path: 'academic/leave-apply', element: <LeaveApply /> },
                            { path: 'hostel', element: <HostelSoon /> },
                            { path: 'feedback', element: <Feedback /> },
                            { path: 'fee/payment', element: <FeePayment /> },
                            { path: 'fee/details', element: <FeeDetails /> }
                        ]
                    },
                    { path: 'staff', element: <StaffDashboard />, children: [
                        { path: 'academic/subject-card', element: <StaffSubjectCard /> },
                        { path: 'academic/subject-card/attendance', element: <StaffSubjectAttendance /> },
                        { path: 'academic/subject-card/assignment', element: <AssignmentPage /> },
                        { path: 'academic/regulations', element: <AcademicRegulations /> },
                        { path: 'academic/class-time-table', element: <ClassTimeTable /> },
                        { path: 'academic/continuous-assessment', element: <ContinuousAssessment /> },
                        { path: 'academic/course-subject', element: <CourseSubject /> },
                        { path: 'academic/event', element: <EventPage /> },
                        { path: 'academic/circular', element: <StaffCircularPage /> },
                        { path: 'academic/internal-marks', element: <StaffInternalMarksPage /> },
                        { path: 'academic/hall-booking', element: <HallBooking /> },
                        { path: 'academic/lesson-plan', element: <LessonPlan /> },
                        { path: 'academic/open-elective-cbcs', element: <OpenElectiveCBCS /> },
                        { path: 'academic/outcome-based-education', element: <OutcomeBasedEducation /> },
                        { path: 'academic/student-attendance', element: <StudentAttendanceList /> },
                        { path: 'academic/tutor-ward-system', element: <TutorWardSystem /> },
                        { path: 'academic/leave-approval', element: <LeaveApproval /> },
                        { path: 'grievance', element: <GrievancePage /> },
                        { path: 'admission', element: <AdmissionPage /> },
                        { path: 'core', element: <CorePage /> },
                        { path: 'exam', element: <ExamPage /> },
                        { path: 'feedback', element: <FeedbackPage /> },
                        { path: 'human-resource', element: <HumanResourcePage /> },
                        { path: 'report', element: <ReportPage /> }
                    ] },
					{ path: 'admin', element: <AdminDashboard />, children: [
						{ index: true, element: <div className="p-8 text-center"><h2 className="text-2xl font-semibold mb-4">Welcome to Admin Dashboard</h2><p className="text-gray-600">Select an option from the sidebar to get started.</p></div> },
						{ path: 'users/students', element: <UserManagement role="student" /> },
						{ path: 'users/staff', element: <UserManagement role="staff" /> },
						{ path: 'subjects', element: <SubjectManagement /> },
						{ path: 'attendance', element: <AttendanceOverview /> },
						{ path: 'assignments', element: <AssignmentOverview /> },
						{ path: 'feedback', element: <AdminFeedbackPage /> },
						{ path: 'grievances', element: <AdminGrievancePage /> },
						{ path: 'leaves', element: <AdminLeavePage /> },
						{ path: 'certificates', element: <AdminCertificatePage /> },
						{ path: 'events', element: <AdminEventsPage /> },
						{ path: 'circulars', element: <AdminCircularPage /> },
						{ path: 'internal-marks', element: <AdminInternalMarksPage /> }
					] }
				]
			}
		]
	}
])

