import os
import re

lib_dir = r"C:\Users\ISHAN AGRAWAL\Desktop\MannMitra\mannmitra_app\silent_spiral\lib"

pattern = re.compile(r'baseColor:\s*[^,]+,\s*borderColor:\s*[^,]+,')
pattern_single_base = re.compile(r'baseColor:\s*[^,]+,')
pattern_single_border = re.compile(r'borderColor:\s*[^,]+,')

for root, dirs, files in os.walk(lib_dir):
    for file in files:
        if file.endswith('.dart'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The new GlassContainer uses GlassType.card or GlassType.glassPanel
            # Default fallback: type: GlassType.card
            if 'GlassContainer' in content and ('baseColor:' in content or 'borderColor:' in content):
                new_content = pattern.sub('type: GlassType.card,', content)
                new_content = pattern_single_base.sub('type: GlassType.card,', new_content)
                new_content = pattern_single_border.sub('type: GlassType.card,', new_content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")
