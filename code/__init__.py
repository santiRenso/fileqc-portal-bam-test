"""
The package contains code to start the EGA File Portal App.
"""

__title__ = 'EGA File Portal'
__version__ = '1.0'
__author__ = 'CRG developers'
__license__ = 'Apache 2.0'
__copyright__ = 'EGA File Portal @ CRG, Barcelona'

import sys
if sys.version_info < (3, 6):
    print("This app requires python3.6", file=sys.stderr)
    sys.exit(1)

# Send warnings using the package warnings to the logging system
# The warnings are logged to a logger named 'py.warnings' with a severity of WARNING.
# See: https://docs.python.org/3/library/logging.html#integration-with-the-warnings-module
import logging
import warnings
logging.captureWarnings(True)
warnings.simplefilter("default")  # do not ignore Deprecation Warnings
