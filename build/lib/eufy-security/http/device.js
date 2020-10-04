"use strict";
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
exports.FloodlightCamera = exports.DoorbellCamera = exports.Camera = exports.Device = void 0;
const types_1 = require("./types");
const parameter_1 = require("./parameter");
const utils_1 = require("../utils");
class Device {
    constructor(api, device) {
        this.api = api;
        this.device = device;
        this.log = api.getLog();
        this.update(device);
    }
    update(device) {
        this.device = device;
    }
    static isCamera(device) {
        if (device.device_type == types_1.DeviceType.CAMERA ||
            device.device_type == types_1.DeviceType.CAMERA2 ||
            device.device_type == types_1.DeviceType.CAMERA_E ||
            device.device_type == types_1.DeviceType.CAMERA2C ||
            device.device_type == types_1.DeviceType.INDOOR_CAMERA ||
            device.device_type == types_1.DeviceType.INDOOR_PT_CAMERA ||
            device.device_type == types_1.DeviceType.FLOODLIGHT ||
            device.device_type == types_1.DeviceType.DOORBELL ||
            device.device_type == types_1.DeviceType.BATTERY_DOORBELL)
            return true;
        return false;
    }
    static isDoorbell(device) {
        if (device.device_type == types_1.DeviceType.DOORBELL ||
            device.device_type == types_1.DeviceType.BATTERY_DOORBELL)
            return true;
        return false;
    }
}
exports.Device = Device;
class Camera extends Device {
    constructor() {
        super(...arguments);
        this.is_streaming = false;
    }
    getStateID(state) {
        return utils_1.getCameraStateID(this, 2, state);
    }
    getDeviceType() {
        return this.device.device_type;
    }
    getHardwareVersion() {
        return this.device.main_hw_version;
    }
    getLastCameraImageURL() {
        return this.device.cover_path;
    }
    getMACAddress() {
        return this.device.wifi_mac;
    }
    getModel() {
        return this.device.device_model;
    }
    getName() {
        return this.device.device_name;
    }
    getSerial() {
        return this.device.device_sn;
    }
    getSoftwareVersion() {
        return this.device.main_sw_version;
    }
    getStationSerial() {
        return this.device.station_sn;
    }
    getParameters() {
        const parameters = {};
        this.device.params.forEach(param => {
            parameters[param.param_type] = parameter_1.Parameter.readValue(param.param_type, param.param_value);
        });
        return parameters;
    }
    setParameters(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const tmp_params = [];
            params.forEach(param => {
                tmp_params.push({ param_type: param.param_type, param_value: parameter_1.Parameter.writeValue(param.param_type, param.param_value) });
            });
            try {
                const response = yield this.api.request("post", "app/upload_devs_params", {
                    device_sn: this.device.device_sn,
                    station_sn: this.device.station_sn,
                    json: tmp_params
                });
                this.log.debug(`Camera.setParameters(): Response: ${JSON.stringify(response.data)}`);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        this.log.debug("New Parameters successfully set.");
                        this.log.info(`Camera.setParameters(): New Parameters set. response: ${JSON.stringify(dataresult)}`);
                    }
                    else
                        this.log.error(`Camera.setParameters(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
                else {
                    this.log.error(`Camera.setParameters(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log.error(`Camera.setParameters(): error: ${error}`);
            }
        });
    }
    startDetection() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start camera detection.
            yield this.setParameters([{ param_type: types_1.ParamType.DETECT_SWITCH, param_value: 1 }]);
        });
    }
    startStream() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start the camera stream and return the RTSP URL.
            try {
                const response = yield this.api.request("post", "web/equipment/start_stream", {
                    device_sn: this.device.device_sn,
                    station_sn: this.device.station_sn,
                    proto: 2
                });
                this.log.debug(`Camera.startStream(): Response: ${JSON.stringify(response.data)}`);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        const dataresult = result.data;
                        this.is_streaming = true;
                        this.log.info(`Livestream of camera ${this.device.device_sn} started.`);
                        return dataresult.url;
                    }
                    else
                        this.log.error(`Camera.startStream(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
                else {
                    this.log.error(`Camera.startStream(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log.error(`Camera.startStream(): error: ${error}`);
            }
            return "";
        });
    }
    stopDetection() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop camera detection.
            yield this.setParameters([{ param_type: types_1.ParamType.DETECT_SWITCH, param_value: 0 }]);
        });
    }
    stopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop the camera stream.
            try {
                const response = yield this.api.request("post", "web/equipment/stop_stream", {
                    device_sn: this.device.device_sn,
                    station_sn: this.device.station_sn,
                    proto: 2
                });
                this.log.debug(`Camera.stopStream(): Response: ${JSON.stringify(response.data)}`);
                if (response.status == 200) {
                    const result = response.data;
                    if (result.code == 0) {
                        this.is_streaming = false;
                        this.log.info(`Livestream of camera ${this.device.device_sn} stopped.`);
                    }
                    else {
                        this.log.error(`Camera.stopStream(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                    }
                }
                else {
                    this.log.error(`Camera.stopStream(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
                }
            }
            catch (error) {
                this.log.error(`Camera.stopStream(): error: ${error}`);
            }
        });
    }
    isStreaming() {
        return this.is_streaming;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Stop other things if implemented such as detection feature
            if (this.is_streaming)
                yield this.stopStream();
        });
    }
}
exports.Camera = Camera;
class DoorbellCamera extends Camera {
}
exports.DoorbellCamera = DoorbellCamera;
class FloodlightCamera extends Camera {
}
exports.FloodlightCamera = FloodlightCamera;