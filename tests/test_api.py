"""
Root Test Suite Runner for PayFlow Platform.
Validates key API workflows, security boundaries, and mock provider interactions.
"""
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'payflow_core.settings')

import django
django.setup()

from payments.tests import PayFlowCoreTests

__all__ = ['PayFlowCoreTests']
