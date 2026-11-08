"""Build silent, natural-speed activity previews from the owner's uploaded videos.
Run from the repository root: python scripts/build_activity_previews.py
Requires FFmpeg and FFprobe. Originals stay unchanged.
"""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'alphabet'
EDITS = [
    {'source': 'WhatsApp Video 2026-11-08 at 17.21.02.mp4',
     'name': 'alphabet-pages-preview', 'in': 5.2, 'out': 9.5, 'poster': 0.9},
    {'source': 'WhatsApp Video 2026-11-08 at 17.21.15.mp4',
     'name': 'letter-formation-preview', 'in': 24.4, 'out': 33.0, 'poster': 4.0},
]

def run(*args):
    return subprocess.run(list(map(str, args)), check=True, capture_output=True, text=True)

for edit in EDITS:
    source = ROOT / edit['source']
    target = OUT / (edit['name'] + '.mp4')
    # Time-preserving cuts, intact source framing, no narration or testimonial claims.
    run('ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', edit['in'], '-i', source,
        '-t', edit['out'] - edit['in'], '-map', '0:v:0', '-an',
        '-vf', 'fps=30,setsar=1', '-c:v', 'libx264', '-preset', 'medium',
        '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target)
    run('ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', edit['poster'], '-i', target,
        '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', OUT / (edit['name'] + '.webp'))
    run('ffmpeg', '-nostdin', '-v', 'error', '-i', target, '-f', 'null', '-')
    probe = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', target).stdout)
    print(json.dumps({'file': target.name, 'seconds': probe['format']['duration'],
                      'bytes': target.stat().st_size,
                      'streams': [{'type': s['codec_type'], 'width': s.get('width'), 'height': s.get('height')} for s in probe['streams']]}))
