import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface SubjectAttributes {
    id: string
    code: string
    name: string
    section: string
    createdAt?: Date
    updatedAt?: Date
}

type SubjectCreation = Optional<SubjectAttributes, 'id'>

export class Subject extends Model<SubjectAttributes, SubjectCreation> implements SubjectAttributes {
    id!: string
    code!: string
    name!: string
    section!: string
    readonly createdAt!: Date
    readonly updatedAt!: Date
}

Subject.init(
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        code: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        section: { type: DataTypes.STRING, allowNull: false }
    },
    { sequelize, modelName: 'Subject', tableName: 'subjects' }
)


