# Cut the raw frame recording into highlight frames and encode the two preview videos.
import json, os, subprocess, sys
P = sys.argv[1]
raw = P + '/raw'
states = json.load(open(raw + '/states.json'))
n = len(states)
keep = []
i = 0
while i < n:
    j = i
    while j < n and states[j] == states[i]:
        j += 1
    run = list(range(i, j))
    caps = {'walk': (8, 10), 'standoff': (0, 18), 'ready': (0, 40), 'cleared': (24, 0)}  # frames kept from start, end
    if states[i] in caps:
        a, b = caps[states[i]]
        if len(run) > a + b:
            run = run[:a] + (run[-b:] if b else [])
    keep += run
    i = j
GAME_FRAMES = 560  # about 18.7 s of gameplay after the 1 s cover: under 20 s in all
keep = keep[:GAME_FRAMES]
seq = P + '/seq'
os.makedirs(seq, exist_ok=True)
for f in os.listdir(seq):
    os.remove(os.path.join(seq, f))
for k, idx in enumerate(keep):
    os.symlink(f'{raw}/f{idx:04d}.jpg', f'{seq}/s{k:04d}.jpg')
print('frames kept', len(keep), 'of', n, 'last state', states[keep[-1]])
enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', '-an']
# landscape 1920x1080: 1 s still of the cover, 0.4 s cross-fade into gameplay
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
  '-loop', '1', '-t', '1.4', '-framerate', '30', '-i', P + '/landscape_cover.png',
  '-framerate', '30', '-i', seq + '/s%04d.jpg',
  '-filter_complex', '[0:v]scale=1920:1080,setsar=1,format=yuv420p[a];[1:v]scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.4:offset=1.0[v]',
  '-map', '[v]', '-r', '30', *enc, P + '/preview_landscape_1920x1080.mp4'], check=True)
# portrait 1080x1620: gameplay band over the blurred cover, opening on the portrait cover
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
  '-loop', '1', '-t', '1.4', '-framerate', '30', '-i', P + '/portrait_cover_1080x1620.png',
  '-loop', '1', '-framerate', '30', '-i', P + '/portrait_bg.png',
  '-framerate', '30', '-i', seq + '/s%04d.jpg',
  '-filter_complex', '[2:v]scale=1080:608:flags=lanczos[g];[1:v][g]overlay=0:540:shortest=1,setsar=1,format=yuv420p[b];[0:v]setsar=1,format=yuv420p[a];[a][b]xfade=transition=fade:duration=0.4:offset=1.0[v]',
  '-map', '[v]', '-r', '30', *enc, P + '/preview_portrait_1080x1620.mp4'], check=True)
for f in ('preview_landscape_1920x1080.mp4', 'preview_portrait_1080x1620.mp4'):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=width,height,codec_type', '-of', 'compact', P + '/' + f], capture_output=True, text=True).stdout
    print(f, out.replace('\n', ' '))
