import { API } from "./api";
import { AlarmMode, DeviceType, GuardMode, ParamType } from "./types";
import { DskKeyResponse, HubResponse, ResultResponse } from "./models"
import { Parameter } from "./parameter";
import { ParameterArray } from "./interfaces";
import { P2PInterface } from "./../p2p/interfaces";
import { DiscoveryP2PClientProtocol } from "../p2p/protocol";
import { EufyP2PClientProtocol } from "../p2p/session";
import { CommandType } from "../p2p/types";
import { isPrivateIp } from "../p2p/utils";
import { Address, CmdCameraInfoResponse } from "../p2p/models";
import { EventEmitter } from "events";

export class Station extends EventEmitter implements P2PInterface {

    private api: API;
    private hub: HubResponse;
    private log: ioBroker.Logger;

    private dsk_key = "";
    private dsk_expiration: Date|null = null;

    private p2p_session: EufyP2PClientProtocol|null = null;
    private parameters: ParameterArray = {};

    constructor(api: API, hub: HubResponse) {
        super();
        this.api = api;
        this.hub = hub;
        this.log = api.getLog();
        this.loadParameters();
    }

    public getStateID(state: string, level = 2): string {
        switch(level) {
            case 0:
                return `${this.getSerial()}`
            case 1:
                return `${this.getSerial()}.${this.getStateChannel()}`
            default:
                if (state)
                    return `${this.getSerial()}.${this.getStateChannel()}.${state}`
                throw new Error("No state value passed.");
        }
    }

    public getStateChannel(): string {
        return "station";
    }

    public update(hub: HubResponse):void {
        this.hub = hub;
        this.hub.params.forEach(param => {
            if (this.parameters[param.param_type] != param.param_value) {
                this.parameters[param.param_type] = Parameter.readValue(param.param_type, param.param_value);
                this.emit("parameter",this, param.param_type, param.param_value);
            }
        });
    }

    public isStation(): boolean {
        return this.hub.device_type == DeviceType.STATION;
    }

    public isDeviceStation(): boolean {
        return this.hub.device_type != DeviceType.STATION;
    }

    public getDeviceType(): number {
        return this.hub.device_type;
    }

    public getHardwareVersion(): string {
        return this.hub.main_hw_version;
    }

    public getMACAddress(): string {
        return this.hub.wifi_mac;
    }

    public getModel(): string {
        return this.hub.station_model;
    }

    public getName(): string {
        return this.hub.station_name;
    }

    public getSerial(): string {
        return this.hub.station_sn;
    }

    public getSoftwareVersion(): string {
        return this.hub.main_sw_version;
    }

    public getIPAddress(): string {
        return this.hub.ip_addr;
    }

    private loadParameters(): void {
        this.hub.params.forEach(param => {
            this.parameters[param.param_type] = Parameter.readValue(param.param_type, param.param_value);
        });
        this.log.debug(`Station.loadParameters(): station_sn: ${this.getSerial()} parameters: ${JSON.stringify(this.parameters)}`);
    }

    public getParameter(param_type: number): string {
        return this.parameters[param_type];
    }

    private async getDSKKeys(): Promise<void> {
        try {
            const response = await this.api.request("post", "app/equipment/get_dsk_keys", {
                station_sns: [this.getSerial()]
            });
            this.log.debug(`Station.getDSKKeys(): station: ${this.getSerial()} Response: ${JSON.stringify(response.data)}`);

            if (response.status == 200) {
                const result: ResultResponse = response.data;
                if (result.code == 0) {
                    const dataresult: DskKeyResponse = result.data;
                    dataresult.dsk_keys.forEach(key => {
                        if (key.station_sn == this.getSerial()) {
                            this.dsk_key = key.dsk_key;
                            this.dsk_expiration = new Date(key.expiration * 1000);
                            this.log.debug(`Station.getDSKKeys(): dsk_key: ${this.dsk_key} dsk_expiration: ${this.dsk_expiration}`);
                        }
                    });
                } else
                    this.log.error(`Station.getDSKKeys(): station: ${this.getSerial()} Response code not ok (code: ${result.code} msg: ${result.msg})`);
            } else {
                this.log.error(`Station.getDSKKeys(): station: ${this.getSerial()} Status return code not 200 (status: ${response.status} text: ${response.statusText}`);
            }
        } catch (error) {
            this.log.error(`Station.getDSKKeys(): station: ${this.getSerial()} error: ${error}`);
        }
    }

