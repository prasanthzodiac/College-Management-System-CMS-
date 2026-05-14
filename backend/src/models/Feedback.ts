import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface FeedbackAttributes {
  id: string
  studentId: string
  category: string
  subject: string
  message: string
  rating: number
  attachmentUrl?: string | null
  createdAt?: Date
  updatedAt?: Date
}

type FeedbackCreation = Optional<FeedbackAttributes, 'id' | 'attachmentUrl'>

export class Feedback extends Model<FeedbackAttributes, FeedbackCreation> implements FeedbackAttributes {
  id!: string
  studentId!: string
  category!: string
  subject!: string
  message!: string
  rating!: number
  attachmentUrl!: string | null
}

Feedback.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    studentId: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    attachmentUrl: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, modelName: 'Feedback', tableName: 'feedback' }
)


