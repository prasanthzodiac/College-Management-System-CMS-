import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/index.js'
import { User } from './User.js'

export interface CertificateRequestAttributes {
	id: string
	studentId: string
	certificateType: string
	purpose: string
	status: 'pending' | 'approved' | 'rejected' | 'completed'
	remarks?: string | null
	processedBy?: string | null
	processedAt?: Date | null
	createdAt?: Date
	updatedAt?: Date
}

type CertificateRequestCreation = Optional<CertificateRequestAttributes, 'id' | 'status' | 'remarks' | 'processedBy' | 'processedAt'>

export class CertificateRequest extends Model<CertificateRequestAttributes, CertificateRequestCreation> implements CertificateRequestAttributes {
	id!: string
	studentId!: string
	certificateType!: string
	purpose!: string
	status!: 'pending' | 'approved' | 'rejected' | 'completed'
	remarks!: string | null
	processedBy!: string | null
	processedAt!: Date | null
	readonly createdAt!: Date
	readonly updatedAt!: Date
}

CertificateRequest.init(
	{
		id: { type: DataTypes.STRING, primaryKey: true },
		studentId: { type: DataTypes.STRING, allowNull: false, references: { model: 'users', key: 'id' } },
		certificateType: { type: DataTypes.STRING, allowNull: false },
		purpose: { type: DataTypes.TEXT, allowNull: false },
		status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'), allowNull: false, defaultValue: 'pending' },
		remarks: { type: DataTypes.TEXT, allowNull: true },
		processedBy: { type: DataTypes.STRING, allowNull: true, references: { model: 'users', key: 'id' } },
		processedAt: { type: DataTypes.DATE, allowNull: true }
	},
	{ sequelize, modelName: 'CertificateRequest', tableName: 'certificate_requests' }
)

// Define associations
CertificateRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' })
CertificateRequest.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' })

