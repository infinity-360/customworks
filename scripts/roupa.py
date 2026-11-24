# Moletom aranha em 3D: importa o modelo do moletom (glTF, CC-BY, crédito no guia), troca a cor do tecido pelo preto
# lavado da Vulto, borda a aranha vermelha nas costas e a pequena no peito (projeção plana com relevo de ponto cheio)
# e renderiza o giro de frente (0°) às costas (180°) com fundo transparente e a sombra de contato no alfa
# (Cycles, shadow catcher).
# Uso (da raiz do projeto, com o Blender 4 ou mais novo instalado):
#   blender --background --factory-startup --python scripts/roupa.py -- <modelo.gltf|glb> <saida> [--test] [--angles 0,90,180]
#   a textura da aranha é lida de fonte/bordado-aranha.png (ao lado de scripts/)
#   padrão: 121 quadros de 0° a 180°, 1536 × 1920, 96 amostras + OIDN
#   --inspect só lista objetos, materiais, caixa e orientação (não renderiza)
import math, os, sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], os.path.abspath(argv[1])
def opt(name, default):
    if name in argv:
        return type(default)(argv[argv.index(name) + 1])
    return default
TEST = '--test' in argv
INSPECT = '--inspect' in argv
FRAMES = opt('--frames', 121)
W, H = opt('--w', 1536), opt('--h', 1920)
A0, A1 = opt('--from', 0.0), opt('--to', 180.0)
SAMPLES = opt('--samples', 96)
YAW0 = opt('--yaw', 0.0)            # correção para o moletom olhar a câmera em 0°
HERE = os.path.dirname(os.path.abspath(__file__))
FONTE = os.path.join(HERE, '..', 'fonte')
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in scene.objects if o.type == 'MESH']
for o in scene.objects:
    print('OBJ', o.type, o.name, tuple(round(d, 3) for d in o.dimensions), [m.name for m in getattr(o.data, 'materials', [])] if o.type == 'MESH' else '')
skip = [s for s in opt('--skip', '').split(',') if s]
for o in list(meshes):
    if any(s.lower() in o.name.lower() for s in skip):
        bpy.data.objects.remove(o, do_unlink=True); meshes.remove(o)

# junta tudo num objeto só, sem pais nem transformações
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
    if o.parent:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
g = bpy.context.view_layer.objects.active
g.name = 'moletom'
for o in [o for o in scene.objects if o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
g.rotation_euler = (math.radians(opt('--rx', 0.0)), math.radians(opt('--ry', 0.0)), math.radians(YAW0))
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
# altura 2 m, centro da caixa no eixo (x, y), barra a z = 0,42 (a sombra cai num chão abaixo dela)
d = g.dimensions.copy()
s = 2.0 / d.z
g.scale = (s, s, s)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
LIFT = opt('--lift', 0.42)
g.location = (0, 0, g.dimensions.z / 2 + LIFT)
bpy.ops.object.transform_apply(location=True)
print('DIMS', tuple(round(v, 3) for v in g.dimensions), 'POLYS', len(g.data.polygons))
if INSPECT:
    # para onde aponta a "frente": centro de massa dos vértices com y < 0 e y > 0 (o capuz pesa atrás)
    vs = [g.matrix_world @ v.co for v in g.data.vertices]
    up = [v for v in vs if v.z > 0.42 + 1.6]
    print('TOPO y médio (capuz: + = atrás)', round(sum(v.y for v in up) / max(1, len(up)), 3))
    # profundidades (y) das superfícies que caem no quadrado de cada aranha
    for nm, (cx, cz, sz) in {'peito': (opt('--fx', 0.28), opt('--fz', 1.84), opt('--fs', 0.08)), 'costas': (opt('--bx', 0.0), opt('--bz', 1.74), opt('--bs', 0.42))}.items():
        ys = sorted(round(v.y, 2) for v in vs if abs(v.x - cx) < sz / 2 and abs(v.z - cz) < sz / 2)
        hist = {}
        for y in ys: hist[y] = hist.get(y, 0) + 1
        print('PROF', nm, hist)
    for m in g.data.materials:
        print('MAT', m.name, [n.bl_idname + ':' + n.name + (':' + n.image.name if getattr(n, 'image', None) else '') for n in m.node_tree.nodes])
    sys.exit(0)

pivot = bpy.data.objects.new('pivo', None)
scene.collection.objects.link(pivot)
g.parent = pivot


# ---- tecido: preto lavado com manchas suaves, o normal map do modelo fica (dobras e trama) ----
def decal_nodes(N, L, image, center, size, side):
    """projeção plana em x/z do objeto, só nas faces viradas para `side` (−1 frente, +1 costas); devolve (cor, alfa)"""
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    # u = −side·(x − cx)/size + 0,5 (vista de trás, a direita de quem olha é −x), v = (z − cz)/size + 0,5
    mp.inputs['Location'].default_value = (0.5 + side * center[0] / size, 0.5 - center[1] / size, 0)
    mp.inputs['Scale'].default_value = (-side / size, 1 / size, 1)
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs['Vector'])
    comb = N.new('ShaderNodeCombineXYZ'); L.new(sep.outputs['X'], comb.inputs['X']); L.new(sep.outputs['Z'], comb.inputs['Y'])
    L.new(comb.outputs['Vector'], mp.inputs['Vector'])
    tex = N.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(image); tex.extension = 'CLIP'
    tex.interpolation = 'Cubic'
    L.new(mp.outputs['Vector'], tex.inputs['Vector'])
    # máscara de lado: a normal (no objeto) tem y com o sinal de `side`
    geo = N.new('ShaderNodeNewGeometry')
    vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'OBJECT'
    L.new(geo.outputs['Normal'], vt.inputs['Vector'])
    sn = N.new('ShaderNodeSeparateXYZ'); L.new(vt.outputs['Vector'], sn.inputs['Vector'])
    face = N.new('ShaderNodeMath'); face.operation = 'MULTIPLY'; face.inputs[1].default_value = side * 4.0
    L.new(sn.outputs['Y'], face.inputs[0])
    cl = N.new('ShaderNodeClamp'); L.new(face.outputs[0], cl.inputs['Value'])
    a = N.new('ShaderNodeMath'); a.operation = 'MULTIPLY'
    L.new(tex.outputs['Alpha'], a.inputs[0]); L.new(cl.outputs[0], a.inputs[1])
    # janela de profundidade: só a superfície do lado certo (sem isso, a borda do capuz, que fica na mesma
    # altura do peito, pegava um risco da aranha pequena)
    dep = N.new('ShaderNodeMapRange'); dep.clamp = True
    lo, hi = (opt('--yback', 0.18), opt('--yback', 0.18) + 0.06) if side > 0 else (-opt('--yfront', 0.24), -opt('--yfront', 0.24) + 0.06)
    dep.inputs['From Min'].default_value = lo; dep.inputs['From Max'].default_value = hi
    dep.inputs['To Min'].default_value = 0.0 if side > 0 else 1.0; dep.inputs['To Max'].default_value = 1.0 if side > 0 else 0.0
    L.new(sep.outputs['Y'], dep.inputs['Value'])
    a2 = N.new('ShaderNodeMath'); a2.operation = 'MULTIPLY'
    L.new(a.outputs[0], a2.inputs[0]); L.new(dep.outputs['Result'], a2.inputs[1])
    return tex.outputs['Color'], a2.outputs[0]


