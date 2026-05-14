import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface EnrollmentAttributes {
    id: string
    subjectId: string
    studentId: string
}

export class Enrollment extends Model<EnrollmentAttributes> implements EnrollmentAttributes {
    id!: string
    subjectId!: string
    studentId!: string
}

Enrollment.init(
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        subjectId: { type: DataTypes.STRING, allowNull: false },
        studentId: { type: DataTypes.STRING, allowNull: false }
    },
    { sequelize, modelName: 'Enrollment', tableName: 'enrollments', timestamps: false }
)


