import { Plugin, setIcon, PluginSettingTab, Setting, App } from 'obsidian';

declare module 'Obsidian' {
	interface WorkspaceRibbon {
		ribbonSettingEl: HTMLElement;

		makeRibbonItemButton(icon: string, tooltip: string, onClick: (e: MouseEvent) => void): HTMLElement;
	}

	interface App {
		setting: {
			open: () => void;
		};

		openVaultChooser(): void;

		openHelp(): void;
	}
}

interface MyPluginSettings {
	restoreVaultSwitcher: boolean;
	restoreVaultActionsHelp: boolean;
	restoreVaultActionsSettings: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	restoreVaultSwitcher: true,
	restoreVaultActionsHelp: true,
	restoreVaultActionsSettings: true,
};

export default class MyPlugin extends Plugin {
	ribbonMap: Map<string, HTMLElement> = new Map<string, HTMLElement>();
	settings: MyPluginSettings;
	styleElements: Record<string, HTMLStyleElement> = {};

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyPluginSettingTab(this.app, this));
		this.initVaultSwitcher();
		this.updateRibbonButtons();
	}

	onunload() {
		this.ribbonMap.forEach((value, key) => {
			value.detach();
		});
		this.ribbonMap.clear();
		Object.values(this.styleElements).forEach(el => el.remove());
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	initVaultSwitcher() {
		this.createRibbonButton('vault', 'Switch vault', 'vault', () => this.app.openVaultChooser());
		this.createRibbonButton('help', 'Help', 'help', () => this.app.openHelp());
		this.createRibbonButton('settings', 'Settings', 'lucide-settings', () => this.app.setting.open());
	}

	createRibbonButton(id: string, tooltip: string, icon: string, onClick: () => void) {
		const leftRibbon = this.app.workspace.leftRibbon;
		const button = leftRibbon.makeRibbonItemButton(icon, tooltip, (e) => {
			e.stopPropagation();
			onClick();
		});

		this.ribbonMap.set(id, button);
		leftRibbon.ribbonSettingEl.appendChild(button);
	}

	toggleRibbonItem(id: string, show: boolean) {
		const item = this.ribbonMap.get(id);
		if (item) {
			if (show) {
				this.app.workspace.leftRibbon.ribbonSettingEl.appendChild(item);
			} else {
				item.detach();
			}
		}
	}

	updateRibbonButtons() {
		this.toggleRibbonItem('vault', this.settings.restoreVaultSwitcher);
		this.toggleRibbonItem('help', this.settings.restoreVaultActionsHelp);
		this.toggleRibbonItem('settings', this.settings.restoreVaultActionsSettings);
		this.applyStyleSettings();
	}

	applyStyleSettings() {
		this.updateStyle('vault-profile', `
			body:not(.is-mobile) .workspace-split.mod-left-split .workspace-sidedock-vault-profile {
				display: ${this.settings.restoreVaultSwitcher && this.settings.restoreVaultActionsHelp && this.settings.restoreVaultActionsSettings ? 'none' : 'flex'};
			}
		`);
		this.updateStyle('vault-switcher', `
			body:not(.is-mobile) .workspace-split.mod-left-split .workspace-sidedock-vault-profile .workspace-drawer-vault-switcher {
				display: ${this.settings.restoreVaultSwitcher ? 'none' : 'flex'};
			}
		`);
		this.updateStyle('vault-actions-help', `
			body:not(.is-mobile) .workspace-split.mod-left-split .workspace-sidedock-vault-profile .workspace-drawer-vault-actions .clickable-icon:has(svg.svg-icon.help) {
				display: ${this.settings.restoreVaultActionsHelp ? 'none' : 'flex'};
			}
		`);
		this.updateStyle('vault-actions-settings', `
			body:not(.is-mobile) .workspace-split.mod-left-split .workspace-sidedock-vault-profile .workspace-drawer-vault-actions .clickable-icon:has(svg.svg-icon.lucide-settings) {
				display: ${this.settings.restoreVaultActionsSettings ? 'none' : 'flex'};
			}
		`);
	}

	updateStyle(id: string, css: string) {
		let styleEl = this.styleElements[id];
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = id;
			document.head.appendChild(styleEl);
			this.styleElements[id] = styleEl;
		}
		styleEl.textContent = css;
	}
}

class MyPluginSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h3', {text: 'Ribbon Button Settings'});

		this.addToggle('Vault Switcher', 'restoreVaultSwitcher', 'Show or hide the vault switcher button');
		this.addToggle('Help', 'restoreVaultActionsHelp', 'Show or hide the help button');
		this.addToggle('Settings', 'restoreVaultActionsSettings', 'Show or hide the settings button');
	}

	addToggle(name: string, settingKey: keyof MyPluginSettings, description: string) {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings[settingKey])
					.onChange(async (value) => {
						this.plugin.settings[settingKey] = value;
						await this.plugin.saveSettings();
						this.plugin.updateRibbonButtons();
					})
			);
	}
}
