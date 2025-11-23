import { Model, DataTypes, Optional } from "sequelize";
import { PaymentStatus, RideStatus, RideType } from "../constant/common";
import newSequelize from "../infra/sequelize";

export interface RideInterface {
    id?: number;
    riderId: number;
    driverId?: number | null;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    type: RideType;
    status?: RideStatus;
    paymentStatus?: PaymentStatus;
    scheduledAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type RideCreationInterface = Optional<
    RideInterface,
    | "paymentStatus"
    | "id"
    | "driverId"
    | "status"
    | "scheduledAt"
    | "createdAt"
    | "updatedAt"
>;

class Ride extends Model<RideInterface, RideCreationInterface>
    implements RideInterface
{
    public id!: number;
    public riderId!: number;
    public driverId!: number | null;
    public pickupLat!: number;
    public pickupLng!: number;
    public dropoffLat!: number;
    public dropoffLng!: number;
    public type!: RideType;
    public status!: RideStatus;
    public paymentStatus!: PaymentStatus;
    public scheduledAt!: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Ride.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        riderId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        driverId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        pickupLat: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        pickupLng: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        dropoffLat: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        dropoffLng: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(RideType)),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(RideStatus)),
            allowNull: false,
            defaultValue: RideStatus.REQUESTED,
        },
        paymentStatus: {
            type: DataTypes.ENUM(...Object.values(PaymentStatus)),
            allowNull: false,
            defaultValue: PaymentStatus.UNPAID,
        },
        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "rides",
        freezeTableName: true,
        timestamps: true,
        underscored: false,
        sequelize: newSequelize(),
        modelName: "ride",
    }
);

export default Ride;
