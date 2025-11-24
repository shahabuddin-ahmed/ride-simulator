import { Dialect } from "sequelize";

interface SequelizeConfig {
	USERNAME: string;
	PASSWORD: string;
	MYSQL_DATABASE: string;
}

interface SequelizeOptions {
	host: string;
	dialect: Dialect;
	pool: {
		max: number;
		min: number;
		idle: number;
	};
	define: {
		timestamps: boolean
	},
	charset: string;
	collate: string;
	logging: boolean;
	log: any;
}

interface JWTConfig {
    JWT_SECRET: string;
    JWT_EXPIRATION: number;
}


interface Config {
	SEQUELIZE: SequelizeConfig;
	SEQUELIZEOPTIONS: SequelizeOptions;
	APPLICATION_SERVER_PORT: number;
	APP_FORCE_SHUTDOWN_SECOND: number;
	JWT: JWTConfig;
	OTP_EXPIRY_MINUTES: number;
	OTP_SECRET?: string;
}

const config: Config = {
	SEQUELIZE: {
		USERNAME: process.env.MYSQL_USER || "root",
		PASSWORD: process.env.MYSQL_PASSWORD || "root",
		MYSQL_DATABASE: process.env.MYSQL_DATABASE || "ride_sharing",
	},
	SEQUELIZEOPTIONS: {
		host: process.env.MYSQL_HOST || "0.0.0.0",
		dialect: "mysql",
		pool: {
			max: 20,
			min: 5,
			idle: 10000
		},
		define: {
			timestamps: false
		},
		charset: "utf8",
		collate: "utf8_general_ci",
		logging: false,
		log: console.log
	},
	APPLICATION_SERVER_PORT: Number(process.env.APPLICATION_SERVER_PORT) || 3000,
	APP_FORCE_SHUTDOWN_SECOND: Number(process.env.APP_FORCE_SHUTDOWN_SECOND) || 30,
	JWT: {
		JWT_SECRET: process.env.JWT_SECRET || "this is random jwt secret key",
		JWT_EXPIRATION: Number(process.env.JWT_EXPIRATION) || 43200, // 12 hours in seconds
	},
    OTP_EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
    OTP_SECRET: process.env.OTP_SECRET || "this is random otp secret key",
};

export default config;