def fabric(old):
    m = bpy.data.materials.new('moletom-vulto'); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links
    b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.86
    b.inputs['Sheen Weight'].default_value = opt('--sheen', 0.25)
    b.inputs['Sheen Roughness'].default_value = 0.45
    b.inputs['Sheen Tint'].default_value = (0.55, 0.56, 0.58, 1)
    b.inputs['Specular IOR Level'].default_value = 0.25
    # normal map do modelo original (trama e costuras), se houver
    nmap = None
    if old and old.use_nodes and opt('--nstr', 0.0) > 0:
        for n in old.node_tree.nodes:
            if n.bl_idname == 'ShaderNodeNormalMap':
                for l in n.inputs['Color'].links:
                    img = l.from_node.image
                    t = N.new('ShaderNodeTexImage'); t.image = img; img.colorspace_settings.name = 'Non-Color'
                    nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = opt('--nstr', 0.0)
                    uv = N.new('ShaderNodeUVMap'); L.new(uv.outputs['UV'], t.inputs['Vector'])
                    L.new(t.outputs['Color'], nm.inputs['Color']); nmap = nm
    # preto lavado (#232426 na foto) com manchas grandes e suaves de lavagem
    tc = N.new('ShaderNodeTexCoord')
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 2.2; nz.inputs['Detail'].default_value = 3.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = N.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements
    k = opt('--black', 0.022)
    e[0].position = 0.3; e[0].color = (k * 0.85, k * 0.86, k * 0.9, 1)
    e[1].position = 0.75; e[1].color = (k * 1.35, k * 1.36, k * 1.4, 1)
    L.new(nz.outputs['Fac'], cr.inputs['Fac'])
    col = cr.outputs['Color']
    # aranhas: costas (grande) e peito esquerdo (pequena)
    img = os.path.join(FONTE, 'bordado-aranha.png')
    big_c, big_a = decal_nodes(N, L, img, (opt('--bx', 0.0), opt('--bz', 0.42 + 1.32)), opt('--bs', 0.42), +1)
    sm_c, sm_a = decal_nodes(N, L, img, (opt('--fx', 0.28), opt('--fz', 0.42 + 1.42)), opt('--fs', 0.08), -1)
    alpha = N.new('ShaderNodeMath'); alpha.operation = 'MAXIMUM'; L.new(big_a, alpha.inputs[0]); L.new(sm_a, alpha.inputs[1])
    mixc = N.new('ShaderNodeMix'); mixc.data_type = 'RGBA'; L.new(big_a, mixc.inputs['Factor']); L.new(col, mixc.inputs['A']); L.new(big_c, mixc.inputs['B'])
    mixc2 = N.new('ShaderNodeMix'); mixc2.data_type = 'RGBA'; L.new(sm_a, mixc2.inputs['Factor']); L.new(mixc.outputs['Result'], mixc2.inputs['A']); L.new(sm_c, mixc2.inputs['B'])
    L.new(mixc2.outputs['Result'], b.inputs['Base Color'])
    # linha mercerizada: mais lisa e com brilho que a felpa; relevo do ponto cheio pelo alfa
    rough = N.new('ShaderNodeMix'); rough.data_type = 'FLOAT'; L.new(alpha.outputs[0], rough.inputs['Factor'])
    rough.inputs['A'].default_value = 0.86; rough.inputs['B'].default_value = 0.42
    L.new(rough.outputs['Result'], b.inputs['Roughness'])
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.55; bump.inputs['Distance'].default_value = 0.004
    L.new(alpha.outputs[0], bump.inputs['Height'])
    if nmap: L.new(nmap.outputs['Normal'], bump.inputs['Normal'])
    else:
        # felpa: ruído fino no relevo (o normal map do modelo traz a estampa de chamas em relevo e fica de fora)
        fz = N.new('ShaderNodeTexNoise'); fz.inputs['Scale'].default_value = opt('--fleece', 900.0); fz.inputs['Detail'].default_value = 2.0
        L.new(tc.outputs['Object'], fz.inputs['Vector'])
        fb = N.new('ShaderNodeBump'); fb.inputs['Strength'].default_value = opt('--fleecestr', 0.12); fb.inputs['Distance'].default_value = 0.002
        L.new(fz.outputs['Fac'], fb.inputs['Height'])
        L.new(fb.outputs['Normal'], bump.inputs['Normal'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

old = g.data.materials[0] if g.data.materials else None
mat = fabric(old)
g.data.materials.clear(); g.data.materials.append(mat)
bpy.context.view_layer.objects.active = g
bpy.ops.object.shade_smooth()

# ---- chão (só a sombra vai para o alfa) ----
bpy.ops.mesh.primitive_plane_add(size=30)
floor = bpy.context.active_object
floor.is_shadow_catcher = True

# ---- luz: caixa grande à esquerda-alto, rebatedor à direita, contra atrás (o preto precisa de contorno) ----
def area(name, loc, rot, size, energy, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA'); l.size = size; l.energy = energy; l.color = color
    o = bpy.data.objects.new(name, l); o.location = loc; o.rotation_euler = [math.radians(a) for a in rot]
    scene.collection.objects.link(o); return o
area('chave', (-3.6, -3.4, 4.6), (46, 0, -48), opt('--keysize', 3.0), opt('--key', 2600.0), (1, 0.985, 0.965))
area('rebate', (4.2, -2.6, 2.0), (78, 0, 58), 4.0, opt('--fill', 500.0), (0.96, 0.98, 1))
area('contra', (1.4, 3.8, 4.4), (-42, 0, 160), 2.4, opt('--rim', 1400.0))
area('topo', (0, 0, 6.5), (0, 0, 0), 4.0, opt('--top', 900.0))
world = bpy.data.worlds.new('mundo'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.96, 0.955, 0.95, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = opt('--world', 0.35)

# ---- câmera: tele, na altura do peito ----
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
cam.data.lens = opt('--lens', 85.0)
scene.collection.objects.link(cam); scene.camera = cam
top = g.dimensions.z + LIFT
dist = opt('--dist', 11.0)
target = Vector((0, 0, opt('--aim', 1.2)))
cam.location = Vector((0, -dist, opt('--camz', 1.55)))
dv = target - cam.location
cam.rotation_euler = dv.to_track_quat('-Z', 'Y').to_euler()
cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = opt('--sensor', 24.0)

r = scene.render
r.engine = 'CYCLES'
scene.cycles.device = 'GPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for dvc in prefs.devices: dvc.use = True
except Exception as ex: print('GPU?', ex)
scene.cycles.samples = 32 if TEST else SAMPLES
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = opt('--look', 'AgX - Medium High Contrast')
scene.view_settings.exposure = opt('--exposure', 0.0)
r.film_transparent = True
r.use_persistent_data = True
r.resolution_x, r.resolution_y = (W // 2, H // 2) if TEST else (W, H)
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.image_settings.color_depth = '8'

angles = [float(x) for x in opt('--angles', '').split(',')] if opt('--angles', '') else [A0, 60, 120, A1] if TEST else [A0 + (A1 - A0) * i / (FRAMES - 1) for i in range(FRAMES)]
for i, a in enumerate(angles):
    pivot.rotation_euler = (0, 0, math.radians(a))
    r.filepath = os.path.join(out, f'{i + 1:04d}.png')
    if os.path.exists(r.filepath) and not TEST and '--force' not in argv: continue
    bpy.ops.render.render(write_still=True)
    print('FRAME', i + 1, round(a, 2))
print('OK', out)
