/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';
import St from 'gi://St';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

let CHECK_CMD = ['/home/mylo/rust/coolbirthday/target/release/coolbirthday', 'check'];

export default class CoolBirthdayExtension extends Extension {
    enable() {

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        const lbl_icon = new St.Label({ text: '🎈' });
        const icon = new St.Icon({
            icon_name: 'appointment-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(lbl_icon);



        const info_item = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        this._lbl_info = new St.Label({ text: 'checking...' });
        info_item.add_child(this._lbl_info);
        this._indicator.menu.addMenuItem(info_item);



        this._indicator.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen)
                this._run_command(CHECK_CMD);
        });

        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }

    _run_command(argv) {
        const proc = new Gio.Subprocess({
            argv: argv,
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        proc.init(null);
        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                const [, stdout] = proc.communicate_utf8_finish(res);
                if (this._lbl_info && stdout)
                    this._lbl_info.text = stdout.trim();
            } catch (e) {
                logError(e, 'Erreur lors de l’exécution de la commande');
                if (this._lbl_info)
                    this._lbl_info.text = 'Erreur';
            }
        });
    }
}
