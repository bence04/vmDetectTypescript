
import * as errors from './common/errors';
import * as uuid from './common/uuid';
import { networkInterfaces } from 'os';
import { TernarySearchTree } from './common/map';
import { getMac } from './node/macAddress';

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const vmPercent = virtualMachineHint.value();
  document.getElementById('result').innerText = vmPercent.toString();
  document.getElementById('result-vm').innerText = (vmPercent === 1) ? 'VM' : 'NOT VM' ;
});

export const virtualMachineHint: { value(): number } = new class {

	private _virtualMachineOUIs?: TernarySearchTree<string, boolean>;
	private _value?: number;

	private _isVirtualMachineMacAdress(mac: string): boolean {
		document.getElementById('mac').innerHTML += mac + '<br>';
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