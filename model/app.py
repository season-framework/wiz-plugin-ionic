import os
import season

class Model:
    def __init__(self, path=None):
        if path is None:
            path = wiz.project.fs().abspath()
        self.PATH_ROOT = path
    
    def fs(self, *args):
        return season.util.filesystem(os.path.join(self.PATH_ROOT, *args))

    def api(self, app_id):
        fs = self.fs("bundle", "src", "app", app_id)
        app = fs.read.json("app.json", None)
        app['api'] = fs.read("api.js", None)

        if app is None or app['api'] is None:
            return None
        
        code = app['api']
        if len(code) == 0:
            return None

        logger = wiz.logger(f"app/{app_id}/api")
        name = fs.abspath("api.js")

        cachens = 'app.api.code#' + wiz.project()
        cache = wiz.server.cache.get(cachens, dict())
        if name in cache:
            code = cache[name]
        else:
            code = compile(code, name, 'exec')
            cache[name] = code

        return season.util.compiler().build(code, name=name, logger=logger, wiz=wiz).fn
