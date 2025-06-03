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

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

let CHECK_CMD = ['/home/mylo/rust/coolbirthday/target/release/coolbirthday', 'check'];
let LIST_CMD = ['/home/mylo/rust/coolbirthday/target/release/coolbirthday', 'list'];

export default class CoolBirthdayExtension extends Extension {
    enable() {

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        const lbl_icon = new St.Label({ text: '🎈' });
        this._indicator.add_child(lbl_icon);



        const info_item = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        this._lbl_info = new St.Label({ text: 'checking...' });
        info_item.add_child(this._lbl_info);
        this._indicator.menu.addMenuItem(info_item);


        const btn_list = new PopupMenu.PopupMenuItem('List Birthdays');
        btn_list.connect('activate', () => this._cmdPopup(LIST_CMD));
        this._indicator.menu.addMenuItem(btn_list);



        this._indicator.menu.connect('open-state-changed', (_menu, isOpen) => {
            if (isOpen)
                this._update_info_lbl(CHECK_CMD);
        });

        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }

    _update_info_lbl(cmd) {
        const proc = new Gio.Subprocess({
            argv: cmd,
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

    _cmdPopup(cmd) {
        let msg = '';
        const proc = new Gio.Subprocess({
            argv: cmd,
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        proc.init(null);
        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                const [, stdout] = proc.communicate_utf8_finish(res);
                if (stdout)
                    msg = stdout.trim();

                    const dialog = new ModalDialog.ModalDialog({ styleClass: null });

                    const sv_msg = new St.ScrollView({
                        height: 300,
                        hscrollbar_policy: 2,
                        vscrollbar_policy: 2,
                        enable_mouse_scrolling: true
                    });

                    const vbox = new St.BoxLayout({
                        vertical: true
                    });

                    const lbl_msg = new St.Label({
                        text: msg,
                        style_class: 'dialog-message'
                    });

                    vbox.add_child(lbl_msg);
                    sv_msg.add_child(vbox);
                    dialog.contentLayout.add_child(sv_msg);

                    dialog.setButtons([
                        {
                            label: 'Ok',
                            action: () => dialog.close(),
                            key: Clutter.KEY_Escape,
                        },
                    ]);

                    dialog.open();
            } catch (e) {
                logError(e, 'Erreur lors de l’exécution de la commande');
                msg = 'Erreur';
            }
        });
    }
}