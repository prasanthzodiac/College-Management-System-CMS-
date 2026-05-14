import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface StaffSubjectAttributes {
  id: string
  staffId: string
  subjectId: string
}

export class StaffSubject extends Model<StaffSubjectAttributes> implements StaffSubjectAttributes {
  id!: string
  staffId!: string
  subjectId!: string
}

StaffSubject.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    staffId: { type: DataTypes.STRING, allowNull: false },
    subjectId: { type: DataTypes.STRING, allowNull: false }
  },
  { sequelize, modelName: 'StaffSubject', tableName: 'staff_subjects', timestamps: false }
)


