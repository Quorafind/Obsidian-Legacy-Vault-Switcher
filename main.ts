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
	restoreVaultSwitcherMove: boolean;
	restoreVaultFileCount: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	restoreVaultSwitcher: false,
	restoreVaultActionsHelp: true,
	restoreVaultActionsSettings: true,
	restoreVaultSwitcherMove: true,
	restoreVaultFileCount: false,
};

export default class MyPlugin extends Plugin {
	ribbonMap: Map<string, HTMLElement> = new Map<string, HTMLElement>();
	settings: MyPluginSettings;
	styleElements: Record<string, HTMLStyleElement> = {};

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyPluginSettingTab(this.app, this));
		this.initVaultSwitcher();
		this.app.workspace.onLayoutReady(() => {
			this.updateRibbonButtons();

			this.app.vault.on("create", this.toggleFileChange.bind(this));
			this.app.vault.on("delete", this.toggleFileChange.bind(this));
		})
	}

	onunload() {
		this.ribbonMap.forEach((value, key) => {
			value.detach();
		});
		this.ribbonMap.clear();
		Object.values(this.styleElements).forEach(el => el.remove());

		this.toggleVaultSwitcherMove(false);
		this.toggleVaultFileCount(false);

		this.app.vault.off("create", this.toggleFileChange.bind(this));
		this.app.vault.off("delete", this.toggleFileChange.bind(this));
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

	toggleVaultSwitcherMove(move: boolean) {
		//@ts-ignore
		const leftContainerEl = this.app.workspace.leftSplit.containerEl;
		if(move) {
			const vaultSwitcher = leftContainerEl.querySelector(".workspace-sidedock-vault-profile .workspace-drawer-vault-switcher");
			const navContainer = leftContainerEl.querySelector(".nav-files-container");
			if(vaultSwitcher && navContainer) {
				navContainer.parentElement && navContainer.parentElement.insertBefore(vaultSwitcher, navContainer);
			}
		} else {
			const vaultSwitcher = leftContainerEl.querySelector(".mod-top-left-space .workspace-drawer-vault-switcher");
			const vaultProfile = leftContainerEl.querySelector(".workspace-sidedock-vault-profile");
			vaultProfile && vaultSwitcher && vaultProfile.prepend(vaultSwitcher);
		}
	}

	toggleVaultFileCount(show: boolean) {
		//@ts-ignore
		const leftContainerEl = this.app.workspace.leftSplit.containerEl;
		const vaultSwitcher = leftContainerEl.querySelector(".workspace-drawer-vault-switcher");
		if (show) {
			//@ts-ignore get file count
			const total = this.app.vault.getRoot().getFileCount();
			vaultSwitcher.setAttribute("data-count", String(total));
		} else {
			vaultSwitcher.removeAttribute("data-count");
		}
	}

	toggleFileChange() {
		this.toggleVaultFileCount(this.settings.restoreVaultFileCount);
	}

	updateRibbonButtons() {
		this.toggleRibbonItem('vault', this.settings.restoreVaultSwitcher);
		this.toggleRibbonItem('help', this.settings.restoreVaultActionsHelp);
		this.toggleRibbonItem('settings', this.settings.restoreVaultActionsSettings);
		this.toggleVaultSwitcherMove(this.settings.restoreVaultSwitcherMove);
		this.toggleVaultFileCount(this.settings.restoreVaultFileCount);
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
		this.updateStyle('vault-switcher-move', this.settings.restoreVaultSwitcherMove ? `
			body:not(.is-mobile) .workspace-split.mod-left-split .workspace-sidedock-vault-profile{
				${this.settings.restoreVaultActionsHelp && this.settings.restoreVaultActionsSettings ?'display: none!important;':''}
			}
			body:not(.is-mobile) .workspace-split.mod-left-split .mod-top-left-space .workspace-drawer-vault-switcher {
				display: flex;
				padding-left: var(--size-2-3);
				padding-top: var(--size-2-3);
				padding-bottom: var(--size-2-3);
				gap: var(--size-2-3);
				color: var(--vault-profile-color);
				background-color: var(--background-secondary);
			}
			body:not(.is-mobile) .workspace-split.mod-left-split .mod-top-left-space .workspace-drawer-vault-switcher:hover {
				color: var(--vault-profile-color-hover);
				background-color: var(--background-modifier-hover);
			}
			body:not(.is-mobile) .workspace-split.mod-left-split .mod-top-left-space .workspace-drawer-vault-switcher.has-active-menu {
				background-color: var(--background-modifier-hover);
			}
		` : ``);
		this.updateStyle('vault-file-count', this.settings.restoreVaultFileCount ? `
			body:not(.is-mobile) .workspace-split.mod-left-split .workspace-drawer-vault-switcher::after {
				position: absolute;
				right: 0;
				content: attr(data-count);
				display: inline-block;
				font-size: calc(100% * 0.8);
				margin-right: 20px;
				padding: 2px 0;
				transition: opacity 100ms ease-in-out;
			}
		` : ``);
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
		this.addToggle('Move Vault Switcher to the top', 'restoreVaultSwitcherMove', 'Moving the Vault Switcher to the top of the File Explorer.');
		this.addToggle('Show file count on Vault Switcher', 'restoreVaultFileCount', 'Display the number of files on the right side of the Vault Switcher');
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
