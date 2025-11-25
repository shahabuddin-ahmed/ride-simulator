import User from "./user";
import Driver from "./driver";
import Ride from "./ride";
import OfflineParing from "./offline-paring";

// USER ↔ DRIVER
User.hasOne(Driver, {
    foreignKey: "userId",
    as: "driver",
});
Driver.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
});

// USER ↔ RIDE (as rider)
User.hasMany(Ride, {
    foreignKey: "riderId",
    as: "ridesAsRider",
});
Ride.belongsTo(User, {
    foreignKey: "riderId",
    as: "rider",
});

// USER ↔ RIDE (as driver)
User.hasMany(Ride, {
    foreignKey: "driverId",
    as: "ridesAsDriver",
});
Ride.belongsTo(User, {
    foreignKey: "driverId",
    as: "driver",
});

// USER ↔ OFFLINE_PAIRING (driver)
User.hasMany(OfflineParing, {
    foreignKey: "driverId",
    as: "offlineParings",
});
OfflineParing.belongsTo(User, {
    foreignKey: "driverId",
    as: "driver",
});
