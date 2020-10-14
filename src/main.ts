import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as errors from './common/errors';
import * as uuid from './common/uuid';
import { networkInterfaces } from 'os';
import { TernarySearchTree } from './common/map';
import { getMac } from './node/macAddress';




function createWindow() {
	
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			webSecurity: false
		},
		width: 800,
	});

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`);

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	console.log(virtualMachineHint.value());
	console.log('dom loaded')
	const vmPercent = virtualMachineHint.value();
	global.sharedObj = {
		result: vmPercent,
		resultVM: (vmPercent === 1) ? 'VM' : 'NOT VM'
	};
	/* document.getElementById('result').innerText = vmPercent.toString();
	document.getElementById('result-vm').innerText = (vmPercent === 1) ? 'VM' : 'NOT VM' ; */
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
	createWindow();

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
export const virtualMachineHint: { value(): number } = new class {

	private _virtualMachineOUIs?: TernarySearchTree<string, boolean>;
	private _value?: number;
	private macAddresses = '';

	private _isVirtualMachineMacAdress(mac: string): boolean {
		this.macAddresses += mac + '<br>';
		if (!this._virtualMachineOUIs) {
			this._virtualMachineOUIs = TernarySearchTree.forStrings<boolean>();

			// dash-separated
			this._virtualMachineOUIs.set('00-50-56', true);
			this._virtualMachineOUIs.set('00-0C-29', true);
			this._virtualMachineOUIs.set('00-05-69', true);
			this._virtualMachineOUIs.set('00-03-FF', true);
			this._virtualMachineOUIs.set('00-1C-42', true);
			this._virtualMachineOUIs.set('00-16-3E', true);
			this._virtualMachineOUIs.set('08-00-27', true);
			this._virtualMachineOUIs.set('00-15-5D', true); // test hyperv

			// colon-separated
			this._virtualMachineOUIs.set('00:50:56', true);
			this._virtualMachineOUIs.set('00:0C:29', true);
			this._virtualMachineOUIs.set('00:05:69', true);
			this._virtualMachineOUIs.set('00:03:FF', true);
			this._virtualMachineOUIs.set('00:1C:42', true);
			this._virtualMachineOUIs.set('00:16:3E', true);
			this._virtualMachineOUIs.set('08:00:27', true);
			this._virtualMachineOUIs.set('00:15:5D', true); // test hyperv
		}
		return !!this._virtualMachineOUIs.findSubstr(mac);
	}

	value(): number {
		if (this._value === undefined) {
			let vmOui = 0;
			let interfaceCount = 0;

			const interfaces = networkInterfaces();
			for (let name in interfaces) {
				if (Object.prototype.hasOwnProperty.call(interfaces, name)) {
					for (const { mac, internal } of interfaces[name]) {
						if (!internal) {
							interfaceCount += 1;
							if (this._isVirtualMachineMacAdress(mac.toUpperCase())) {
								vmOui += 1;
							}
						}
					}
				}
			}
			this._value = interfaceCount > 0
				? vmOui / interfaceCount
				: 0;
		}

		global.mac = this.macAddresses;

		return this._value;
	}
};

let machineId: Promise<string>;
export async function getMachineId(): Promise<string> {
	if (!machineId) {
		machineId = (async () => {
			const id = await getMacMachineId();

			return id || uuid.generateUuid(); // fallback, generate a UUID
		})();
	}

	return machineId;
}

async function getMacMachineId(): Promise<string | undefined> {
	try {
		const crypto = await import('crypto');
		const macAddress = await getMac();
		return crypto.createHash('sha256').update(macAddress, 'utf8').digest('hex');
	} catch (err) {
		errors.onUnexpectedError(err);
		return undefined;
	}
}