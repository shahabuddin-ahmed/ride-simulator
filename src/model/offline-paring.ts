import { Model, DataTypes, Optional } from "sequelize";
import { OfflinePairingStatus } from "../constant/common";
import newSequelize from "../infra/sequelize";

export interface OfflinePairingInterface {
    id?: number;
    driverId: number;
    code: string;
    status?: OfflinePairingStatus;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

type OfflinePairingCreationInterface = Optional<
    OfflinePairingInterface,
    "id" | "status" | "createdAt" | "updatedAt"
>;

class OfflinePairing
    extends Model<OfflinePairingInterface, OfflinePairingCreationInterface>
    implements OfflinePairingInterface
{
    public id!: number;
    public driverId!: number;
    public code!: string;
    public status!: OfflinePairingStatus;
    public expiresAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

OfflinePairing.init(
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
            type: DataTypes.ENUM(...Object.values(OfflinePairingStatus)),
            allowNull: false,
            defaultValue: OfflinePairingStatus.ACTIVE,
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
    }
);

export default OfflinePairing;
