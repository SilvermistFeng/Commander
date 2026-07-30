"""Make the ``src`` layout importable when tests run without an install.

``pythonpath = ["src"]`` in pyproject already handles this for a normal
pytest run; this belt-and-braces addition means the tests also work if
someone runs pytest from an unusual working directory.
"""

import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))
