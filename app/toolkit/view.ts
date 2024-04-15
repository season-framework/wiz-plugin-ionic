import { OnInit } from '@angular/core';
import { Service } from '@wiz/service/service';

export class Component implements OnInit {
    public loading = true;

    constructor(private service: Service) { }

    public async ngOnInit() {
        await this.loader(true);
        await this.getInstalled();
        await this.loader(false);
    }

    public async loader(status) {
        this.loading = status;
        await this.service.render();
    }

    public devices = [];
    public device = "";
    public async getDevices() {
        const { code, data } = await wiz.call("devices");
        if (code !== 200) return;
        this.devices = data;
        if (this.device === "" && data.length > 0) this.device = this.devices[0].id;
        await this.service.render();
    }

    public status = this.emptyStatus();
    public hide = {
        android: true,
        ios: true,
    };

    private emptyStatus() {
        return {
            android: false,
            ios: false,
            java: false,
            adb: false,
            java_home: false,
            android_home: false,
            idevice: false,
            pod: false,
        };
    }

    public async getInstalled() {
        const { code, data } = await wiz.call("installed");
        if (code !== 200) return;
        this.status = {
            ...this.status,
            ...data,
        };
    }

    public async getStatus(type) {
        const { code, data } = await wiz.call(`${type}_status`);
        if (code !== 200) return;
        this.status = {
            ...this.status,
            ...data,
        };
        await this.service.render();
    }

    public async showStatus(type) {
        await this.getStatus(type);
        this.hide[type] = false;
        await this.service.render();
    }

    public showAddAndroid() {
        const { android } = this.status;
        if (android) return false;
        return true;
    }

    public disabledAddAndroid() {
        const { java, adb, java_home, android_home } = this.status;
        if (java && adb && java_home && android_home) return false;
        return true;
    }

    public showAddIOS() {
        const { ios } = this.status;
        if (ios) return false;
        return true;
    }

    public disabledAddIOS() {
        const { idevice, pod } = this.status;
        if (idevice && pod) return false;
        return true;
    }

    public disabledInstall() {
        if (!this.device) return true;
        if (this.device === "") return true;
        const device = this.devices.find(it => it.id === this.device);
        if (device.type === "android" && this.disabledAddAndroid()) return true;
        if (device.type === "ios" && this.disabledAddIOS()) return true;
        return false;
    }

    public async appInstall() {
        if (this.device === "") return;
        const body = this.devices.find(it => it.id === this.device);
        await this.loader(true);
        await wiz.call("ionic_start", body);
        await this.loader(false);
    }

    public async addAndroid() {
        await this.loader(true);
        await wiz.call("add_android");
        await this.loader(false);
    }

    public async addIOS() {
        await this.loader(true);
        await wiz.call("add_ios");
        await this.loader(false);
    }

    public async rebuild() {
        let res = await this.service.alert.show({ title: 'Rebuild', message: 'Are you sure to rebuild this project?', action: "rebuild", action_class: "btn-danger" });
        if (!res) return;
        await this.loader(true);
        await wiz.call("rebuild");
        await this.loader(false);
    }
}