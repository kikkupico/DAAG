"""The statue scans for the Chamber's terrace, from Three D Scans (published free of copyright
restrictions): downloaded into assets/statues/dl and unpacked into assets/statues/x_<name>.
Files already present are kept. python3 src/fetch_statues.py"""
import os, urllib.parse, urllib.request, zipfile

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'statues')
UA = {'User-Agent': 'DAAG-world/1.0'}
SCANS = {
    'Athena': 'https://threedscans.com/wp-content/uploads/2016/02/Athena.obj.zip',
    'Ephebe': 'https://threedscans.com/wp-content/uploads/2016/02/Ephebe.obj.zip',
    'hermes': 'https://threedscans.com/wp-content/uploads/2016/02/hermes.OBJ.zip',
    'Plato': 'https://threedscans.com/wp-content/uploads/2016/05/Plato.obj.zip',
    'Jüngling_Vom_Magdalensberg': 'https://threedscans.com/wp-content/uploads/2016/04/Jüngling_Vom_Magdalensberg.obj.zip',
}


def main():
    os.makedirs(os.path.join(ROOT, 'dl'), exist_ok=True)
    for name, url in SCANS.items():
        dest = os.path.join(ROOT, 'x_' + name)
        if os.path.isdir(dest) and any(f.lower().endswith('.obj') for f in os.listdir(dest)):
            print('have', name)
            continue
        zp = os.path.join(ROOT, 'dl', os.path.basename(url))
        if not os.path.exists(zp):
            print('fetch', name)
            u = urllib.parse.quote(url, safe=':/')
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=300) as r, open(zp, 'wb') as f:
                f.write(r.read())
        with zipfile.ZipFile(zp) as z:
            for m in z.namelist():
                p = os.path.normpath(os.path.join(dest, m))
                if not p.startswith(os.path.normpath(dest)):      # never write outside the folder
                    raise RuntimeError('bad path in ' + zp)
            z.extractall(dest)
        print('unpacked', name)


if __name__ == '__main__':
    main()
