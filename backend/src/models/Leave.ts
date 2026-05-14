import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface LeaveRequestAttributes {
  id: string
  studentId: string
  fromDate: string
  toDate: string | null
  session: 'FN' | 'AN' | 'Full Day'
  type: string
  reason: string | null
  halfday: boolean
  hourly: boolean
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: Date
  updatedAt?: Date
}

type LeaveRequestCreation = Optional<LeaveRequestAttributes, 'id' | 'toDate' | 'reason' | 'status'>

export class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreation> implements LeaveRequestAttributes {
  id!: string
  studentId!: string
  fromDate!: string
  toDate!: string | null
  session!: 'FN' | 'AN' | 'Full Day'
  type!: string
  reason!: string | null
  halfday!: boolean
  hourly!: boolean
  status!: 'pending' | 'approved' | 'rejected'
  readonly createdAt!: Date
  readonly updatedAt!: Date
}

LeaveRequest.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    studentId: { type: DataTypes.STRING, allowNull: false },
    fromDate: { type: DataTypes.STRING, allowNull: false },
    toDate: { type: DataTypes.STRING, allowNull: true },
    session: { type: DataTypes.ENUM('FN', 'AN', 'Full Day'), allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    halfday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hourly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' }
  },
  { sequelize, modelName: 'LeaveRequest', tableName: 'leave_requests' }
)