    public isConnected(): boolean {
        if (this.p2p_session)
            return this.p2p_session.isConnected();
        return false;
    }

    public close(): void {
        this.log.info(`Disconnect from station ${this.getSerial()}.`);
        if (this.p2p_session) {
            this.p2p_session.close();
            this.p2p_session = null;
        }
    }

    public async connect(): Promise<boolean> {
        if (this.dsk_key == "" || (this.dsk_expiration && (new Date()).getTime() >= this.dsk_expiration.getTime())) {
            this.log.debug(`Station.connect(): station: ${this.getSerial()} DSK keys not present or expired, get/renew it. (dsk_expiration: ${this.dsk_expiration})`);
            await this.getDSKKeys();
        }

        const proto = new DiscoveryP2PClientProtocol(this.log);
        proto.setDSKKey(this.dsk_key);
        proto.setP2PDid(this.hub.p2p_did);
        const addrs = await proto.lookup();
        this.log.debug("Station.connect(): Discovered station addresses: " + addrs.length);
        if (addrs.length > 0) {
            let local_addr: Address|null = null;
            for (const addr of addrs) {
                this.log.debug("Station.connect(): Discovered station addresses: host: " + addr.host + " port: " + addr.port);
                if (isPrivateIp(addr.host)) {
                    local_addr = addr;
                }
            }
            if (local_addr) {
                this.p2p_session = new EufyP2PClientProtocol(local_addr, this.hub.p2p_did, this.hub.member.action_user_id, this.log);
                this.p2p_session.on("alarm_mode", (mode) => this.onAlarmMode(mode));
                this.p2p_session.on("camera_info", (camera_info) => this.onCameraInfo(camera_info));

                this.log.info(`Connect to station ${this.getSerial()} on host ${local_addr.host} and port ${local_addr.port}.`);
                return await this.p2p_session.connect();
            } else {
                this.log.error(`No local address discovered for station ${this.getSerial()}.`);
            }
        } else {
            this.log.error(`Discovering of connect details for station ${this.getSerial()} failed. Impossible to establish connection!`);
        }
        return false;
    }

    public async setGuardMode(mode: GuardMode): Promise<void> {
        this.log.silly("Station.setGuardMode(): ");
        if (!this.p2p_session || !this.p2p_session.isConnected) {
            this.log.debug(`Station.setGuardMode(): P2P connection to station ${this.getSerial()} not present, establish it.`);
            await this.connect();
        }
        if (this.p2p_session) {
            if (this.p2p_session.isConnected()) {
                this.log.debug(`Station.setGuardMode(): P2P connection to station ${this.getSerial()} present, send command mode: ${mode}.`);
                await this.p2p_session.sendCommandWithInt(CommandType.CMD_SET_ARMING, mode);
            }
        }
    }

    public async getCameraInfo(): Promise<void> {
        this.log.silly("Station.getCameraInfo(): ");
        if (!this.p2p_session || !this.p2p_session.isConnected) {
            this.log.debug(`Station.getCameraInfo(): P2P connection to station ${this.getSerial()} not present, establish it.`);
            await this.connect();
        }
        if (this.p2p_session) {
            if (this.p2p_session.isConnected()) {
                this.log.debug(`Station.getCameraInfo(): P2P connection to station ${this.getSerial()} present, get camera info.`);
                await this.p2p_session.sendCommandWithInt(CommandType.CMD_CAMERA_INFO, 255);
            }
        }
    }

    private onAlarmMode(mode: AlarmMode): void {
        this.log.info(`Alarm mode for station ${this.getSerial()} changed to: ${AlarmMode[mode]}`);
        this.parameters[ParamType.SCHEDULE_MODE] = mode.toString();
        this.emit("parameter", this, ParamType.SCHEDULE_MODE, mode.toString());
    }

    private onCameraInfo(camera_info: CmdCameraInfoResponse): void {
        //TODO: Finish implementation
        this.log.debug(`Station.onCameraInfo(): station: ${this.getSerial()} camera_info: ${JSON.stringify(camera_info)}`);
    }

    public getParameters(): ParameterArray {
        return this.parameters;
    }

}