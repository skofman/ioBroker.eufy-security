import { API } from "./api";
import { DeviceType, ParamType } from "./types";
import { FullDeviceResponse, ResultResponse, StreamResponse } from "./models"
import { Parameter } from "./parameter";
import { IParameter, ParameterArray } from "./interfaces";
import { EventEmitter } from "events";

export abstract class Device extends EventEmitter {

    protected api: API;
    protected device: FullDeviceResponse;
    protected log: ioBroker.Logger;

    private parameters: ParameterArray = {};

    constructor(api: API, device: FullDeviceResponse) {
        super();
        this.api = api;
        this.device = device;
        this.log = api.getLog();
        this.loadParameters();
    }

    private loadParameters(): void {
        this.device.params.forEach(param => {
            this.parameters[param.param_type] = Parameter.readValue(param.param_type, param.param_value);
        });
        this.log.debug(`Device.loadParameters(): device_sn: ${this.getSerial()} parameters: ${JSON.stringify(this.parameters)}`);
    }

    public getParameter(param_type: number): string {
        return this.parameters[param_type];
    }

    public getParameters(): ParameterArray {
        return this.parameters;
    }

    public update(device: FullDeviceResponse):void {
        this.device = device;
        this.device.params.forEach(param => {
            if (this.parameters[param.param_type] != param.param_value) {
                this.parameters[param.param_type] = Parameter.readValue(param.param_type, param.param_value);
                this.emit("parameter", this, param.param_type, param.param_value);
            }
        });
    }

    static isCamera(type: number): boolean {
        if (type == DeviceType.CAMERA ||
            type == DeviceType.CAMERA2 ||
            type == DeviceType.CAMERA_E ||
            type == DeviceType.CAMERA2C ||
            type == DeviceType.INDOOR_CAMERA ||
            type == DeviceType.INDOOR_PT_CAMERA ||
            type == DeviceType.FLOODLIGHT ||
            type == DeviceType.DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL_2 ||
            type == DeviceType.CAMERA2C_PRO ||
            type == DeviceType.CAMERA2_PRO ||
            type == DeviceType.INDOOR_CAMERA_1080 ||
            type == DeviceType.INDOOR_PT_CAMERA_1080 ||
            type == DeviceType.SOLO_CAMERA ||
            type == DeviceType.SOLO_CAMERA_PRO)
            return true;
        return false;
    }

    static isStation(type: number): boolean {
        if (type == DeviceType.STATION)
            return true;
        return false;
    }

    static isSensor(type: number): boolean {
        if (type == DeviceType.SENSOR ||
            type == DeviceType.MOTION_SENSOR)
            return true;
        return false;
    }

    static isKeyPad(type: number): boolean {
        return DeviceType.KEYPAD == type;
    }

    static isDoorbell(type: number): boolean {
        if (type == DeviceType.DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL ||
            type == DeviceType.BATTERY_DOORBELL_2)
            return true;
        return false;
    }

    static isFloodLight(type: number): boolean {
        return DeviceType.FLOODLIGHT == type;
    }

    static isLock(type: number): boolean {
        return Device.isLockBasic(type) || Device.isLockAdvanced(type) || Device.isLockBasicNoFinger(type) || Device.isLockAdvancedNoFinger(type);
    }

    static isLockBasic(type: number): boolean {
        return DeviceType.LOCK_BASIC == type;
    }

    static isLockBasicNoFinger(type: number): boolean {
        return DeviceType.LOCK_BASIC_NO_FINGER == type;
    }

    static isLockAdvanced(type: number): boolean {
        return DeviceType.LOCK_ADVANCED == type;
    }

    static isLockAdvancedNoFinger(type: number): boolean {
        return DeviceType.LOCK_ADVANCED_NO_FINGER == type;
    }

    static isBatteryDoorbell(type: number): boolean {
        return DeviceType.BATTERY_DOORBELL == type;
    }

    static isBatteryDoorbell2(type: number): boolean {
        return DeviceType.BATTERY_DOORBELL_2 == type;
    }

    //static isIndoorCameras(type: number): boolean {
    //    return l.I(this.device_sn);
    //}

