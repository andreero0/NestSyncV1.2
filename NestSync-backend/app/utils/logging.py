"""
Logging utilities for secure log sanitization.

This module provides utilities to prevent log injection attacks by sanitizing
user-provided data before including it in log entries. This is critical for
maintaining PIPEDA compliance and ensuring audit trail integrity.
"""

import re
from typing import Any, Dict, List, Union


def sanitize_log_data(data: Any) -> Any:
    """
    Remove control characters and potential log injection vectors from data.
    
    This function recursively sanitizes strings, dictionaries, and lists to
    prevent log injection attacks. It removes:
    - Newline characters (\n)
    - Carriage returns (\r)
    - ANSI escape sequences
    - Other control characters (0x00-0x1f, 0x7f-0x9f)
    
    Args:
        data: The data to sanitize. Can be a string, dict, list, or other type.
        
    Returns:
        Sanitized version of the input data. Non-string/dict/list types are
        returned unchanged.
        
    Examples:
        >>> sanitize_log_data("Hello\nWorld")
        'HelloWorld'
        
        >>> sanitize_log_data({"user": "test\r\ninjection"})
        {'user': 'testinjection'}
        
        >>> sanitize_log_data(["item1\n", "item2\x1b[31m"])
        ['item1', 'item2']
    """
    if isinstance(data, str):
        # Remove newlines, carriage returns, and ANSI escape sequences
        # Pattern explanation:
        # \x1b\[[0-9;]*[a-zA-Z] - ANSI escape sequences (must be first to match full sequence)
        # [\n\r] - newlines and carriage returns
        # [\x00-\x1f] - control characters (0-31)
        # [\x7f-\x9f] - additional control characters (127-159)
        # Order matters: match ANSI sequences first, then individual control chars
        sanitized = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]|[\n\r\x00-\x1f\x7f-\x9f]', '', data)
        return sanitized
    
    elif isinstance(data, dict):
        # Recursively sanitize dictionary values
        return {key: sanitize_log_data(value) for key, value in data.items()}
    
    elif isinstance(data, list):
        # Recursively sanitize list items
        return [sanitize_log_data(item) for item in data]
    
    elif isinstance(data, tuple):
        # Recursively sanitize tuple items (return as tuple)
        return tuple(sanitize_log_data(item) for item in data)
    
    # Return other types unchanged (int, float, bool, None, etc.)
    return data


def create_structured_log_extra(
    **kwargs: Any
) -> Dict[str, Any]:
    """
    Create a sanitized extra dictionary for structured logging.
    
    This is a convenience function that sanitizes all provided keyword arguments
    and returns them as a dictionary suitable for use with the logging module's
    'extra' parameter.
    
    Args:
        **kwargs: Key-value pairs to include in the log extra data.
        
    Returns:
        Dictionary with sanitized values ready for structured logging.
        
    Examples:
        >>> extra = create_structured_log_extra(
        ...     user_id="123",
        ...     action="login\nattempt",
        ...     ip="192.168.1.1"
        ... )
        >>> logger.info("User action", extra=extra)
    """
    return {key: sanitize_log_data(value) for key, value in kwargs.items()}
