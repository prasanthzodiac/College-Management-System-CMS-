import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface GrievanceAttributes {
  id: string
  studentId: string
  category: string
  subCategory: string
  location: string | null
  placeName: string | null
  subject: string
  description: string
  fromDate: string | null
  toDate: string | null
  status: 'open' | 'closed'
  createdAt?: Date
  updatedAt?: Date
}

type GrievanceCreation = Optional<GrievanceAttributes, 'id' | 'location' | 'placeName' | 'fromDate' | 'toDate' | 'status'>

export class Grievance extends Model<GrievanceAttributes, GrievanceCreation> implements GrievanceAttributes {
  id!: string
  studentId!: string
  category!: string
  subCategory!: string
  location!: string | null
  placeName!: string | null
  subject!: string
  description!: string
  fromDate!: string | null
  toDate!: string | null
  status!: 'open' | 'closed'
  readonly createdAt!: Date
  readonly updatedAt!: Date
}

Grievance.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    studentId: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    subCategory: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: true },
    placeName: { type: DataTypes.STRING, allowNull: true },
    subject: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    fromDate: { type: DataTypes.STRING, allowNull: true },
    toDate: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' }
  },
  { sequelize, modelName: 'Grievance', tableName: 'grievances' }
)


