"use strict";
/*
 * Created with @iobroker/create-adapter v1.28.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufySecurity = void 0;
const utils = __importStar(require("@iobroker/adapter-core"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const EufySecurityAPI = __importStar(require("./lib/eufy-security/eufy-security"));
const types_1 = require("./lib/eufy-security/http/types");
const utils_1 = require("./lib/eufy-security/utils");
const types_2 = require("./lib/eufy-security/push/types");
const types_3 = require("./lib/eufy-security/p2p/types");
class EufySecurity extends utils.Adapter {
    constructor(options = {}) {
        super(Object.assign(Object.assign({}, options), { name: "eufy-security" }));
        this.persistentData = {
            api_base: "",
            cloud_token: "",
            cloud_token_expiration: 0,
            openudid: "",
            serial_number: "",
            push_credentials: undefined,
            push_persistentIds: [],
            login_hash: ""
        };
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
        const data_dir = utils.getAbsoluteInstanceDataDir(this);
        this.persistentFile = data_dir + path.sep + "persistent.json";
        if (!fs.existsSync(data_dir))
            fs.mkdirSync(data_dir);
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    onReady() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getForeignObject("system.config", (err, obj) => {
                if (!this.supportsFeature || !this.supportsFeature("ADAPTER_AUTO_DECRYPT_NATIVE")) {
                    if (obj && obj.native && obj.native.secret) {
                        //noinspection JSUnresolvedVariable
                        this.config.password = utils_1.decrypt(obj.native.secret, this.config.password);
                    }
                    else {
                        //noinspection JSUnresolvedVariable
                        this.config.password = utils_1.decrypt("yx6eWMwGK2AE4k1Yoxt3E5pT", this.config.password);
                    }
                }
            });
            yield this.setObjectNotExistsAsync("verify_code", {
                type: "state",
                common: {
                    name: "2FA verification code",
                    type: "number",
                    role: "state",
                    read: true,
                    write: true,
                },
                native: {},
            });
            yield this.setObjectNotExistsAsync("info", {
                type: "channel",
                common: {
                    name: "info"
                },
                native: {},
            });
            yield this.setObjectNotExistsAsync("info.connection", {
                type: "state",
                common: {
                    name: "Cloud connection",
                    type: "boolean",
                    role: "indicator.connection",
                    read: true,
                    write: false,
                },
                native: {},
            });
            yield this.setStateAsync("info.connection", { val: false, ack: true });
            yield this.setObjectNotExistsAsync("info.push_connection", {
                type: "state",
                common: {
                    name: "Push notification connection",
                    type: "boolean",
                    role: "indicator.connection",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Type
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.TYPE), {
                type: "state",
                common: {
                    name: "Type",
                    type: "number",
                    role: "state",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Title
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.TITLE), {
                type: "state",
                common: {
                    name: "Title",
                    type: "string",
                    role: "text",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Content
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.CONTENT), {
                type: "state",
                common: {
                    name: "Content",
                    type: "string",
                    role: "text",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Station Serialnumber
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.STATION_SERIALNUMBER), {
                type: "state",
                common: {
                    name: "Station Serialnumber",
                    type: "string",
                    role: "text",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Device Serialnumber
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.DEVICE_SERIALNUMBER), {
                type: "state",
                common: {
                    name: "Device Serialnumber",
                    type: "string",
                    role: "text",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Payload
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.PAYLOAD), {
                type: "state",
                common: {
                    name: "Payload",
                    type: "string",
                    role: "text",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Event Time
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.EVENT_TIME), {
                type: "state",
                common: {
                    name: "Event Time",
                    type: "number",
                    role: "state",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Push Time
            yield this.setObjectNotExistsAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.PUSH_TIME), {
                type: "state",
                common: {
                    name: "Push Time",
                    type: "number",
                    role: "state",
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Remove old states of previous adapter versions
            try {
                const schedule_modes = yield this.getStatesAsync("*.schedule_mode");
                Object.keys(schedule_modes).forEach((id) => __awaiter(this, void 0, void 0, function* () {
                    yield this.delObjectAsync(id);
                }));
            }
            catch (error) {
            }
            try {
                if (fs.statSync(this.persistentFile).isFile()) {
                    const fileContent = fs.readFileSync(this.persistentFile, "utf8");
                    this.persistentData = JSON.parse(fileContent);
                }
            }
            catch (err) {
                this.log.debug("No stored data from last exit found.");
            }
            //TODO: Temporary Test to be removed!
            /*await this.setObjectNotExistsAsync("test_push", {
                type: "state",
                common: {
                    name: "Test push",
                    type: "boolean",
                    role: "button",
                    read: false,
                    write: true,
                },
                native: {},
            });
            this.subscribeStates("test_push");*/
            // END
            this.subscribeStates("verify_code");
            this.eufy = new EufySecurityAPI.EufySecurity(this);
            this.eufy.on("stations", (stations) => this.handleStations(stations));
            this.eufy.on("devices", (devices) => this.handleDevices(devices));
            this.eufy.on("push_notifications", (messages) => this.handlePushNotifications(messages));
            this.eufy.on("connected", () => this.onConnect());
            this.eufy.on("not_connected", () => this.onNotConnected());
            const api = this.eufy.getApi();
            if (this.persistentData.api_base && this.persistentData.api_base != "") {
                this.log.debug(`onReady(): Load previous api_base: ${this.persistentData.api_base}`);
                api.setAPIBase(this.persistentData.api_base);
            }
            if (this.persistentData.login_hash && this.persistentData.login_hash != "") {
                this.log.debug(`onReady(): Load previous login_hash: ${this.persistentData.login_hash}`);
                if (utils_1.md5(`${this.config.username}:${this.config.password}`) != this.persistentData.login_hash) {
                    this.log.info(`Authentication properties changed, invalidate saved cloud token.`);
                    this.persistentData.cloud_token = "";
                    this.persistentData.cloud_token_expiration = 0;
                }
            }
            else {
                this.persistentData.cloud_token = "";
                this.persistentData.cloud_token_expiration = 0;
            }
            if (this.persistentData.cloud_token && this.persistentData.cloud_token != "") {
                this.log.debug(`onReady(): Load previous token: ${this.persistentData.cloud_token} token_expiration: ${this.persistentData.cloud_token_expiration}`);
                api.setToken(this.persistentData.cloud_token);
                api.setTokenExpiration(new Date(this.persistentData.cloud_token_expiration));
            }
            if (!this.persistentData.openudid || this.persistentData.openudid == "") {
                this.persistentData.openudid = utils_1.generateUDID();
                this.log.debug(`onReady(): Generated new openudid: ${this.persistentData.openudid}`);
            }
            api.setOpenUDID(this.persistentData.openudid);
            if (!this.persistentData.serial_number || this.persistentData.serial_number == "") {
                this.persistentData.serial_number = utils_1.generateSerialnumber(12);
                this.log.debug(`onReady(): Generated new serial_number: ${this.persistentData.serial_number}`);
            }
            api.setSerialNumber(this.persistentData.serial_number);
            yield this.eufy.logon();
        });
    }
    writePersistentData() {
        this.persistentData.login_hash = utils_1.md5(`${this.config.username}:${this.config.password}`);
        fs.writeFileSync(this.persistentFile, JSON.stringify(this.persistentData));
    }
    refreshData(adapter) {
        return __awaiter(this, void 0, void 0, function* () {
            adapter.log.silly(`refreshData(): pollingInterval: ${adapter.config.pollingInterval}`);
            if (adapter.eufy) {
                adapter.log.info("Refresh data from cloud and schedule next refresh.");
                yield adapter.eufy.refreshData();
                adapter.refreshTimeout = setTimeout(() => { this.refreshData(adapter); }, adapter.config.pollingInterval * 60 * 1000);
            }
        });
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            if (this.eufy)
                this.setPushPersistentIds(this.eufy.getPushPersistentIds());
            this.writePersistentData();
            if (this.refreshTimeout)
                clearTimeout(this.refreshTimeout);
            if (this.eufy)
                this.eufy.close();
            callback();
        }
        catch (e) {
            callback();
        }
    }
    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
        return __awaiter(this, void 0, void 0, function* () {
            if (state) {
                // The state was changed
                this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
                // don't do anything if the state is acked
                if (!id || state.ack) {
                    return;
                }
                const values = id.split(".");
                const station_sn = values[2];
                const device_type = values[3];
                if (station_sn == "verify_code") {
                    if (this.eufy) {
                        this.log.info(`Verification code received, send it. (verify_code: ${state.val})`);
                        this.eufy.logon(state.val);
                        yield this.delStateAsync(id);
                    }
                    /*} else if (station_sn == "test_push") {
                        //TODO: Test to remove!
                        this.log.debug("TEST PUSH pressed");
                        if (this.eufy)
                            await this.eufy.getApi().sendVerifyCode(VerfyCodeTypes.TYPE_PUSH);
                            //await this.eufy.getStation("T8010P23201721F8").getCameraInfo();
                    */
                }
                else if (device_type == "cameras") {
                    const device_sn = values[4];
                    const device_state_name = values[5];
                    if (this.eufy) {
                        switch (device_state_name) {
                            case types_1.CameraStateID.START_STREAM:
                                yield this.setStateAsync(`${station_sn}.${device_type}.${device_sn}.${types_1.CameraStateID.LIVESTREAM}`, { val: yield this.eufy.startCameraStream(device_sn), ack: true });
                                break;
                            case types_1.CameraStateID.STOP_STREAM:
                                yield this.eufy.stopCameraStream(device_sn);
                                break;
                        }
                    }
                }
                else if (device_type == "station") {
                    const station_state_name = values[4];
                    if (this.eufy) {
                        switch (station_state_name) {
                            case types_1.StationStateID.GUARD_MODE:
                                yield this.eufy.getStation(station_sn).setGuardMode(state.val);
                                yield this.setStateAsync(`${station_sn}.${device_type}.${station_state_name}`, Object.assign(Object.assign({}, state), { ack: true }));
                                break;
                        }
                    }
                }
            }
            else {
                // The state was deleted
                this.log.info(`state ${id} deleted`);
            }
        });
    }
    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  */
    // private onMessage(obj: ioBroker.Message): void {
    //     if (typeof obj === "object" && obj.message) {
    //         if (obj.command === "send") {
    //             // e.g. send email or pushover or whatever
    //             this.log.info("send command");
    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    //         }
    //     }
    // }
    handleDevices(devices) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`handleDevices(): count: ${Object.keys(devices).length}`);
            Object.values(devices).forEach((device) => __awaiter(this, void 0, void 0, function* () {
                yield this.setObjectNotExistsAsync(device.getStateID("", 0), {
                    type: "channel",
                    common: {
                        name: device.getStateChannel()
                    },
                    native: {},
                });
                yield this.setObjectNotExistsAsync(device.getStateID("", 1), {
                    type: "device",
                    common: {
                        name: device.getName()
                    },
                    native: {},
                });
                // Name
                yield this.setObjectNotExistsAsync(device.getStateID(types_1.DeviceStateID.NAME), {
                    type: "state",
                    common: {
                        name: "Name",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, device.getStateID(types_1.DeviceStateID.NAME), device.getName());
                // Model
                yield this.setObjectNotExistsAsync(device.getStateID(types_1.DeviceStateID.MODEL), {
                    type: "state",
                    common: {
                        name: "Model",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, device.getStateID(types_1.DeviceStateID.MODEL), device.getModel());
                // Serial
                yield this.setObjectNotExistsAsync(device.getStateID(types_1.DeviceStateID.SERIAL_NUMBER), {
                    type: "state",
                    common: {
                        name: "Serial number",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, device.getStateID(types_1.DeviceStateID.SERIAL_NUMBER), device.getSerial());
                // Software version
                yield this.setObjectNotExistsAsync(device.getStateID(types_1.DeviceStateID.SOFTWARE_VERSION), {
                    type: "state",
                    common: {
                        name: "Software version",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, device.getStateID(types_1.DeviceStateID.SOFTWARE_VERSION), device.getSoftwareVersion());
                // Hardware version
                yield this.setObjectNotExistsAsync(device.getStateID(types_1.DeviceStateID.HARDWARE_VERSION), {
                    type: "state",
                    common: {
                        name: "Hardware version",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, device.getStateID(types_1.DeviceStateID.HARDWARE_VERSION), device.getHardwareVersion());
                if (device.isCamera()) {
                    const camera = device;
                    // Mac address
                    yield this.setObjectNotExistsAsync(camera.getStateID(types_1.CameraStateID.MAC_ADDRESS), {
                        type: "state",
                        common: {
                            name: "MAC Address",
                            type: "string",
                            role: "text",
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    yield utils_1.setStateChangedAsync(this, camera.getStateID(types_1.CameraStateID.MAC_ADDRESS), camera.getMACAddress());
                    // Last camera URL
                    yield this.setObjectNotExistsAsync(camera.getStateID(types_1.CameraStateID.LAST_CAMERA_URL), {
                        type: "state",
                        common: {
                            name: "Last camera URL",
                            type: "string",
                            role: "text.url",
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    yield utils_1.setStateChangedAsync(this, camera.getStateID(types_1.CameraStateID.LAST_CAMERA_URL), camera.getLastCameraImageURL());
                    // Start Stream
                    yield this.setObjectNotExistsAsync(camera.getStateID(types_1.CameraStateID.START_STREAM), {
                        type: "state",
                        common: {
                            name: "Start stream",
                            type: "boolean",
                            role: "button.start",
                            read: false,
                            write: true,
                        },
                        native: {},
                    });
                    // Stop Stream
                    yield this.setObjectNotExistsAsync(camera.getStateID(types_1.CameraStateID.STOP_STREAM), {
                        type: "state",
                        common: {
                            name: "Stop stream",
                            type: "boolean",
                            role: "button.stop",
                            read: false,
                            write: true,
                        },
                        native: {},
                    });
                    // Livestream URL
                    yield this.setObjectNotExistsAsync(camera.getStateID(types_1.CameraStateID.LIVESTREAM), {
                        type: "state",
                        common: {
                            name: "Livestream URL",
                            type: "string",
                            role: "text.url",
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Battery
                    //TODO: Rework to display only if device has battery, indipendently of device type
                    yield this.setObjectNotExistsAsync(camera.getStateID(types_1.CameraStateID.BATTERY), {
                        type: "state",
                        common: {
                            name: "Battery",
                            type: "number",
                            role: "value",
                            unit: "%",
                            min: 0,
                            max: 100,
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    yield utils_1.setStateChangedAsync(this, camera.getStateID(types_1.CameraStateID.BATTERY), camera.getParameters()[types_3.CommandType.CMD_GET_BATTERY]);
                }
            }));
        });
    }
    handleStations(stations) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`handleStations(): count: ${Object.keys(stations).length}`);
            Object.values(stations).forEach((station) => __awaiter(this, void 0, void 0, function* () {
                this.subscribeStates(`${station.getStateID("", 0)}.*`);
                yield this.setObjectNotExistsAsync(station.getStateID("", 0), {
                    type: "device",
                    common: {
                        name: station.getName()
                    },
                    native: {},
                });
                yield this.setObjectNotExistsAsync(station.getStateID("", 1), {
                    type: "channel",
                    common: {
                        name: station.getStateChannel()
                    },
                    native: {},
                });
                // Station info
                // Name
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.NAME), {
                    type: "state",
                    common: {
                        name: "Name",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.NAME), station.getName());
                // Model
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.MODEL), {
                    type: "state",
                    common: {
                        name: "Model",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.MODEL), station.getModel());
                // Serial
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.SERIAL_NUMBER), {
                    type: "state",
                    common: {
                        name: "Serial number",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.SERIAL_NUMBER), station.getSerial());
                // Software version
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.SOFTWARE_VERSION), {
                    type: "state",
                    common: {
                        name: "Software version",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.SOFTWARE_VERSION), station.getSoftwareVersion());
                // Hardware version
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.HARDWARE_VERSION), {
                    type: "state",
                    common: {
                        name: "Hardware version",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.HARDWARE_VERSION), station.getHardwareVersion());
                // IP Address
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.LAN_IP_ADDRESS), {
                    type: "state",
                    common: {
                        name: "IP Address",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.LAN_IP_ADDRESS), station.getIPAddress());
                // MAC Address
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.MAC_ADDRESS), {
                    type: "state",
                    common: {
                        name: "MAC Address",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.MAC_ADDRESS), station.getMACAddress());
                // LAN IP Address
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.LAN_IP_ADDRESS), {
                    type: "state",
                    common: {
                        name: "LAN IP Address",
                        type: "string",
                        role: "text",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.LAN_IP_ADDRESS), station.getParameter(types_3.CommandType.CMD_GET_HUB_LAN_IP));
                // Station Paramters
                // Guard Mode
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.GUARD_MODE), {
                    type: "state",
                    common: {
                        name: "Guard Mode",
                        type: "number",
                        role: "state",
                        read: true,
                        write: true,
                        states: {
                            0: "AWAY",
                            1: "HOME",
                            2: "SCHEDULE",
                            3: "CUSTOM1",
                            4: "CUSTOM2",
                            5: "CUSTOM3",
                            47: "GEO",
                            63: "DISARMED"
                        }
                    },
                    native: {},
                });
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.GUARD_MODE), station.getParameter(types_1.ParamType.GUARD_MODE));
                // Current Alarm Mode
                yield this.setObjectNotExistsAsync(station.getStateID(types_1.StationStateID.CURRENT_MODE), {
                    type: "state",
                    common: {
                        name: "Current Mode",
                        type: "number",
                        role: "state",
                        read: true,
                        write: false,
                        states: {
                            0: "AWAY",
                            1: "HOME",
                            63: "DISARMED"
                        }
                    },
                    native: {},
                });
                //APP_CMD_GET_ALARM_MODE = 1151
                yield utils_1.setStateChangedAsync(this, station.getStateID(types_1.StationStateID.CURRENT_MODE), station.getParameter(types_1.ParamType.SCHEDULE_MODE));
            }));
        });
    }
    handlePushNotifications(push_msg) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`handlePushNotifications(): push_msg: ` + JSON.stringify(push_msg));
            // Type
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.TYPE), { val: Number.parseInt(push_msg.payload.type), ack: true });
            // Title
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.TITLE), { val: push_msg.payload.title, ack: true });
            // Content
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.CONTENT), { val: push_msg.payload.content, ack: true });
            // Station Serialnumber
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.STATION_SERIALNUMBER), { val: push_msg.payload.station_sn, ack: true });
            // Device Serialnumber
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.DEVICE_SERIALNUMBER), { val: push_msg.payload.device_sn, ack: true });
            // Payload
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.PAYLOAD), { val: JSON.stringify(push_msg.payload.payload), ack: true });
            // Event Time
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.EVENT_TIME), { val: Number.parseInt(push_msg.payload.event_time), ack: true });
            // Push Time
            yield this.setStateAsync(utils_1.getPushNotificationStateID(types_2.PushNotificationStateID.PUSH_TIME), { val: Number.parseInt(push_msg.payload.push_time), ack: true });
            const type = Number.parseInt(push_msg.payload.type);
            if (type == types_2.ServerPushEvent.PUSH_VERIFICATION) {
                this.log.debug(`handlePushNotifications(): Received push verification event: ` + JSON.stringify(push_msg.payload));
                //push_msg.payload.payload.verify_code
            }
            else {
                switch (push_msg.payload.payload.a) {
                    case types_2.PushEvent.PUSH_SECURITY_EVT: // Cam movement detected event
                        //TODO: Finish implementation!
                        /*adapter.
                        if (push_msg.data.payload.i) {
                            ""
                        } else {
                            "Motion detected."
                        }*/
                        break;
                    case types_2.PushEvent.PUSH_MODE_SWITCH: // Changing Guard mode event
                        if (this.eufy) {
                            const station = this.eufy.getStation(push_msg.payload.payload.s);
                            if (push_msg.payload.payload.arming && push_msg.payload.payload.mode) {
                                yield this.setStateAsync(station.getStateID(types_1.StationStateID.GUARD_MODE), { val: push_msg.payload.payload.arming, ack: true });
                                yield this.setStateAsync(station.getStateID(types_1.StationStateID.CURRENT_MODE), { val: push_msg.payload.payload.mode, ack: true });
                            }
                            this.log.info(`Received push notification for changing guard mode (guard_mode: ${push_msg.payload.payload.arming} current_mode: ${push_msg.payload.payload.mode}) for station ${station.getSerial()}}.`);
                        }
                        break;
                    default:
                        this.log.debug(`handlePushNotifications(): Unhandled push event: ` + JSON.stringify(push_msg.payload));
                        break;
                }
            }
        });
    }
    onConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.silly(`onConnect(): `);
            yield this.setStateAsync("info.connection", { val: true, ack: true });
            yield this.refreshData(this);
            if (this.eufy) {
                const api_base = this.eufy.getApi().getAPIBase();
                const token = this.eufy.getApi().getToken();
                const token_expiration = this.eufy.getApi().getTokenExpiration();
                if (api_base) {
                    this.log.debug(`onConnect(): save api_base - api_base: ${api_base}`);
                    this.setAPIBase(api_base);
                }
                if (token && token_expiration) {
                    this.log.debug(`onConnect(): save token and expiration - token: ${token} token_expiration: ${token_expiration}`);
                    this.setCloudToken(token, token_expiration);
                }
                yield this.eufy.registerPushNotifications(this.getPersistentData().push_persistentIds);
                Object.values(this.eufy.getStations()).forEach(function (station) {
                    station.connect();
                });
            }
        });
    }
    onNotConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.silly(`onNotConnected(): `);
            yield this.setStateAsync("info.connection", { val: false, ack: true });
        });
    }
    setAPIBase(api_base) {
        this.persistentData.api_base = api_base;
        this.writePersistentData();
    }
    setCloudToken(token, expiration) {
        this.persistentData.cloud_token = token;
        this.persistentData.cloud_token_expiration = expiration.getTime();
        this.writePersistentData();
    }
    setPushCredentials(credentials) {
        this.persistentData.push_credentials = credentials;
        this.writePersistentData();
    }
    getPersistentData() {
        return this.persistentData;
    }
    setPushPersistentIds(persistentIds) {
        this.persistentData.push_persistentIds = persistentIds;
        //this.writePersistentData();
    }
}
exports.EufySecurity = EufySecurity;
if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new EufySecurity(options);
}
else {
    // otherwise start the instance directly
    (() => new EufySecurity())();
}
