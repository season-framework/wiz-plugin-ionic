import platform
import subprocess

builder = wiz.ide.plugin.model("builder")
fs = wiz.project.fs()

def __execute__(cmd):
    p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    if out is not None and len(out) > 0:
        out = out.decode('utf-8').strip()
    return out, err

def ionic_start():
    type = wiz.request.query("type", True)
    device_id = wiz.request.query("id", True)
    util = wiz.ide.plugin.model("src/util")
    execute = util.execute
    buildpath = fs.abspath("build")
    proc = execute(f"cd {buildpath} && npm run ionic:{type} --target={device_id}")
    wiz.response.status(200)

def devices():
    os_name = platform.system()
    if os_name == "Windows":
        wiz.response.status(500)

    res = []
    # android
    cmd = """adb devices | awk '{ if ($2 == "device") print $1 }'"""
    out, err = __execute__(cmd)
    if out is not None and len(out) > 0:
        devices = out.split("\n")
        for device in devices:
            d = device.strip()
            if len(d) == 0: continue
            res.append(dict(id=d, type="android"))

    # ios
    cmd = "idevice_id -l"
    out, err = __execute__(cmd)
    if out is not None and len(out) > 0:
        devices = out.split("\n")
        for device in devices:
            d = device.strip()
            if len(d) == 0: continue
            res.append(dict(id=d, type="ios"))
    wiz.response.status(200, res)

def installed():
    res = dict()
    exists = fs.exists("build/android/build.gradle")
    res["android"] = exists
    exists = fs.exists("build/ios/App/Podfile")
    res["ios"] = exists
    
    wiz.response.status(200, res)

def android_status():
    res = dict(
        java=False,
        adb=False,
        java_home=False,
        android_home=False,
    )

    out, err = __execute__("java -version 2>&1 | head -n 1 | awk '{ print $3 }'")
    if out is not None and len(out) > 0:
        res["java"] = out
    
    out, err = __execute__("adb --version 2>&1 | head -n 1 | awk '{ print $5 }'")
    if out is not None and len(out) > 0:
        res["adb"] = out

    out, err = __execute__("echo $JAVA_HOME")
    if out is not None and len(out) > 0:
        res["java_home"] = out

    out, err = __execute__("echo $ANDROID_HOME")
    if out is not None and len(out) > 0:
        res["android_home"] = out

    wiz.response.status(200, res)

def ios_status():
    res = dict(
        idevice=False,
        pod=False,
    )

    out, err = __execute__("idevice_id --version | awk '{print $2}'")
    if out is not None and len(out) > 0:
        res["idevice"] = out
    
    out, err = __execute__("pod --version")
    if out is not None and len(out) > 0:
        res["pod"] = out

    wiz.response.status(200, res)

def add_android():
    builder.install_android()
    wiz.response.status(200)

def add_ios():
    builder.install_ios()
    wiz.response.status(200)

def rebuild():
    builder.clean()
    builder.build()
    wiz.response.status(200)
