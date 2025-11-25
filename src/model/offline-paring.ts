import { Model, DataTypes, Optional } from "sequelize";
import { OfflineParingStatus } from "../constant/common";
import newSequelize from "../infra/sequelize";

export interface OfflineParingInterface {
    id?: number;
    driverId: number;
    code: string;
    status?: OfflineParingStatus;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

type OfflineParingCreationInterface = Optional<OfflineParingInterface, "id" | "status" | "createdAt" | "updatedAt">;

class OfflineParing
    extends Model<OfflineParingInterface, OfflineParingCreationInterface>
    implements OfflineParingInterface
{
    public id!: number;
    public driverId!: number;
    public code!: string;
    public status!: OfflineParingStatus;
    public expiresAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

OfflineParing.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        driverId: {
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
        status: {
            type: DataTypes.ENUM(...Object.values(OfflineParingStatus)),
            allowNull: false,
            defaultValue: OfflineParingStatus.ACTIVE,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: "offline_pairings",
        freezeTableName: true,
        timestamps: true,
        underscored: false,
        sequelize: newSequelize(),
        modelName: "offline_pairing",
    },
);

export default OfflineParing;
