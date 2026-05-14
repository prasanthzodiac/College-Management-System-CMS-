import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface AssignmentSubmissionAttributes {
  id: string
  studentId: string
  subjectCode: string
  subjectName: string
  assignmentName: string
  staffName: string
  attachmentUrl: string
  submittedAt?: Date
  obtainedMark?: number | null
  minMark?: number | null
  maxMark?: number | null
  remarks?: string | null
  gradedAt?: Date | null
  gradedBy?: string | null
  createdAt?: Date
  updatedAt?: Date
}

type AssignmentSubmissionCreation = Optional<AssignmentSubmissionAttributes, 'id' | 'submittedAt' | 'obtainedMark' | 'minMark' | 'maxMark' | 'remarks' | 'gradedAt' | 'gradedBy'>

export class AssignmentSubmission extends Model<AssignmentSubmissionAttributes, AssignmentSubmissionCreation> implements AssignmentSubmissionAttributes {
  id!: string
  studentId!: string
  subjectCode!: string
  subjectName!: string
  assignmentName!: string
  staffName!: string
  attachmentUrl!: string
  submittedAt!: Date
  obtainedMark!: number | null
  minMark!: number | null
  maxMark!: number | null
  remarks!: string | null
  gradedAt!: Date | null
  gradedBy!: string | null
}

AssignmentSubmission.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    studentId: { type: DataTypes.STRING, allowNull: false },
    subjectCode: { type: DataTypes.STRING, allowNull: false },
    subjectName: { type: DataTypes.STRING, allowNull: false },
    assignmentName: { type: DataTypes.STRING, allowNull: false },
    staffName: { type: DataTypes.STRING, allowNull: false },
    attachmentUrl: { type: DataTypes.TEXT, allowNull: false },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    obtainedMark: { type: DataTypes.INTEGER, allowNull: true },
    minMark: { type: DataTypes.INTEGER, allowNull: true },
    maxMark: { type: DataTypes.INTEGER, allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    gradedAt: { type: DataTypes.DATE, allowNull: true },
    gradedBy: { type: DataTypes.STRING, allowNull: true }
  },
  { sequelize, modelName: 'AssignmentSubmission', tableName: 'assignment_submissions' }
)


