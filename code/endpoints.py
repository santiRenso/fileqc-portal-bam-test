import logging
import inspect
import json
import os
import gzip
import csv
import io

from aiohttp import web
from aiohttp_jinja2 import render_template,template

from . import conf

LOG = logging.getLogger(__name__)

BUFSIZE = getattr(conf, 'BUFSIZE', 1024)

EXT_CONTENT_TYPE = {
    '.svg': 'image/svg+xml',
    '.svgz': 'image/svg+xml',
    '.png': 'image/png',
    '': 'application/octet-stream',
}

def get_template_absolute_path(filename,path="code/templates"):
    return f'{path}/{filename}'
def get_file_by_extension(directory, ext):
    ext= f'.{ext.lstrip(".")}'  # Ensure the extension starts with a dot
    for filename in os.listdir(directory):
        if filename.endswith(ext):
            return filename
    return None
def get_all_files_by_extension(directory, ext):
    ext= f'.{ext.lstrip(".")}'  # Ensure the extension starts with a dot
    arr = []
    for filename in os.listdir(directory):
        if filename.endswith(ext):
            arr.append(filename)
    return arr
def get_data_and_table_files(directory):
    file_names = get_all_files_by_extension(directory,"json")
    obj = {"table_files":[],"data_files":[]}
    for file_name in file_names:
        if file_name.endswith("_table.json"):
            obj["table_files"].append(file_name)
        else:
            obj["data_files"].append(file_name)
    return obj        
async def one(request):

    stable_id = request.match_info['stable_id'] # can't KeyError
    LOG.debug('Getting report for %s', stable_id)

    query = '''SELECT type,
                      BTRIM(path, '/ ')        AS report_path,
                      BTRIM(header_path, '/ ') AS header_path,
                      BTRIM(stats_path, '/ ')  AS stats_path
               FROM qc.report_table WHERE stable_id = $1'''

    # UNCOMMENT ME
    # ********************************************************************************
    # info = await request.app['pool'].fetchrow(query, stable_id)
    # LOG.debug('Info for %s: %s', stable_id, info)
    # if not info:
    #     raise web.HTTPNotFound(reason=f"Report for file {stable_id} does not exist");

    # report_type = info['type']
    # report_path = os.path.join(conf.qc_root, info['report_path'].lstrip('/'))
    # ********************************************************************************

    # DELETE ME
    # ********************************************************************************
    info = {
        'type': 'VCF',
        'header_path':None
    }
    report_type = info['type']
    report_path = os.path.join(conf.qc_root, f'{stable_id}_report.json.gz')
    # ********************************************************************************


    # The report file exists
    if report_type == 'FASTQ':
        LOG.debug('%s is a FastQ file', stable_id)
        response = web.StreamResponse(headers={'Content-Type': 'text/html'})
        await response.prepare(request)
        with open(report_path, 'rb') as f:
            while True:
                data = f.read(BUFSIZE)
                if not data:
                    break
                await response.write(data)
        await response.write_eof()
        return response

    # Header file
    header_text = None
    header_path = info['header_path']
    if header_path is not None:
        header_path = os.path.join(conf.qc_root, header_path)
        if os.path.isfile(header_path):
            with gzip.open(header_path, 'rt') as f:
                header_text = f.read() # yup... all in mem!


    if report_type in ('BAM', 'CRAM', 'VCF'):
        LOG.debug('%s is a %s file', stable_id, report_type)
        with gzip.open(report_path) as f:
            data = json.load(f)
            ctx = {
                'title': stable_id,
                'stable_id': stable_id,
                'report_type': report_type,
                'header_text': header_text,
                'stats_path': 'stats/' if info.get('stats_path') else None,
            }
            version = data.get('Report Version')
            if version == 2:
                table = data.get('Stats_table')
                max_rows = 300
                ctx['max_rows'] = max_rows
                ctx['show_table'] = True
                if len(table) > max_rows:
                    ctx['show_table'] = False
                template = get_template_absolute_path('vcf2.html')
            else:
                _data = data['Data']
                data['Data'] = { k:json.dumps(v) for k,v in _data.items() }
                template = get_template_absolute_path('vcf.html') if report_type == 'VCF' else get_template_absolute_path('bam.html')   

            ctx['report'] = data
            return render_template(template, request, ctx)
        
    raise web.HTTPNotFound(reason=f"File {stable_id} report type is unknown: {report_type}");

async def header(request):

    stable_id = request.match_info['stable_id'] # can't KeyError
    LOG.debug('Getting report for %s', stable_id)

    query = '''SELECT BTRIM(header_path, '/ ') AS header_path
               FROM qc.report_table
               WHERE stable_id = $1 AND header_path IS NOT NULL;'''

    info = await request.app['pool'].fetchrow(query, stable_id)
    # LOG.debug('Info for %s: %s', stable_id, info)
    if not info:
        raise web.HTTPNotFound(reason=f"Header for file {stable_id} not found");

    header_path = os.path.join(conf.qc_root, info['header_path'])
    try:
        #if os.path.isfile(header_path):
        with gzip.open(header_path, 'rb') as f:
            response = web.StreamResponse(headers={'Content-Type': 'text/plain'})
            await response.prepare(request)
            while True:
                data = f.read(BUFSIZE)
                if not data:
                    break
                await response.write(data)
            await response.write_eof()
            return response
    except Exception as e:
        LOG.error('Header error: %r', e)
        raise web.HTTPNotFound(reason=f"Header for file {stable_id} not found");
        

