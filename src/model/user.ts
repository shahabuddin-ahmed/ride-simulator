import { Model, DataTypes, Optional } from "sequelize";
import { UserType } from "../constant/common";
import newSequelize from "../infra/sequelize";

export interface UserInterface {
    id?: number;
    fristName: string | null;
    lastName: string | null;
    mobile: string;
    email: string | null;
    type: UserType;
    password?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

type UserCreationInterface = Optional<
    UserInterface,
    "id" | "fristName" | "lastName" | "email" | "password" | "isActive" | "createdAt" | "updatedAt"
>;

class User extends Model<UserInterface, UserCreationInterface> implements UserInterface {
    public id!: number;
    public fristName!: string | null;
    public lastName!: string | null;
    public mobile!: string;
    public email!: string | null;
    public type!: UserType;
    public password!: string | null;
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
        fristName: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        mobile: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(UserType)),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(225),
            allowNull: true,
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
    },
);

export default User;
