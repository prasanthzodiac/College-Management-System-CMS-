import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface InternalMarkAttributes {
  id: string
  studentId: string
  subjectId: string
  assessmentName: string
  maxMark: number
  obtainedMark: number
  recordedAt: string
  createdBy: string
  remarks: string | null
  createdAt?: Date
  updatedAt?: Date
}

type InternalMarkCreation = Optional<InternalMarkAttributes, 'id' | 'remarks'>

export class InternalMark extends Model<InternalMarkAttributes, InternalMarkCreation> implements InternalMarkAttributes {
  id!: string
  studentId!: string
  subjectId!: string
  assessmentName!: string
  maxMark!: number
  obtainedMark!: number
  recordedAt!: string
  createdBy!: string
  remarks!: string | null
  readonly createdAt!: Date
  readonly updatedAt!: Date
}

InternalMark.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    studentId: { type: DataTypes.STRING, allowNull: false },
    subjectId: { type: DataTypes.STRING, allowNull: false },
    assessmentName: { type: DataTypes.STRING, allowNull: false },
    maxMark: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    obtainedMark: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    recordedAt: { type: DataTypes.DATEONLY, allowNull: false },
    createdBy: { type: DataTypes.STRING, allowNull: false },
    remarks: { type: DataTypes.TEXT, allowNull: true }
  },
  {
    sequelize,
    modelName: 'InternalMark',
    tableName: 'internal_marks'
  }
)


