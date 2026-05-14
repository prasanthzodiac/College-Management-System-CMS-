import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface AssignmentAttributes {
  id: string
  subjectId: string
  subjectCode: string
  subjectName: string
  assignmentName: string
  description?: string | null
  dueDate: string // ISO date string
  minMark: number
  maxMark: number
  createdBy: string // staffId
  createdAt?: Date
  updatedAt?: Date
}

type AssignmentCreation = Optional<AssignmentAttributes, 'id' | 'description'>

export class Assignment extends Model<AssignmentAttributes, AssignmentCreation> implements AssignmentAttributes {
  id!: string
  subjectId!: string
  subjectCode!: string
  subjectName!: string
  assignmentName!: string
  description!: string | null
  dueDate!: string
  minMark!: number
  maxMark!: number
  createdBy!: string
  readonly createdAt!: Date
  readonly updatedAt!: Date
}

Assignment.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    subjectId: { type: DataTypes.STRING, allowNull: false },
    subjectCode: { type: DataTypes.STRING, allowNull: false },
    subjectName: { type: DataTypes.STRING, allowNull: false },
    assignmentName: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    dueDate: { type: DataTypes.STRING, allowNull: false },
    minMark: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    maxMark: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    createdBy: { type: DataTypes.STRING, allowNull: false }
  },
  { sequelize, modelName: 'Assignment', tableName: 'assignments' }
)

