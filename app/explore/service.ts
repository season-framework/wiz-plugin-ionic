import MonacoEditor from "src/app/core.editor.monaco/core.editor.monaco.component";
import PageInfoEditor from "src/app/workspace.editor.ngapp.page/workspace.editor.ngapp.page.component";
import AppInfoEditor from "src/app/workspace.editor.ngapp.info/workspace.editor.ngapp.info.component";
import ImageViewer from "src/app/workspace.editor.image/workspace.editor.image.component";
import ReadmeViewer from "src/app/workspace.editor.readme/workspace.editor.readme.component";
const DEFAULT_COMPONENT = `import { OnInit, Input } from '@angular/core';

export class Replacement implements OnInit {
    @Input() title: any;

    public async ngOnInit() {
    }
}`.replace('Replacement', 'Component');

export class FileEditor {
    public APP_ID: string = "ionic.app.explore";
    constructor(private service: any, private wiz: any, private event: any) {
        if (!this.event) this.event = {};
    }

    public create(path: string, force = false) {
        let wiz = this.wiz.app(this.APP_ID);
        let eventHanlder = async (name, appinfo) => {
            if (this.event[name]) await this.event[name](appinfo);
        }

        let viewtypes: any = {
            'html': { viewref: MonacoEditor, config: { monaco: { language: 'html' } } },
            'md': { viewref: MonacoEditor, config: { monaco: { language: 'markdown' } } },
            'ts': { viewref: MonacoEditor, config: { monaco: { language: 'typescript', renderValidationDecorations: 'off' } } },
            'js': { viewref: MonacoEditor, config: { monaco: { language: 'javascript' } } },
            'mjs': { viewref: MonacoEditor, config: { monaco: { language: 'javascript' } } },
            'cjs': { viewref: MonacoEditor, config: { monaco: { language: 'javascript' } } },
            'css': { viewref: MonacoEditor, config: { monaco: { language: 'css' } } },
            'scss': { viewref: MonacoEditor, config: { monaco: { language: 'scss' } } },
            'json': { viewref: MonacoEditor, config: { monaco: { language: 'json' } } },
            'pug': { viewref: MonacoEditor, config: { monaco: { language: 'pug' } } },
            'py': { viewref: MonacoEditor, config: { monaco: { language: 'python' } } },
            'env': { viewref: MonacoEditor, config: { monaco: { language: 'shell' } } },
        };

        let extension = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
        const imgExt = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'ico', 'webp'];
        const IS_IMG = imgExt.includes(extension);
        if (IS_IMG)
            viewtypes[extension] = { viewref: ImageViewer, config: {} };

        if (!viewtypes[extension] && force) {
            viewtypes.__text__ = { viewref: MonacoEditor, config: { monaco: { language: 'plaintext' } } };
            extension = "__text__";
        }
        if (!viewtypes[extension]) {
            return;
        }

        let { viewref, config } = viewtypes[extension];
        let editor = this.service.editor.create({
            component_id: this.APP_ID,
            path: path,
            title: path.split("/")[path.split("/").length - 1],
            unique: true,
            current: 0
        });

        if (extension == 'md') {
            editor.create({
                name: 'viewer',
                viewref: ReadmeViewer,
                path: path
            }).bind('data', async (tab) => {
                let { code, data } = await wiz.call('read', { path: path });
                if (code != 200) return {};
                return { data };
            });
        }

        editor.create({
            name: 'editor',
            viewref: viewref,
            path: path,
            config: config
        }).bind('data', async (tab) => {
            if (IS_IMG) return { data: path };
            let { code, data } = await wiz.call('read', { path: path });
            if (code != 200) return {};
            return { data };
        }).bind('update', async (tab) => {
            let data = await tab.data();
            let code = data.data;
            let res = await wiz.call("update", { path, code });
            if (res.code != 200) return;

            await eventHanlder('updated', path);
            this.service.statusbar.process("build project...");

            res = await wiz.call('build', { path: path });
            if (res.code == 200) this.service.statusbar.info("build finish", 5000);
            else this.service.statusbar.error("error on build");
        });

        return editor;
    }
}

export class AppEditor {
    public APP_ID: string = "ionic.app.explore";
    constructor(private service: any, private wiz: any, private event: any) {
        if (!this.event) this.event = {};
    }

