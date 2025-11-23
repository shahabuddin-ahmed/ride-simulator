import { Model, DataTypes, Optional } from "sequelize";
import newSequelize from "../infra/sequelize";

export interface DriverInterface {
    id?: number;
    userId: number;
    currentLat?: number | null;
    currentLng?: number | null;
    isOnline?: boolean;
    lastPingAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type DriverCreationInterface = Optional<
    DriverInterface,
    "id" | "currentLat" | "currentLng" | "isOnline" | "lastPingAt" | "createdAt" | "updatedAt"
>;

class Driver
    extends Model<DriverInterface, DriverCreationInterface>
    implements DriverInterface
{
    public id!: number;
    public userId!: number;
    public currentLat!: number | null;
    public currentLng!: number | null;
    public isOnline!: boolean;
    public lastPingAt!: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Driver.init(
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
        currentLat: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        currentLng: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        isOnline: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        lastPingAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "drivers",
        freezeTableName: true,
        timestamps: true,
        underscored: false,
        sequelize: newSequelize(),
        modelName: "driver",
    }
);

export default Driver;
