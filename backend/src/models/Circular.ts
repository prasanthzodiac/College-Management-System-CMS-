import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface CircularAttributes {
  id: string
  circularNo: string | null
  title: string
  description: string | null
  department: string | null
  issuedDate: string
  attachmentUrl: string | null
  createdBy: string | null
  createdAt?: Date
  updatedAt?: Date
}

type CircularCreationAttributes = Optional<CircularAttributes, 'id' | 'circularNo' | 'description' | 'department' | 'attachmentUrl' | 'createdBy'>

export class Circular extends Model<CircularAttributes, CircularCreationAttributes> implements CircularAttributes {
  id!: string
  circularNo!: string | null
  title!: string
  description!: string | null
  department!: string | null
  issuedDate!: string
  attachmentUrl!: string | null
  createdBy!: string | null
  readonly createdAt!: Date
  readonly updatedAt!: Date
}

Circular.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    circularNo: { type: DataTypes.STRING, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    issuedDate: { type: DataTypes.DATEONLY, allowNull: false },
    attachmentUrl: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true }
  },
  {
    sequelize,
    modelName: 'Circular',
    tableName: 'circulars'
  }
)