    static isSoloCamera(type: number): boolean {
        return DeviceType.SOLO_CAMERA == type;
    }

    static isSoloCameraPro(type: number): boolean {
        return DeviceType.SOLO_CAMERA_PRO == type;
    }

    static isSoloCameras(type: number): boolean {
        return Device.isSoloCamera(type) || Device.isSoloCameraPro(type);
    }

    static isCamera2(type: number): boolean {
        //T8114
        return DeviceType.CAMERA2 == type;
    }

    static isCamera2C(type: number): boolean {
        //T8113
        return DeviceType.CAMERA2C == type;
    }

    static isCamera2Pro(type: number): boolean {
        //T8140
        return DeviceType.CAMERA2_PRO == type;
    }

    static isCamera2CPro(type: number): boolean {
        //T8142
        return DeviceType.CAMERA2C_PRO == type;
    }

    static isCamera2Product(type: number): boolean {
        return Device.isCamera2(type) || Device.isCamera2C(type) || Device.isCamera2Pro(type) || Device.isCamera2CPro(type);
    }

    static isEntrySensor(type: number): boolean {
        //T8900
        return DeviceType.SENSOR == type;
    }

    static isMotionSensor(type: number): boolean {
        return DeviceType.MOTION_SENSOR == type;
    }

    public isCamera(): boolean {
        return Device.isCamera(this.device.device_type);
    }

    public isFloodLight(): boolean {
        return DeviceType.FLOODLIGHT == this.device.device_type;
    }

    public isDoorbell(): boolean {
        return Device.isDoorbell(this.device.device_type);
    }

    public isLock(): boolean {
        return Device.isLock(this.device.device_type);
    }

    public isLockBasic(): boolean {
        return Device.isLockBasic(this.device.device_type);
    }

    public isLockBasicNoFinger(): boolean {
        return Device.isLockBasicNoFinger(this.device.device_type);
    }

    public isLockAdvanced(): boolean {
        return Device.isLockAdvanced(this.device.device_type);
    }

    public isLockAdvancedNoFinger(): boolean {
        return Device.isLockAdvancedNoFinger(this.device.device_type);
    }

    public isBatteryDoorbell(): boolean {
        return Device.isBatteryDoorbell(this.device.device_type);
    }

    public isBatteryDoorbell2(): boolean {
        return Device.isBatteryDoorbell2(this.device.device_type);
    }

    public isSoloCamera(): boolean {
        return Device.isSoloCamera(this.device.device_type);
    }

    public isSoloCameraPro(): boolean {
        return Device.isSoloCameraPro(this.device.device_type);
    }

    public isSoloCameras(): boolean {
        return Device.isSoloCameras(this.device.device_type);
    }

    public isCamera2(): boolean {
        return Device.isCamera2(this.device.device_type);
    }

    public isCamera2C(): boolean {
        return Device.isCamera2C(this.device.device_type);
    }

    public isCamera2Pro(): boolean {
        return Device.isCamera2Pro(this.device.device_type);
    }

    public isCamera2CPro(): boolean {
        return Device.isCamera2CPro(this.device.device_type);
    }

    public isCamera2Product(): boolean {
        return Device.isCamera2Product(this.device.device_type);
    }

    public isEntrySensor(): boolean {
        return Device.isEntrySensor(this.device.device_type);
    }

    public isKeyPad(): boolean {
        return Device.isKeyPad(this.device.device_type);
    }

    public isMotionSensor(): boolean {
        return Device.isMotionSensor(this.device.device_type);
    }

    public getDeviceKey(): string {
        return this.device.station_sn + this.device.device_channel;
    }

    public getDeviceType(): number {
        return this.device.device_type;
    }

    public getHardwareVersion(): string {
        return this.device.main_hw_version;
    }

    public getSoftwareVersion(): string {
        return this.device.main_sw_version;
    }

    public getModel(): string {
        return this.device.device_model;
    }

    public getName(): string {
        return this.device.device_name;
    }

    public getSerial(): string {
        return this.device.device_sn;
    }

