"""Blender helpers: scene, collections, meshes from numpy, cameras, render settings."""
import math, os
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PH = os.path.join(ROOT, 'assets', 'polyhaven')
BUILD = os.path.join(ROOT, 'build')


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = 'METRIC'
    return s


def collection(name, parent=None, hide_render=False):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    c.hide_render = hide_render
    return c


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_from_arrays(name, verts, faces, coll=None, mat=None, smooth=False, uvs=None):
    """verts (n,3) float; faces: list of index lists or (m,k) int array."""
    me = bpy.data.meshes.new(name)
    verts = np.asarray(verts, np.float32)
    if isinstance(faces, np.ndarray) and faces.ndim == 2:
        k = faces.shape[1]
        me.vertices.add(len(verts)); me.vertices.foreach_set('co', verts.ravel())
        me.loops.add(faces.size); me.loops.foreach_set('vertex_index', faces.ravel().astype(np.int32))
        me.polygons.add(len(faces))
        me.polygons.foreach_set('loop_start', (np.arange(len(faces)) * k).astype(np.int32))
        me.update(calc_edges=True)
    else:
        me.from_pydata(verts.tolist(), [], [list(f) for f in faces])
    if smooth:
        me.shade_smooth()
    if mat is not None:
        me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    link(ob, coll)
    return ob


def bm_to_obj(bm, name, coll=None, mats=None, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        me.shade_smooth()
    for m in (mats or []):
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    link(ob, coll)
    return ob


def empty(name, coll=None, loc=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    ob.location = loc
    link(ob, coll)
    return ob


def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def camera(name, loc, target, lens=50, coll=None, sensor=36):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.sensor_width = sensor
    cd.clip_start = 0.1; cd.clip_end = 80000
    ob = bpy.data.objects.new(name, cd); ob.location = loc
    link(ob, coll)
    look_at(ob, target)
    return ob


def cycles(scene, samples=128, res=(1920, 1080), pct=100, gpu=True, denoise=True):
    scene.render.engine = 'CYCLES'
    if gpu:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == 'METAL'
        scene.cycles.device = 'GPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = denoise
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.max_bounces = 8
    # leaf cards stack deep in dense scrub: at 16, rays gave up inside the lentisk and came back grey (snowy bushes)
    scene.cycles.transparent_max_bounces = 128
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transmission_bounces = 6
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.sample_clamp_indirect = 8
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = pct
    scene.view_settings.view_transform = 'AgX'
    try:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False


def save_blend(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
    stamp_build(path)


def stamp_build(path):
    """Write <name>.build.json beside a saved island: the island model's version, which every previs
    rendered from it records (world/provenance.py): the file's hash, the terrain it was built from,
    the commit, and any uncommitted changes to the scripts that built it."""
    import hashlib, json, subprocess, time
    def sha(p):
        h = hashlib.sha256()
        with open(p, 'rb') as f:
            for chunk in iter(lambda: f.read(1 << 24), b''):
                h.update(chunk)
        return h.hexdigest()[:12]
    def git(*a):
        return subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    name = os.path.splitext(os.path.basename(path))[0]
    terrain = os.path.join(BUILD, 'terrain', name)
    st = {'blend': os.path.relpath(path, os.path.dirname(ROOT)), 'hash': sha(path),
          'built': time.strftime('%Y-%m-%dT%H:%M:%S'),
          'terrain': {f: sha(os.path.join(terrain, f)) for f in ('height.npy', 'sites.json')
                      if os.path.exists(os.path.join(terrain, f))},
          'commit': git('rev-parse', '--short', 'HEAD') or None,
          'uncommitted': [l[3:] for l in git('status', '--porcelain', '--', 'src').splitlines()]}
    with open(os.path.join(os.path.dirname(path), name + '.build.json'), 'w') as f:
        json.dump(st, f, indent=1)


def import_gltf(path, coll=None):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    if coll is not None:
        for o in new:
            for c in list(o.users_collection):
                c.objects.unlink(o)
            coll.objects.link(o)
    return new
