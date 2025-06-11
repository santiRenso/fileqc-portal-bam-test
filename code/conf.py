"""Public Configuration"""

import os

#
# Database connection
# See https://magicstack.github.io/asyncpg/current/_modules/asyncpg/pool.html#create_pool for the list of parameters.
# See https://magicstack.github.io/asyncpg/current/api/index.html?highlight=create_pool#asyncpg.connection.connect for the
database = {
    'user': os.getenv('DB_USER', 'qc'),
    'password': os.getenv('DB_PASSWORD', 'secret'),
    'host': os.getenv('DB_HOST', 'vault-db'),
    'port': int(os.getenv('DB_PORT') or 5432),
    'database': os.getenv('DB_NAME', 'ega'),
    'server_settings': {
        'search_path': 'qc',
        'application_name': 'QualityControl-frontend', # Useful to track connections
    },
    'min_size': 0, # initializing with 0 connections allows the web server to
    # # start and also continue to live
    # 'max_queries': 50000,
    # 'max_size': 10, # for now limiting the number of connections in the pool
    # 'timeout': 120,
    # 'command_timeout': 180,
    # 'max_inactive_connection_lifetime': 180,
}


qc_root = os.getenv('QC_ROOT', '/data/vault/QC/content').strip()
qc_bam2 = os.getenv('QC_BAM2', '/data/vault/QC/content').strip()
