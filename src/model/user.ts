import { Model, DataTypes, Optional } from "sequelize";
import { UserType } from "../constant/common";
import newSequelize from "../infra/sequelize";

export interface UserAttributes {
    id?: number;
    phone: string;
    email?: string | null;
    type: UserType;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

type UserCreationAttributes = Optional<
    UserAttributes,
    "id" | "email" | "isActive" | "createdAt" | "updatedAt"
>;

class User extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes
{
    public id!: number;
    public phone!: string;
    public email!: string | null;
    public type!: UserType;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        phone: {
            type: DataTypes.STRING(32),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(191),
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(UserType)),
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        tableName: "users",
        freezeTableName: true,
        timestamps: true,
        underscored: false,
        sequelize: newSequelize(),
        modelName: "user",
    }
);

export default User;
