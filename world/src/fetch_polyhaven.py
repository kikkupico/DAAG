"""Download CC0 textures, models and skies from Poly Haven (polyhaven.com, all CC0)."""
import json, os, sys, urllib.request, concurrent.futures as cf

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'polyhaven')
API = 'https://api.polyhaven.com/files/'

TEXTURES = [
    # terrain
    'marble_cliff_02', 'rocky_terrain_02', 'dry_ground_rocks', 'dry_ground_01', 'sparse_grass',
    'coast_sand_01', 'aerial_rocks_02', 'rocky_trail', 'brown_mud_dry', 'forest_leaves_02',
    # building
    'white_plaster_rough_01', 'yellow_plaster_02', 'worn_plaster_wall', 'stacked_stone_wall',
    'rustic_stone_wall', 'sandstone_cracks', 'marble_01', 'seaworn_stone_tiles', 'rough_wood',
    'weathered_planks', 'rough_linen', 'clay_floor_001', 'dirt', 'grey_stone_path',
    'large_sandstone_blocks', 'rock_surface',
    # bark
    'jolcham_oak_bark_01', 'pine_bark', 'tree_bark_03', 'bark_brown_02',
    'rock_boulder_dry', 'rocks_ground_06', 'gray_rocks', 'red_dirt_mud_01', 'red_laterite_soil_stones', 'rock_face_03',
    'rock_wall_10', 'rock_wall_06', 'lichen_rock', 'aerial_grass_rock', 'rocky_gravel', 'brown_mud_rocks_01',
]
MODELS = [
    'coastal_cliff_01', 'coastal_cliff_02', 'coastal_cliff_04', 'coast_rocks_01', 'coast_rocks_02',
    'coast_rocks_03', 'coast_rocks_05', 'namaqualand_boulder_02', 'namaqualand_boulder_03',
    'namaqualand_boulder_05', 'namaqualand_rocks_01', 'namaqualand_stones_01', 'boulder_01', 'rock_07',
    'rock_09', 'stone_01', 'shrub_01', 'shrub_02', 'shrub_03', 'shrub_04', 'searsia_lucida',
    'searsia_burchellii', 'wild_rooibos_bush', 'grass_medium_01', 'grass_medium_02', 'pine_tree_01',
    'wicker_basket_01', 'wicker_basket_02', 'wooden_bucket_01', 'dead_tree_trunk', 'marble_bust_01',
    'horse_statue_01', 'dry_branches_medium_01',
]
HDRIS = [
    'qwantani_late_afternoon_puresky', 'kloofendal_48d_partly_cloudy_puresky',
    'kloofendal_overcast_puresky', 'qwantani_dusk_2_puresky', 'syferfontein_6d_clear_puresky',
    'qwantani_noon_puresky',
]
MAPS = {'Diffuse': 'diff', 'nor_gl': 'nor', 'Rough': 'rough', 'Displacement': 'disp', 'AO': 'ao'}

def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'daag-world'})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest + '.part', 'wb') as f:
        f.write(r.read())
    os.replace(dest + '.part', dest)

def files(asset):
    req = urllib.request.Request(API + asset, headers={'User-Agent': 'daag-world'})
    return json.load(urllib.request.urlopen(req, timeout=60))

def texture(a, res='2k'):
    f = files(a); jobs = []
    for key, short in MAPS.items():
        if key in f and res in f[key]:
            u = f[key][res]['jpg']['url'] if 'jpg' in f[key][res] else f[key][res]['png']['url']
            jobs.append((u, os.path.join(ROOT, 'textures', a, f'{short}.{u.rsplit(".",1)[1]}')))
    return jobs

def model(a, res='2k'):
    f = files(a)['gltf']; r = res if res in f else sorted(f)[0]
    g = f[r]['gltf']; d = os.path.join(ROOT, 'models', a)
    jobs = [(g['url'], os.path.join(d, os.path.basename(g['url'])))]
    for rel, v in g.get('include', {}).items():
        jobs.append((v['url'], os.path.join(d, rel)))
    # foliage: the glTF's colour map is a JPG with no transparency; the leaves' cut-out is a map of its own
    a_ = files(a).get('Alpha', {}).get(r, {})
    if 'png' in a_:
        jobs.append((a_['png']['url'], os.path.join(d, 'textures', f'{a}_alpha_{r}.png')))
    return jobs

def hdri(a, res='4k'):
    f = files(a)['hdri'][res]['hdr']
    return [(f['url'], os.path.join(ROOT, 'hdri', a + '.hdr'))]

if __name__ == '__main__':
    jobs = []
    with cf.ThreadPoolExecutor(8) as ex:
        for js in ex.map(texture, TEXTURES): jobs += js
        for js in ex.map(model, MODELS): jobs += js
        for js in ex.map(hdri, HDRIS): jobs += js
    print(len(jobs), 'files')
    with cf.ThreadPoolExecutor(12) as ex:
        list(ex.map(lambda j: get(*j), jobs))
    print('done')