    public getStationSerial(): string {
        return this.device.station_sn;
    }

    public async setParameters(params: IParameter[]): Promise<void> {
        const tmp_params: any[] = []
        params.forEach(param => {
            tmp_params.push({ param_type: param.param_type, param_value: Parameter.writeValue(param.param_type, param.param_value) });
        });

        try {
            const response = await this.api.request("post", "app/upload_devs_params", {
                device_sn: this.device.device_sn,
                station_sn: this.device.station_sn,
                json: tmp_params
            });
            this.log.debug(`Device.setParameters(): Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult: StreamResponse = result.data;
                    this.log.debug("New Parameters successfully set.");
                    this.log.info(`Device.setParameters(): New Parameters set. response: ${JSON.stringify(dataresult)}`);
                } else
                    this.log.error(`Device.setParameters(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`Device.setParameters(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`Device.setParameters(): error: ${error}`);
        }
    }

    public getStateID(state: string, level = 2): string {
        switch(level) {
            case 0:
                return `${this.getStationSerial()}.${this.getStateChannel()}`
            case 1:
                return `${this.getStationSerial()}.${this.getStateChannel()}.${this.getSerial()}`
            default:
                if (state)
                    return `${this.getStationSerial()}.${this.getStateChannel()}.${this.getSerial()}.${state}`
                throw new Error("No state value passed.");
        }
    }

    public abstract getStateChannel(): string;

}

export class Camera extends Device {

    private is_streaming = false;

    public getStateChannel(): string {
        return "cameras";
    }

    public getLastCameraImageURL(): string {
        return this.device.cover_path;
    }

    public getMACAddress(): string {
        return this.device.wifi_mac;
    }

    public async startDetection(): Promise<void> {
        // Start camera detection.
        await this.setParameters([{ param_type: ParamType.DETECT_SWITCH, param_value: 1 }])
    }

    public async startStream(): Promise<string> {
        // Start the camera stream and return the RTSP URL.
        try {
            const response = await this.api.request("post", "web/equipment/start_stream", {
                device_sn: this.device.device_sn,
                station_sn: this.device.station_sn,
                proto: 2
            });
            this.log.debug(`Camera.startStream(): Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult: StreamResponse = result.data;
                    this.is_streaming = true;
                    this.log.info(`Livestream of camera ${this.device.device_sn} started.`);
                    return dataresult.url;
                } else
                    this.log.error(`Camera.startStream(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`Camera.startStream(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`Camera.startStream(): error: ${error}`);
        }
        return "";
    }

    public async stopDetection(): Promise<void> {
        // Stop camera detection.
        await this.setParameters([{ param_type: ParamType.DETECT_SWITCH, param_value: 0 }])
    }

    public async stopStream(): Promise<void> {
        // Stop the camera stream.
        try {
            const response = await this.api.request("post", "web/equipment/stop_stream", {
                device_sn: this.device.device_sn,
                station_sn: this.device.station_sn,
                proto: 2
            });
            this.log.debug(`Camera.stopStream(): Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    this.is_streaming = false;
                    this.log.info(`Livestream of camera ${this.device.device_sn} stopped.`);
                } else {
                    this.log.error(`Camera.stopStream(): Response code not ok (code: ${result.code} msg: ${result.msg})`);
                }
            } else {
                this.log.error(`Camera.stopStream(): Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`Camera.stopStream(): error: ${error}`);
        }
    }

    public isStreaming(): boolean {
        return this.is_streaming;
    }

    public async close(): Promise<void> {
        //TODO: Stop other things if implemented such as detection feature
        if (this.is_streaming)
            await this.stopStream();
    }

}

export class DoorbellCamera extends Camera {

}

export class FloodlightCamera extends Camera {

}

export class Sensor extends Device {

    public getStateChannel(): string {
        return "sensors";
    }

}

export class Lock extends Device {

    public getStateChannel(): string {
        return "locks";
    }

}

export class Keypad extends Device {

    public getStateChannel(): string {
        return "keypads";
    }

}

export class UnkownDevice extends Device {

    public getStateChannel(): string {
        return "unknown";
    }

}