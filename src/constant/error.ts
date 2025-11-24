export enum ERROR_CODES {
    E_PAGE_NOT_FOUND = "E_PAGE_NOT_FOUND",
    E_INVALID_DATA = "E_INVALID_DATA",
    E_INTERNAL_SERVER_ERROR = "E_INTERNAL_SERVER_ERROR",
    E_UNAUTHORIZED = "E_UNAUTHORIZED",
    E_INVALID_OTP = "E_INVALID_OTP",
    E_INACTIVE_USER = "E_INACTIVE_USER",
    E_CONTACT_REQUIRED = "E_CONTACT_REQUIRED",
    E_INVALID_TOKEN = "E_INVALID_TOKEN",
    E_INVALID_CREDENTIALS = "E_INVALID_CREDENTIALS",
}

export const errorMessages: Record<ERROR_CODES, { message: string }> = {
    E_PAGE_NOT_FOUND: {
        message: "please be sane and hit correct endpoints",
    },
    E_INVALID_DATA: {
        message: "Please provide valid data",
    },

    E_INTERNAL_SERVER_ERROR: {
        message: "Internal Server Error",
    },
    E_UNAUTHORIZED: {
        message: "Invalid credentials",
    },
    E_INVALID_OTP: {
        message: "Invalid or expired OTP",
    },
    E_INACTIVE_USER: {
        message: "User is inactive",
    },
    E_CONTACT_REQUIRED: {
        message: "Email and mobile are required",
    },
    E_INVALID_CREDENTIALS: {
        message: "Invalid credentials"
    },
    E_INVALID_TOKEN: {
        message: "Invalid token"
    },
};

export enum ApiResponseMessages {
    SUCCESS = "SUCCESS",
    INTERNAL_SERVER_ERROR = "Internal Server Error",
}
