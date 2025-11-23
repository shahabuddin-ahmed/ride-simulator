import { Model, DataTypes, Optional } from "sequelize";
import newSequelize from "../infra/sequelize";

export interface OtpInterface {
    id?: number;
    userId: number;
    code: string;
    expiresAt: Date;
    consumed?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

type OtpCreationInterface = Optional<
    OtpInterface,
    "id" | "consumed" | "createdAt" | "updatedAt"
>;

class Otp extends Model<OtpInterface, OtpCreationInterface>
    implements OtpInterface
{
    public id!: number;
    public userId!: number;
    public code!: string;
    public expiresAt!: Date;
    public consumed!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Otp.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        consumed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: "otps",
        freezeTableName: true,
        timestamps: true,
        underscored: false,
        sequelize: newSequelize(),
        modelName: "otp",
    }
);

export default Otp;
