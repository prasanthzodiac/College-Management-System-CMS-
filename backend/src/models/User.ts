import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'

export interface UserAttributes {
	id: string
	email: string
	name: string | null
	photoUrl: string | null
	role: 'student' | 'staff' | 'admin'
	createdAt?: Date
	updatedAt?: Date
}

type UserCreation = Optional<UserAttributes, 'name' | 'photoUrl' | 'role'>

export class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
	id!: string
	email!: string
	name!: string | null
	photoUrl!: string | null
	role!: 'student' | 'staff' | 'admin'
	readonly createdAt!: Date
	readonly updatedAt!: Date
}

User.init(
	{
		id: { type: DataTypes.STRING, primaryKey: true },
		email: { type: DataTypes.STRING, allowNull: false, unique: true },
		name: { type: DataTypes.STRING, allowNull: true },
		photoUrl: { type: DataTypes.STRING, allowNull: true },
		role: { type: DataTypes.ENUM('student', 'staff', 'admin'), allowNull: false, defaultValue: 'student' }
	},
	{ sequelize, modelName: 'User', tableName: 'users' }
)

