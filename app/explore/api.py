import os
import platform
import math
import json
import time
import datetime
import shutil
import zipfile
import tempfile
import subprocess

Code = wiz.ide.plugin.model("src/code")
builder = wiz.ide.plugin.model("builder")
fs = wiz.project.fs()

def layout():
    mode = "layout"
    apps = fs.ls("src/app")
    res = []
    for app in apps:
        app = fs.read.json(f"src/app/{app}/app.json", dict(mode='none'))
        if app['mode'] == mode:
            res.append(app)
    wiz.response.status(200, res)

def tree():
    def driveItem(path, root=None):
        def convert_size():
            size_bytes = os.path.getsize(fs.abspath(path)) 
            if size_bytes == 0:
                return "0B"
            size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
            i = int(math.floor(math.log(size_bytes, 1024)))
            p = math.pow(1024, i)
            s = round(size_bytes / p, 2)
            return "%s %s" % (s, size_name[i])

        item = dict()
        item['id'] = path
        item['type'] = 'folder' if fs.isdir(path) else 'file'
        item['title'] = os.path.basename(path)
        if root is None: item['root_id'] = os.path.dirname(path)
        else: item['root_id'] = root
        item['created'] = datetime.datetime.fromtimestamp(os.stat(fs.abspath(path)).st_ctime).strftime('%Y-%m-%d %H:%M:%S')
        item['modified'] = datetime.datetime.fromtimestamp(os.stat(fs.abspath(path)).st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        item['size'] = convert_size()
        item['sizebyte'] = os.path.getsize(fs.abspath(path)) 
        return item

    path = wiz.request.query("path", True)

    if path == '' or path == 'src':
        root = dict(id='src', title='src', type='folder')
        children = []
        children.append(dict(title='angular', id='src/angular', type='folder', root_id='src'))
        children.append(dict(title='page', id='src/app/page', type='folder', root_id='src'))
        children.append(dict(title='component', id='src/app/component', type='folder', root_id='src'))
        children.append(dict(title='layout', id='src/app/layout', type='folder', root_id='src'))
        children.append(dict(title='libs', id='src/angular/libs', type='folder', root_id='src'))
        children.append(dict(title='styles', id='src/angular/styles', type='folder', root_id='src'))
        children.append(dict(title='assets', id='src/assets', type='folder', root_id='src'))
        wiz.response.status(200, dict(root=root, children=children))
    
    segment = path.split("/")

    if len(segment) == 3 and segment[1] == 'app':
        mode = segment[2]
        orgpath = path
        path = "/".join(segment[:2])
        root = driveItem(path)
        root['id'] = orgpath
        if mode == 'page': root['title'] = 'page'
        if mode == 'component': root['title'] = 'component'
        if mode == 'layout': root['title'] = 'layout'

        children = []
        if fs.isdir(path):
            for item in fs.ls(path):
                childpath = os.path.join(path, item)
                if fs.isfile(os.path.join(childpath, 'app.json')):
                    appinfo = fs.read.json(os.path.join(childpath, 'app.json'))
                    if appinfo['mode'] == mode:
                        children.append(dict(title=appinfo['title'], id=childpath, type='app', meta=appinfo, root_id=f"src/app/{mode}"))
        wiz.response.status(200, dict(root=root, children=children))

    root = driveItem(path)
    root_dirs = [
        'src/angular', 'src/app/page', 'src/app/component', 'src/app/layout', 
        'src/angular/libs', 'src/angular/styles', 'src/assets']
    if path in root_dirs: root['root_id'] = 'src'

    children = []
    if fs.isdir(path):
        for item in fs.ls(path):
            try:
                if segment[1] == 'angular':
                    if item in ['styles', 'libs']:
                        continue
            except:
                pass
            childpath = os.path.join(path, item)
            children.append(driveItem(childpath, root=root['id']))
        files = fs.files(path)

    wiz.response.status(200, dict(root=root, children=children))

def exists(segment):
    path = wiz.request.query("path", True)
    wiz.response.status(200, fs.exists(path))

def create():
    path = wiz.request.query("path", True)
    _type = wiz.request.query("type", True)

    if fs.exists(path):
        wiz.response.status(401, False)
    
    try:
        if _type == 'folder':
            fs.makedirs(path)
        else:
            fs.write(path, "")
    except:
        wiz.response.status(500, False)

    wiz.response.status(200, True)

def delete():
    path = wiz.request.query("path", True)
    if len(path) == 0 or path == 'src':
        wiz.response.status(401, False)
    if fs.exists(path):
        fs.delete(path)
    wiz.response.status(200, True)

def move():
    path = wiz.request.query("path", True)
    to = wiz.request.query("to", True)
    if len(path) == 0 or len(to) == 0:
        wiz.response.status(401, False)
    if fs.exists(path) == False:
        wiz.response.status(401, False)
    if fs.exists(to):
        wiz.response.status(401, False)
    fs.move(path, to)
    wiz.response.status(200, True)

def read():
    path = wiz.request.query("path", True)
    if fs.isfile(path):
        wiz.response.status(200, fs.read(path, ""))
    wiz.response.status(404)

def download(segment):
    path = segment.path
    extension = '.zip'
    if path.split("/")[1] == 'app':
        extension = '.wizapp'

    path = fs.abspath(path)

    if fs.isdir(path):
        filename = os.path.basename(path) + extension
        zippath = os.path.join(tempfile.gettempdir(), 'wiz', datetime.datetime.now().strftime("%Y%m%d"), str(int(time.time())), filename)
        if len(zippath) < 10: 
            wiz.response.abort(404)
        try:
            shutil.remove(zippath)
        except Exception as e:
            pass
        os.makedirs(os.path.dirname(zippath))
        zipdata = zipfile.ZipFile(zippath, 'w')
        for folder, subfolders, files in os.walk(path):
            for file in files:
                zipdata.write(os.path.join(folder, file), os.path.relpath(os.path.join(folder,file), path), compress_type=zipfile.ZIP_DEFLATED)
        zipdata.close()
        wiz.response.download(zippath, as_attachment=True, filename=filename)
    else:
        wiz.response.download(path, as_attachment=True)

    wiz.response.status(200, segment)

def update(segment):
    path = wiz.request.query("path", True)
    code = wiz.request.query("code", True)
    fs.write(path, code)
    wiz.response.status(200)

def upload(segment):
    path = wiz.request.query("path", True)
    filepath = wiz.request.query("filepath", "[]")
    filepath = json.loads(filepath)
    files = wiz.request.files()
    for i in range(len(files)):
        f = files[i]
        if len(filepath) > 0: name = filepath[i]
        else: name = f.filename
        name = os.path.join(path, name)
        fs.write.file(name, f)
    wiz.response.status(200)

def upload_root(segment):
    path = wiz.request.query("path", True)
    fs = wiz.project.fs(path)
    files = wiz.request.files()
    notuploaded = []
    
    for i in range(len(files)):
        f = files[i]
        name = f.filename
        app_id = ".".join(os.path.splitext(name)[:-1])
        if os.path.splitext(name)[-1] != ".wizportal":
            notuploaded.append(app_id)
            continue

        if fs.exists(app_id):
            notuploaded.append(app_id)
            continue

        fs.write.file(name, f)

        zippath = fs.abspath(name)
        unzippath = fs.abspath(app_id)
        with zipfile.ZipFile(zippath, 'r') as zip_ref:
           zip_ref.extractall(unzippath)

        fs.delete(name)

    wiz.response.status(200, notuploaded)

def upload_app(segment):
    path = wiz.request.query("path", True)
    path = "/".join(path.split("/")[:-1])
    fs = wiz.project.fs(path)

    files = wiz.request.files()
    notuploaded = []
    
    for i in range(len(files)):
        f = files[i]
        name = f.filename
        app_id = ".".join(os.path.splitext(name)[:-1])
        if os.path.splitext(name)[-1] != ".wizapp":
            notuploaded.append(app_id)
            continue

        if fs.exists(app_id):
            notuploaded.append(app_id)
            continue

        fs.write.file(name, f)

        zippath = fs.abspath(name)
        unzippath = fs.abspath(app_id)
        with zipfile.ZipFile(zippath, 'r') as zip_ref:
           zip_ref.extractall(unzippath)

        fs.delete(name)

        appinfo = fs.read.json(os.path.join(app_id, "app.json"), dict())
        appinfo['id'] = app_id
        appinfo['namespace'] = app_id
        fs.write.json(os.path.join(app_id, "app.json"), appinfo)

    wiz.response.status(200, notuploaded)

def build(segment):
    builder.build()
    wiz.response.status(200)

def ionic_start():
    device_id = wiz.request.query("device_id", True)
    util = wiz.ide.plugin.model("src/util")
    execute = util.execute
    buildpath = fs.abspath("build")
    proc = execute(f"cd {buildpath} && npm run ionic --target={device_id}")
    wiz.response.status(200)

def android_devices():
    os_name = platform.system()
    if os_name == "Windows":
        wiz.response.status(500)

    cmd = """adb devices | awk '{ if ($2 == "device") print $1 }'"""
    p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    if out is None: wiz.response.status(500)
    if len(out) == 0: wiz.response.status(500)    

    out = out.decode('utf-8').strip()
    devices = out.split("\n")
    res = []
    for device in devices:
        d = device.strip()
        if len(d) == 0: continue
        res.append(d)

    wiz.response.status(200, res)

def rebuild():
    builder.clean()
    builder.build()
    wiz.response.status(200)
