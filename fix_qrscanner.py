#!/usr/bin/env python3
"""Fix QRScanner.tsx - adds missing closing div tags."""
import codecs

path = "c:/Users/Administrator/Desktop/CPClibraryV3/frontend/components/QRScanner.tsx"
with codecs.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix: replace the unterminated JSX structure
old_end = (
    '        <div className="mt-4 flex justify-center">\n'
    '          <button onClick={scanning ? stopCamera : startCamera} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">\n'
    '            {scanning ? "Stop Scanning" : "Restart Camera"}\n'
    '          </button>\n'
    '        </div>\n'
    '    </div>\n'
    '  );\n'
    '}'
)
new_end = (
    '        <div className="mt-4 flex justify-center">\n'
    '          <button onClick={scanning ? stopCamera : startCamera} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">\n'
    '            {scanning ? "Stop Scanning" : "Restart Camera"}\n'
    '          </button>\n'
    '        </div>\n'
    '      </div>\n'
    '    </div>\n'
    '  );\n'
    '}'
)

if old_end in content:
    content = content.replace(old_end, new_end)
    with codecs.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed QRScanner.tsx - added missing closing divs")
else:
    print("Could not find the exact pattern. Showing end of file:")
    print(repr(content[-400:]))
