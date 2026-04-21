import difflib
import re
from typing import List, Dict, Any, Tuple

def compute_diff(old_text: str | None, new_text: str | None, path: str, status: str) -> Dict[str, Any]:
    """
    Computes a unified diff between old_text and new_text and returns it
    in a structured format suitable for the frontend's DiffViewer.
    """
    if old_text is None and new_text is None:
        # Binary file or error decoding
        return {
            "path": path,
            "status": status,
            "additions": 0,
            "deletions": 0,
            "hunks": []
        }

    old_lines = old_text.splitlines() if old_text is not None else []
    new_lines = new_text.splitlines() if new_text is not None else []

    diff_lines = list(difflib.unified_diff(old_lines, new_lines, n=3))

    additions = 0
    deletions = 0
    hunks = []

    current_hunk = None
    old_line_no = 0
    new_line_no = 0

    # diff_lines looks like:
    # --- 
    # +++ 
    # @@ -1,4 +1,5 @@
    #  context
    # -removed
    # +added
    
    # Skip the header (--- and +++)
    if len(diff_lines) >= 2 and diff_lines[0].startswith('---') and diff_lines[1].startswith('+++'):
        diff_lines = diff_lines[2:]

    hunk_header_re = re.compile(r'^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@')

    for line in diff_lines:
        match = hunk_header_re.match(line)
        if match:
            if current_hunk:
                hunks.append(current_hunk)
            
            old_line_no = int(match.group(1))
            new_line_no = int(match.group(2))
            
            current_hunk = {
                "oldStart": old_line_no,
                "newStart": new_line_no,
                "lines": []
            }
        elif current_hunk is not None:
            char = line[0] if len(line) > 0 else ' '
            content = line[1:] if len(line) > 0 else ''
            
            # handle 'No newline at end of file' indicator
            if line.startswith('\\ No newline'):
                continue
                
            diff_line = {
                "type": char if char in ('+', '-', ' ') else ' ',
                "content": content
            }
            
            if char == ' ':
                diff_line["oldLineNumber"] = old_line_no
                diff_line["newLineNumber"] = new_line_no
                old_line_no += 1
                new_line_no += 1
            elif char == '-':
                diff_line["oldLineNumber"] = old_line_no
                old_line_no += 1
                deletions += 1
            elif char == '+':
                diff_line["newLineNumber"] = new_line_no
                new_line_no += 1
                additions += 1
            else:
                # Fallback just in case
                diff_line["type"] = ' '
                diff_line["oldLineNumber"] = old_line_no
                diff_line["newLineNumber"] = new_line_no
                old_line_no += 1
                new_line_no += 1
                
            current_hunk["lines"].append(diff_line)

    if current_hunk:
        hunks.append(current_hunk)

    return {
        "path": path,
        "status": status,
        "additions": additions,
        "deletions": deletions,
        "hunks": hunks
    }
