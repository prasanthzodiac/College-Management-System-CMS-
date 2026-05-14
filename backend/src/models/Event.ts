import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface EventAttributes {
  id: string
  title: string
  description: string | null
  department: string | null
  venue: string | null
  startDate: string
  endDate: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: string | null
  attachmentUrl: string | null
  createdBy: string | null
  createdAt?: Date
  updatedAt?: Date
}

type EventCreationAttributes = Optional<EventAttributes, 'id' | 'description' | 'department' | 'venue' | 'contactName' | 'contactEmail' | 'contactPhone' | 'status' | 'attachmentUrl' | 'createdBy'>

export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  id!: string
  title!: string
  description!: string | null
  department!: string | null
  venue!: string | null
  startDate!: string
  endDate!: string
  contactName!: string | null
  contactEmail!: string | null
  contactPhone!: string | null
  status!: string | null
  attachmentUrl!: string | null
  createdBy!: string | null
  readonly createdAt!: Date
  readonly updatedAt!: Date
}

Event.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    venue: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    contactName: { type: DataTypes.STRING, allowNull: true },
    contactEmail: { type: DataTypes.STRING, allowNull: true },
    contactPhone: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
    attachmentUrl: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true }
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events'
  }
)


