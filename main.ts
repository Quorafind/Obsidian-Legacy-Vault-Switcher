import { Plugin, setIcon } from 'obsidian';

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

export default class MyPlugin extends Plugin {
	ribbonMap: Map<string, HTMLElement> = new Map<string, HTMLElement>();

	async onload() {
		this.initVaultSwitcher();
	}

	onunload() {
		this.ribbonMap.forEach((value, key) => {
			value.detach();
		});
		this.ribbonMap.clear();
	}

	initVaultSwitcher() {
		const leftRibbon = this.app.workspace.leftRibbon;
		const ribbonVaultSwitchEl = leftRibbon.makeRibbonItemButton("vault", 'Switch vault', (e) => {
				e.stopPropagation();
				this.app.openVaultChooser();
			}
		);

		ribbonVaultSwitchEl.addEventListener("mouseover", () => {
				setIcon(ribbonVaultSwitchEl, "open-vault");
			}
		);
		ribbonVaultSwitchEl.addEventListener("mouseout", () => {
				setIcon(ribbonVaultSwitchEl, "vault");
			}
		);
		leftRibbon.ribbonSettingEl.appendChild(ribbonVaultSwitchEl);

		const ribbonHelpEl = leftRibbon.makeRibbonItemButton("help", 'Help', (e) => {
				e.stopPropagation();
				app.openHelp();
			}
		);
		leftRibbon.ribbonSettingEl.appendChild(ribbonHelpEl);

		const ribbonSettingEl = leftRibbon.makeRibbonItemButton("lucide-settings", 'Settings', (e) => {
				e.stopPropagation();
				app.setting.open();
			}
		);
		leftRibbon.ribbonSettingEl.appendChild(ribbonSettingEl);

		this.ribbonMap.set("vault", ribbonVaultSwitchEl);
		this.ribbonMap.set("help", ribbonHelpEl);
		this.ribbonMap.set("lucide-settings", ribbonSettingEl);
	}

}