async def stats(request):

    stable_id = request.match_info['stable_id'] # can't KeyError
    LOG.debug('Getting stats for %s', stable_id)

    query = '''SELECT type, BTRIM(stats_path, '/ ') AS stats_path
               FROM qc.report_table
               WHERE stable_id = $1 AND stats_path IS NOT NULL;'''

    info = await request.app['pool'].fetchrow(query, stable_id)
    # LOG.debug('Info for %s: %s', stable_id, info)
    if not info:
        raise web.HTTPNotFound(reason=f"Report for file {stable_id} has no stats or does not exist");

    report_type = info['type']

    if report_type == 'VCF':
        LOG.debug('%s is a VCF file', stable_id)
        ctx = {
            'title': stable_id,
            'stable_id': stable_id,
        }
        return render_template(get_template_absolute_path('vcfstats.html'), request, ctx)

    # otherwise
    filepath = os.path.join(conf.qc_root, info['stats_path'], get_template_absolute_path('index.html'))
    if os.path.exists(filepath):
        LOG.debug('STATS: Streaming %s', filepath)
        with open(filepath, 'rb') as f:
            response = web.StreamResponse(headers={'Content-Type': 'text/html'})
            await response.prepare(request)
            while True:
                data = f.read(BUFSIZE)
                if not data:
                    break
                await response.write(data)
            await response.write_eof()
            return response

    raise web.HTTPNotFound(reason=f"Stats not found for {stable_id}");

async def stats_files(request):

    stable_id = request.match_info['stable_id'] # can't KeyError
    filename = request.match_info['filename'] # can't KeyError
    LOG.debug('Getting stats file for %s: %s', stable_id, filename)

    query = '''SELECT BTRIM(stats_path, '/ ') AS stats_path
               FROM qc.report_table
               WHERE stable_id = $1 AND stats_path IS NOT NULL;'''

    info = await request.app['pool'].fetchrow(query, stable_id)
    # LOG.debug('Info for %s: %s', stable_id, info)
    if not info:
        raise web.HTTPNotFound(reason=f"Report for file {stable_id} does not exist");

    filepath = os.path.join(conf.qc_root, info['stats_path'], filename)
    if os.path.exists(filepath):
        with open(filepath, 'rb') as f:
            _, extension = os.path.splitext(filename)
            content_type = EXT_CONTENT_TYPE.get(extension, 'application/octet-stream')
            response = web.StreamResponse(headers={'Content-Type': content_type})
            await response.prepare(request)
            while True:
                data = f.read(BUFSIZE)
                if not data:
                    break
                await response.write(data)
            await response.write_eof()
            return response

    raise web.HTTPNotFound(reason=f"Stats not found for {stable_id}");


async def healthcheck(request):
    pool = request.app['pool']
    try:
        response = await pool.fetch("SELECT 1")
        return web.json_response({'status': 'ok'}, status=200)
    except Exception as e:
        LOG.error('Health check error: %r', e)
        return web.json_response({'status': 'unavailable'}, status=503)
async def vcf_csv(request):
    stable_id = request.match_info['stable_id'] # can't KeyError
    LOG.debug('Getting report for %s', stable_id)
    report_path = os.path.join(conf.qc_root, f'{stable_id}_report.json.gz')
    with gzip.open(report_path) as f:
        data = json.load(f)
    table = data.get('Stats_table')
    # Create a StringIO object to write the CSV data
    output = io.StringIO()
    writer = csv.writer(output)

    # Write the header (keys of the first object)
    if table:
        writer.writerow(table[0].keys())

    # Write the table rows
    for item in table:
        writer.writerow(item.values())

    return web.Response( text=output.getvalue(), headers={ "Content-Disposition": 'attachment; filename="data.csv"',"Content-Type": "text/csv" } ) 

async def samples(request):
    stable_id = request.match_info['stable_id'] # can't KeyError
    LOG.debug('Getting report for %s', stable_id)
    report_path = os.path.join(conf.qc_root, f'{stable_id}_report.json.gz')
    with gzip.open(report_path) as f:
        data = json.load(f)
        ctx = {
            'title': 'VCF test',
            'stable_id': stable_id,
            'report_type': 'VCF',
            'report': data,
            'header_text': None,
        }
        template = get_template_absolute_path('samples.html')
        return render_template(template, request, ctx)


async def bam2(request):
    filename = request.match_info.get('filename')
    data_directory = os.path.join(conf.qc_bam2,filename)
    # data
    ctx ={}
    filenames = get_data_and_table_files(data_directory)
    for file_name in filenames["data_files"]:
        data_path = os.path.join(data_directory, file_name)
        with open(data_path) as f:
            data = json.load(f)
            ctx[os.path.splitext(file_name)[0]] = data
    #tables
    for file_name in filenames["table_files"]:
        data_path = os.path.join(data_directory, file_name)
        with open(data_path) as f:
            data = json.load(f)
            LOG.debug(data)
            ctx[os.path.splitext(file_name)[0]] = data
    # template
    template_path = f'{conf.qc_bam2}/{filename}'
    template_name = get_file_by_extension(data_directory,"html")
    template = (get_template_absolute_path(template_name, template_path))
    return render_template(template, request, ctx)

async def slash_redirect(request):
    url = request.path + '/'
    if request.query_string:
        url += '?' + request.query_string
    return web.HTTPMovedPermanently(url)    

routes = [
    web.get('/health', healthcheck),

    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}', slash_redirect),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/', one),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/samples', samples,name='samples'),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/csv', vcf_csv),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/header.txt', header),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/stats', slash_redirect),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/stats/', stats, name='stats'),
    web.get('/{stable_id:EGAF\d\d\d\d\d\d\d\d\d\d\d}/stats/{filename:.+}', stats_files),
    web.get('/bam2/{filename}', slash_redirect),
    web.get('/bam2/{filename}/', bam2)
]
