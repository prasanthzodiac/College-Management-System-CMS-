import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface AttendanceSessionAttributes {
    id: string
    subjectId: string
    date: string // ISO date
    period: string
    createdAt?: Date
    updatedAt?: Date
}

type AttendanceSessionCreation = Optional<AttendanceSessionAttributes, 'id'>

export class AttendanceSession extends Model<AttendanceSessionAttributes, AttendanceSessionCreation> implements AttendanceSessionAttributes {
    id!: string
    subjectId!: string
    date!: string
    period!: string
    readonly createdAt!: Date
    readonly updatedAt!: Date
}

AttendanceSession.init(
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        subjectId: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        period: { type: DataTypes.STRING, allowNull: false }
    },
    { sequelize, modelName: 'AttendanceSession', tableName: 'attendance_sessions' }
)

export interface AttendanceEntryAttributes {
    id: string
    sessionId: string
    studentId: string
    present: boolean
    createdAt?: Date
    updatedAt?: Date
}

type AttendanceEntryCreation = Optional<AttendanceEntryAttributes, 'id'>

export class AttendanceEntry extends Model<AttendanceEntryAttributes, AttendanceEntryCreation> implements AttendanceEntryAttributes {
    id!: string
    sessionId!: string
    studentId!: string
    present!: boolean
    readonly createdAt!: Date
    readonly updatedAt!: Date
}

AttendanceEntry.init(
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        sessionId: { type: DataTypes.STRING, allowNull: false },
        studentId: { type: DataTypes.STRING, allowNull: false },
        present: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    { sequelize, modelName: 'AttendanceEntry', tableName: 'attendance_entries' }
)


