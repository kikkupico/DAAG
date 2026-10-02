import bpy, bmesh, math, sys
from mathutils import Vector
GLB="/Users/kikkupico/Projects/DAAG/art/sets/schedia-tholos.glb"
OUT="/Users/kikkupico/Projects/DAAG/art/previs/renders/schedia-tholos-study/"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
sc=bpy.context.scene
sc.render.engine="BLENDER_EEVEE"
sc.view_settings.view_transform="Standard"; sc.view_settings.look="None"
sc.render.resolution_x, sc.render.resolution_y = 1280, 900
try: sc.eevee.taa_render_samples=24
except: pass
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(0.55,0.7,0.9,1); w.node_tree.nodes["Background"].inputs[1].default_value=0.5
sun=bpy.data.objects.new("sun",bpy.data.lights.new("sun","SUN")); sun.data.energy=3.5; sun.rotation_euler=(math.radians(50),math.radians(10),math.radians(-35)); sc.collection.objects.link(sun)
cam=bpy.data.objects.new("cam",bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera=cam
# ground
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-0.95)); g=bpy.context.object
gm=bpy.data.materials.new("g"); gm.use_nodes=True; gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(0.42,0.46,0.3,1); g.data.materials.append(gm)
shell=[o for o in bpy.data.objects if o.name.startswith("shell")][0]
import json
PORCH=math.radians(json.load(open("/Users/kikkupico/Projects/DAAG/art/sets/schedia-tholos.json"))["params"]["porch"])
def rot(p): return Vector((p[0]*math.cos(PORCH)-p[1]*math.sin(PORCH), p[0]*math.sin(PORCH)+p[1]*math.cos(PORCH), p[2]))
def look(loc,tgt,lens=35,ortho=None):
    loc=rot(loc); tgt=rot(tgt)
    cam.location=loc
    cam.rotation_euler=(Vector(tgt)-Vector(loc)).to_track_quat("-Z","Y").to_euler()
    cam.data.lens=lens
    if ortho: cam.data.type="ORTHO"; cam.data.ortho_scale=ortho
    else: cam.data.type="PERSP"
def clip(obj,co,no,keep_neg=True):
    bm=bmesh.new(); bm.from_mesh(obj.data)
    geom=bm.verts[:]+bm.edges[:]+bm.faces[:]
    bmesh.ops.bisect_plane(bm,geom=geom,plane_co=co,plane_no=no,clear_inner=False,clear_outer=True)
    bm.to_mesh(obj.data); bm.free()
def shot(name):
    sc.render.filepath=OUT+name+".png"; bpy.ops.render.render(write_still=True)
import json
INFO=json.load(open("/Users/kikkupico/Projects/DAAG/art/sets/schedia-tholos.json"))
fm=bpy.data.materials.new("fig"); fm.use_nodes=True; fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(0.75,0.35,0.15,1)
def figure(x,y,h):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22,depth=h-0.25,location=(x,y,(h-0.25)/2)); b=bpy.context.object; b.data.materials.append(fm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12,location=(x,y,h-0.12)); b=bpy.context.object; b.data.materials.append(fm)
if "nofig" not in sys.argv:
    for b_ in INFO["benches"][1:11:2]:                                  # five legislators, seated
        figure(b_["seat"][0],-b_["seat"][1],0.45+0.75)
    pd=INFO["podium"]["seat"]; figure(pd[0],-pd[1],0.4+1.2)             # the one who holds the podium
    for p in ((3.0,2.5),(-1.5,-3.5)): figure(p[0],p[1],1.7)             # messengers
# interior fill
fill=bpy.data.objects.new("fill",bpy.data.lights.new("fill","POINT")); fill.data.energy=3000; fill.location=(0,0,6); sc.collection.objects.link(fill)
which=sys.argv[sys.argv.index("--")+1:]
door=[o for o in bpy.data.objects if o.name.startswith("door")][0]
if "ext" in which:
    look((40,-24,12),(0,0,4.5),35); shot("ext34")
    look((48,0,3.5),(0,0,4.5),50); shot("ext_front")
    look((19,-5,1.7),(11,0,2.4),30); shot("porch_approach")
if "int" in which:
    look((-7.2,0,1.65),(4,0,2.4),26); shot("int_from_far_wall")        # looking out through the door
    look((6.5,0.0,1.65),(-4,0,1.8),24); shot("int_from_door")
    look((2.5,-2.5,1.65),(-3,2,1.4),30); shot("int_podium")
    look((6.5,4.5,3.4),(-2,-1,1.2),30); shot("int_high")
    fill.location=(3.0,2.0,2.2); fill.data.energy=600; sun.data.energy=0.5
    look((-6.5,0,1.65),(2.0,0,6.0),45); shot("int_roof")
    fill.location=(0,0,6); fill.data.energy=3000; sun.data.energy=3.5
if "cut" in which:
    clip(shell,(0,0,0),(0,1,0)); clip(door,(0,0,0),(0,1,0))
    look((14,30,19),(0,0,3.0),35); shot("cut_iso")
if "plan" in which:
    clip(shell,(0,0,4.0),(0,0,1))
    look((0,0,40),(0,0,0),50,ortho=26); shot("plan")
