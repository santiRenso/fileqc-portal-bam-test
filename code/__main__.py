"""
EGA File Portal.

Designed with async/await programming model.
"""

import logging
import os
from pathlib import Path
from time import strftime
from logging.config import dictConfig
import socket
import sys
from contextlib import contextmanager
from time import strftime

import json
from aiohttp import web
import aiohttp_jinja2
import jinja2
import asyncpg

if os.getenv('EGA_environment').strip() != 'test': 
    from systemd.daemon import listen_fds, is_socket_unix, notify

from . import conf, endpoints

LOG = logging.getLogger(__name__)

def numberFormat(n, sep=None): # Only one argument.
    """Converts a number into string where thousands are grouped by ``sep``"""
    s = "{:,d}".format(n)
    return s.replace(',',sep) if sep else s

_js_escapes = {
    ord("\\"): "\\u005C",
    ord("'"): "\\u0027",
    ord('"'): "\\u0022",
    ord(">"): "\\u003E",
    ord("<"): "\\u003C",
    ord("&"): "\\u0026",
    ord("="): "\\u003D",
    ord("-"): "\\u002D",
    ord(";"): "\\u003B",
    ord("`"): "\\u0060",
    ord("\u2028"): "\\u2028",
    ord("\u2029"): "\\u2029",
}

# Escape every ASCII character with a value less than 32.
_js_escapes.update((ord("%c" % z), "\\u%04X" % z) for z in range(32))

def escapejs(value):
    """Hex encode characters for use in JavaScript strings."""
    return str(value).translate(_js_escapes)

async def initialize(app):
    """Initialize server."""

    # app['static_root_url'] = '/static'
    env = aiohttp_jinja2.get_env(app)
    env.filters['numberFormat'] = numberFormat
    env.filters['escapejs'] = escapejs

    app['static_root_url'] = '/static'

    # Connection to EGA-DB
    # LOG.info("Creating a connection pool to %s:%s", conf.database.get('host'), conf.database.get('port'))

    # Connection pool handles reconnections and keeps some expensive connections open for reuse
    # pool = await asyncpg.create_pool(**conf.database)
    # # Ping the db
    # LOG.debug('Ping the db first')
    # await pool.execute("SELECT 1;") # let it raise any exception if it fails
    # LOG.debug('Ping successful')

    # app['pool'] = pool

    LOG.info('Checking if qc root directory exists: %s', conf.qc_root)
    if not conf.qc_root or not os.path.isdir(conf.qc_root):
        raise ValueError('Missing root directory')

    LOG.info("Initialization done.")

    if os.getenv('EGA_environment').strip() != 'test': 
        # Tell systemd we are ready
        LOG.info('Sending systemd readyness')
        notify('READY=1')


async def destroy(app):
    LOG.info("Shutting down.")
    pool = app['pool']
    await pool.close()
    pool.terminate()


if os.getenv('EGA_environment').strip() != 'test': 
    @contextmanager
    def systemd_sockets(*args, **kwds):
        sockets = []
        try:
            fds = listen_fds()
            #LOG.debug('Getting the systemd-activated sockets: %s', fds)
            #LOG.debug('sockets: %s', [is_socket_unix(fd, type=socket.SOCK_STREAM, listening=1) for fd in fds])
            sockets = [socket.fromfd(fd, socket.AF_UNIX, socket.SOCK_STREAM) for fd in fds
                       if is_socket_unix(fd, type=socket.SOCK_STREAM, listening=1)]
            if not sockets:
                LOG.error('No activation socket')
                sys.exit(1)
            LOG.info('sockets activated: %s', sockets)
            yield sockets
        finally:
            # Code to release resource, e.g.:
            for s in sockets:
                s.close()



@web.middleware
async def error_middleware(request, handler):
    try:

        return await handler(request)

    except web.HTTPError as e:
        raise e

    except UnicodeDecodeError as e:
        raise web.HTTPBadRequest(text='Could not Decode')

    except ValueError as e:
        LOG.error('%r', e)
        error = str(e.__cause__ or e)
        raise web.HTTPBadRequest(text=error)  # 400

    except (asyncpg.exceptions.RaiseError,
            asyncpg.exceptions.IntegrityConstraintViolationError) as e:
        LOG.error('DB Raise Error: %r', e)
        error = str(e.__cause__ or e) # we can choose if we show the hint/debug/message
        raise web.HTTPBadRequest(text=error)  # 400

    except (asyncpg.exceptions.PLPGSQLError,
            asyncpg.exceptions.SyntaxOrAccessError,
            asyncpg.exceptions.UndefinedFunctionError,
            asyncpg.exceptions._base.InterfaceError,
            asyncpg.exceptions._base.PostgresError) as e:
        LOG.error('DB Error: %r', e)
        raise web.HTTPBadGateway(text="Database connection error. Please, retry in a moment") # 502

    except ConnectionResetError as e:
        LOG.error('Connection reset: %r', e)
        return None # eh?

    except Exception as e:
        LOG.error('General error: %r', e, exc_info=True)
        raise web.HTTPInternalServerError(text="Server error. Please, contact the administrator!") # 500

def main():

    # Configure the logging
    log_file = Path(__file__).parent / "logger.json"
    if log_file.exists():
        with open(log_file, 'r') as stream:
            dictConfig(json.load(stream))

    # Configure the app
    server = web.Application(middlewares=[error_middleware])
    server.on_startup.append(initialize)
    server.on_cleanup.append(destroy)

    # Prepare for the UI
    _here = Path(__file__).parent.resolve()
    # Where the templates are
    template_loader = jinja2.FileSystemLoader(str(_here.parent))
    aiohttp_jinja2.setup(server, loader=template_loader)

    # Configure the endpoints
    server.add_routes(endpoints.routes)
    # For development: static files
    server.add_routes([web.static('/static', str(_here.parent / 'static'))])


    if True:
        # run the server on a port number
        web.run_app(server,
                    host='0.0.0.0',
                    port=int(sys.argv[1]) if len(sys.argv) > 1 else 8080,
                    shutdown_timeout=0, ssl_context=None)

    else:
        # Production uses sockets
        with systemd_sockets() as sockets:
            web.run_app(server,
                        sock=sockets, # might be several
                        shutdown_timeout=0, ssl_context=None)


if __name__ == '__main__':
    main()
