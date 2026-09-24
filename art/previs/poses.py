"""Hand-tuned poses for the rigged cast (Meshy builds, Mixamo bone names, A-pose rest).

Shared by art/previs/render.py, which poses figures in a shot, and art/cast/bake_poses.py,
which bakes each pose into art/cast/poses.json for the explorer to show.

A pose is set in metres in the figure's own frame: (to his left, forward, up), with the
figure standing on the origin.
  "L"/"R"   hand targets (IK on each arm)
  "elbows"  elbow poles, overriding the default (out and back)
  "hips"    where the hips go
  "feet"    foot targets (IK on each leg), with "knees" as knee poles
  "bend"    bones pitched forward by degrees (negative leans back)
  "glass"   where render.py puts a sandglass
"""
import math
import bpy
from mathutils import Matrix, Vector

# Hands hanging at the sides; most poses start from these.
HANDS_DOWN = {"L": (0.24, 0.02, 0.80), "R": (-0.24, 0.02, 0.80)}

POSES = {
    "stand": {"label": "stand", **HANDS_DOWN},
    "walk": {"label": "walk (mid-stride)",
             "L": (0.22, -0.18, 0.82), "R": (-0.22, 0.20, 0.84),
             "hips": (0.0, 0.0, 0.90),
             "feet": {"L": (0.11, 0.34, 0.07), "R": (-0.11, -0.30, 0.12)},
             "knees": {"L": (0.11, 1.0, 0.6), "R": (-0.11, 1.0, 0.6)}},
    "point": {"label": "point (right arm out)",
              "L": (0.24, 0.02, 0.80), "R": (-0.18, 0.62, 1.42)},
    "word": {"label": "word (right arm raised)",
             "L": (0.07, 0.30, 1.12), "R": (-0.30, 0.20, 1.72), "glass": (0.07, 0.32, 1.02)},
    "glass": {"label": "sandglass in both hands",
              "L": (0.07, 0.30, 1.12), "R": (-0.07, 0.30, 1.12), "glass": (0.0, 0.32, 1.13)},
    "shade": {"label": "shade (hand at brow)",
              "L": (0.24, 0.02, 0.80), "R": (-0.03, 0.13, 1.62),
              "elbows": {"R": (-0.45, 0.35, 1.55)}},
    "look-down": {"label": "stand, head bowed", **HANDS_DOWN,
                  "bend": {"mixamorig:Neck": 15, "mixamorig:Head": 20}},
    "kneel": {"label": "kneel (right knee down)",
              "L": (0.10, 0.46, 0.52), "R": (-0.20, 0.16, 0.42),
              "hips": (0.0, 0.0, 0.52),
              "feet": {"L": (0.14, 0.40, 0.07), "R": (-0.14, -0.42, 0.06)},
              "knees": {"L": (0.14, 1.2, 0.7), "R": (-0.14, 1.0, 0.0)},
              "bend": {"mixamorig:Spine": 12, "mixamorig:Neck": 12, "mixamorig:Head": 18}},
    "crouch": {"label": "crouch",
               "L": (0.20, 0.42, 0.42), "R": (-0.20, 0.42, 0.42),
               "hips": (0.0, -0.12, 0.48),
               "feet": {"L": (0.16, 0.10, 0.07), "R": (-0.16, 0.06, 0.07)},
               "knees": {"L": (0.3, 1.2, 0.6), "R": (-0.3, 1.2, 0.6)},
               "bend": {"mixamorig:Spine": 25, "mixamorig:Spine1": 10, "mixamorig:Head": -15}},
    "sit": {"label": "sit on the ground",
            "L": (0.26, 0.30, 0.22), "R": (-0.26, 0.30, 0.22),
            "hips": (0.0, 0.0, 0.14),
            "feet": {"L": (0.16, 0.78, 0.07), "R": (-0.16, 0.74, 0.07)},
            "knees": {"L": (0.2, 0.5, 1.0), "R": (-0.2, 0.5, 1.0)},
            "bend": {"mixamorig:Spine": 8}},
    "sit-high": {"label": "sit on a rock or chest (0.45 m)",
                 "L": (0.14, 0.40, 0.58), "R": (-0.14, 0.40, 0.58),
                 "hips": (0.0, -0.05, 0.50),
                 "feet": {"L": (0.15, 0.45, 0.07), "R": (-0.15, 0.42, 0.07)},
                 "knees": {"L": (0.15, 1.2, 0.6), "R": (-0.15, 1.2, 0.6)},
                 "bend": {"mixamorig:Spine": 10}},
    "lie": {"label": "lie on the back",
            "L": (0.30, -0.30, 0.08), "R": (-0.30, -0.30, 0.08),
            "hips": (0.0, 0.0, 0.14),
            "bend": {"mixamorig:Hips": -88}},
}


def _empty(name, arm, loc):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.parent = arm
    e.location = loc
    return e


def _ik(arm, bone, tgt, pole):
    c = arm.pose.bones[bone].constraints.new("IK")
    c.target, c.pole_target, c.chain_count = tgt, pole, 2
    c.pole_angle = math.radians(-90)


def apply_pose(arm, k, name, tag):
    """Pose armature `arm` (scaled by k to a 1.75 m man; the model faces -Y) as POSES[name].
    `tag` keeps the IK helper empties' names apart between figures."""
    pose = POSES[name]
    fig = lambda p: Vector((p[0], -p[1], p[2])) / k   # figure frame -> armature space
    bpy.context.view_layer.update()
    if "hips" in pose:
        hb = arm.pose.bones["mixamorig:Hips"]
        M = hb.matrix.copy()
        M.translation = fig(pose["hips"])
        hb.matrix = M
        bpy.context.view_layer.update()
    for bone, deg in pose.get("bend", {}).items():
        pb = arm.pose.bones[bone]
        h = pb.head.copy()
        pb.matrix = (Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg), 4, "X")
                     @ Matrix.Translation(-h) @ pb.matrix)
        bpy.context.view_layer.update()
    for side, sgn in (("L", "Left"), ("R", "Right")):
        if "feet" in pose:
            _ik(arm, f"mixamorig:{sgn}Leg",
                _empty(f"foot{tag}{side}", arm, fig(pose["feet"][side])),
                _empty(f"knee{tag}{side}", arm, fig(pose["knees"][side])))
        l, fwd, up = pose[side]
        elbow = pose.get("elbows", {}).get(side,
                                           (l * 2.5 + (0.3 if l > 0 else -0.3), -0.4, 1.0))
        _ik(arm, f"mixamorig:{sgn}ForeArm",
            _empty(f"hand{tag}{side}", arm, fig(pose[side])),
            _empty(f"elbow{tag}{side}", arm, fig(elbow)))
    bpy.context.view_layer.update()