    public create(app: any) {
        let binding = this.service.event.load(this.APP_ID);
        let wiz = this.wiz.app(this.APP_ID);
        let path = "src/app/" + (app.id ? app.id : 'new');
        let mode = app.id ? app.id.split(".")[0] : app.mode;
        if (!['page', 'component', 'layout'].includes(mode)) return;

        let eventHanlder = async (name, appinfo) => {
            if (this.event[name]) await this.event[name](appinfo);
        }

        let editor = this.service.editor.create(app.id ? {
            component_id: this.APP_ID,
            path: path,
            title: app.title ? app.title : app.namespace,
            subtitle: app.id,
            current: 1
        } : {
            component_id: this.APP_ID,
            unique: true,
            title: 'new',
        });

        editor.namespace_prefix = mode + ".";

        let move = async (name, rename) => {
            if (name == rename) {
                return false;
            }

            let path = "src/app/" + name;
            let to = "src/app/" + rename;

            let { code } = await wiz.call("move", { path, to });
            if (code !== 200) {
                await this.service.alert.error("Error: rename app");
                return false;
            }

            return true;
        }

        let update = async (path: string, code: string, event: boolean = true) => {
            let appinfo = await editor.tab(0).data();
            let res = await wiz.call("update", { path, code });
            if (res.code == 200) this.service.statusbar.process("updated");
            else return false;

            let upath = "src/app/" + appinfo.id;
            editor.modify({ path: upath, title: appinfo.title ? appinfo.title : appinfo.namespace, subtitle: appinfo.id });

            for (let i = 0; i < editor.tabs.length; i++) {
                let topath: any = editor.tabs[i].path + '';
                topath = topath.split("/");
                topath[2] = appinfo.id;
                topath = topath.join("/");
                editor.tabs[i].move(topath);
            }

            if (event) {
                if (binding) {
                    let node = binding.find(upath);
                    if (node) {
                        node.path = node.path.split("/")
                        node.path[2] = appinfo.id;
                        node.path = node.path.join("/");
                        node.name = appinfo.title;
                        await binding.refresh(node.parent);
                    } else {
                        node = binding.find('src/app/' + appinfo.mode);
                        await binding.refresh(node);
                    }
                }
                await eventHanlder('updated', appinfo);
            }
            return true;
        }

        let build = async (path: any) => {
            this.service.statusbar.process("build project...");
            let appinfo = await editor.tab(0).data();
            let res = await wiz.call('build', { path });
            if (res.code != 200) {
                this.service.statusbar.error("Error on build");
                return false;
            }
            await eventHanlder('builded', appinfo);
        }

        let createApp = async (appinfo: any) => {
            let id = appinfo.mode + "." + appinfo.namespace;
            let res = await wiz.call("exists", { path: 'src/app/' + id });
            if (res.data) return await this.service.alert.error("namespace already exists");
            appinfo.id = id;
            let path = "src/app/" + id + "/app.json";
            let code = JSON.stringify(appinfo, null, 4);
            await update(path, code, false);
            path = "src/app/" + id + "/view.pug";
            await update(path, "div test", false);
            path = "src/app/" + id + "/view.ts";
            await update(path, DEFAULT_COMPONENT);

            editor.close();

            await build("src/app/" + id + "/app.json");
            return true;
        }

        let updateApp = async (appinfo: any) => {
            let name = appinfo.id + '';
            let rename = appinfo.mode + "." + appinfo.namespace;

            if (name != rename) {
                let res = await move(name, rename);
                if (!res) {
                    await this.service.alert.error("invalidate namespace");
                    return false;
                }
            }

            appinfo.id = rename;

            let path = "src/app/" + appinfo.id + "/app.json";
            let code = JSON.stringify(appinfo, null, 4);
            await update(path, code);
            await build(path);
            return true;
        }

        editor.create(app.id ? {
            name: 'info',
            viewref: mode == 'page' ? PageInfoEditor : AppInfoEditor,
            path: path + "/app.json"
        } : {
            name: 'info',
            viewref: mode == 'page' ? PageInfoEditor : AppInfoEditor
        }).bind('data', async (tab) => {
            if (app.id) {
                let { code, data } = await wiz.call('read', { path: tab.path });
                if (code != 200) return {};
                data = JSON.parse(data);
                data.mode = mode;
                return data;
            } else {
                return JSON.parse(JSON.stringify(app));
            }
        }).bind('update', async (tab) => {
            let appinfo = await tab.data();
            let check = /^[a-z0-9.]+$/.test(appinfo.namespace);
            if (!check) return await this.service.alert.error("invalidate namespace");
            if (appinfo.namespace.length < 3) return await this.service.alert.error("namespace at least 3 alphabets");

            if (app.id)
                await updateApp(appinfo);
            else
                await createApp(appinfo);
        });

        if (app.id) {
            let tabs: any = [
                editor.create({
                    name: 'Pug',
                    viewref: MonacoEditor,
                    path: path + "/view.pug",
                    config: { monaco: { language: 'pug' } }
                }),
                editor.create({
                    name: 'Component',
                    viewref: MonacoEditor,
                    path: path + "/view.ts",
                    config: { monaco: { language: 'typescript', renderValidationDecorations: 'off' } }
                }),
                editor.create({
                    name: 'SCSS',
                    viewref: MonacoEditor,
                    path: path + "/view.scss",
                    config: { monaco: { language: 'scss' } }
                }),
                editor.create({
                    name: 'API',
                    viewref: MonacoEditor,
                    path: path + "/api.ts",
                    config: { monaco: { language: 'javascript' } }
                }),
            ];

            for (let i = 0; i < tabs.length; i++) {
                tabs[i].bind('data', async (tab) => {
                    let { code, data } = await wiz.call('read', { path: tab.path });
                    if (code != 200) data = '';
                    return { data };
                }).bind('update', async (tab) => {
                    let path = tab.path;
                    let code = await tab.data();
                    await update(path, code.data);
                    await build(path);
                });
            }

            editor.bind("delete", async () => {
                let appinfo = await editor.tab(0).data();
                let res = await this.service.alert.show({ title: 'Delete App', message: 'Are you sure remove "' + appinfo.title + '"?', action_text: "Delete", action_class: "btn-danger" });
                if (res !== true) return;
                let targets = await this.service.editor.find(editor);
                for (let i = 0; i < targets.length; i++)
                    await targets[i].close();
                await wiz.call("delete", { path: 'src/app/' + appinfo.id });

                if (binding) {
                    let node = binding.find('src/app/' + appinfo.mode);
                    if (node) await binding.refresh(node);
                }

                await eventHanlder('deleted', appinfo);
                await build(path);
            });

            editor.bind("clone", async (location: number = -1) => {
                let appinfo = await editor.tab(0).data();
                let clone = await this.create(appinfo);
                await clone.open(location);
            });
        }

        return editor;
    }
}

export class Workspace {
    constructor(private service: any, private wiz: any) { }

    public AppEditor(app: any, event: any = {}) {
        return new AppEditor(this.service, this.wiz, event).create(app);
    }

    public FileEditor(path: string, event: any = {}, force: Boolean = false) {
        return new FileEditor(this.service, this.wiz, event).create(path, force);
    }
}

export default Workspace;
