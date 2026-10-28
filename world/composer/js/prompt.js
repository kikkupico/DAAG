// Scene prompt assembly. The style prompts and cast note come from world/panels/pipeline.py
// through /api/prompt; the copies here are only a fallback when the server cannot import it.

const FALLBACK = {
  styles: {
    photo: {
      picture: 'photograph',
      keep: 'Image 1 is a 3D previs guide for camera framing, focal perspective, and spatial layout. Turn it into a real ' +
        'photograph of the same place: keep its camera, framing and light, and the position, shape and size of every ' +
        'building, hill, tree, bush and object, repainting every surface with the authentic detail of a real photograph. ' +
        'Authentic ancient Hellenistic Greece, 3rd century BC. Every building is in daily civic use, clean and well kept, ' +
        'with dressed ashlar limestone masonry and natural tile. The ground is worn earth and gravel with scattered stones, ' +
        'ruts, footprints and dust, merging into verges with dry grass and low Mediterranean scrub. Trees and bushes have ' +
        'natural leaves, branches and growth. Render only the structures, trees, and terrain visible in image 1. People at ' +
        'true scale, with real cast shadows on the ground.'
    },
    'ligne-claire': {
      picture: 'illustration',
      keep: 'Draw image 1 as a Franco-Belgian ligne claire comic illustration in the classic manner of Hergé and Edgar P. Jacobs: ' +
        'clean black ink outlines of even weight defining all architectural lines, figures, and objects, with flat areas of ' +
        'clear matte colour without gradients or cross-hatching. Keep the camera, framing, buildings, and layout of image 1 ' +
        'exactly. Authentic ancient Hellenistic Greece, 3rd century BC. Every building is in daily use and well kept. People at ' +
        'true scale, with clear graphic readability. One single illustration filling the frame: no lettering, no title, no ' +
        'speech balloons, no captions, no logos, no signature, no panel border.'
    }
  },
  keep_interior: 'Image 1 is a 3D previs guide for camera framing, perspective, and architectural layout. Turn it into a real ' +
    'photograph of the enclosed interior space: keep its camera, framing and light, and the position, shape and size ' +
    'of every wall, column, bench, doorway, and interior object. Solid architectural enclosure: finely dressed ashlar ' +
    'limestone masonry, smooth plaster walls, and worn flagstone flooring showing natural foot-traffic wear. Natural ' +
    'daylight streams through open doorways and openings, illuminating the interior surfaces with soft ambient light. ' +
    'Authentic classical civic interior: genuine papyrus scrolls, wax writing tablets, and bronze fittings. ' +
    'Render strictly the enclosed architectural interior shown in image 1. People at true scale, with natural interior ' +
    'contact shadows.',
  anchors: {
    photo_exterior: 'A real photograph repainting the exact 3D architecture, landscape, and perspective of Image 1 without adding, ' +
      'moving, or removing any buildings, walls, columns, rocks, or terrain. Any ground shown clear in Image 1 must ' +
      'remain completely clear and free of added structures or platforms.',
    photo_interior: 'A real photograph repainting the exact 3D architecture of Image 1 without adding, moving, or removing any walls, ' +
      'columns, benches, or doorways. The open floor shown in Image 1 must remain completely clear and free of added ' +
      'furniture or freestanding benches. Seated figures must sit strictly on the benches already built into the ' +
      'architecture in Image 1, never on newly generated benches.',
    'ligne-claire': 'A Franco-Belgian ligne claire comic illustration repainting the exact 3D architecture and composition of Image 1 ' +
      'without adding, moving, or removing any buildings, walls, columns, or furniture.'
  },
  cast_note: '{which} reference photographs of people, one person each{printed}: {listing}. ' +
    'Put into the {picture} only these people, each with exactly the face, build and clothes of their ' +
    'reference{drawn}.{labels}'
};

let parts = FALLBACK;
export let promptSource = 'fallback';

export async function loadPromptParts() {
  try {
    const res = await fetch('/api/prompt');
    const data = await res.json();
    if (data.styles) {
      parts = data;
      promptSource = 'pipeline.py';
    }
  } catch (err) {
    console.warn('Using built-in prompt text:', err);
  }
}

/**
 * The prompt for one shot, assembled as pipeline.request() does: architectural anchor, narrative action, headcount, who is
 * whom, then style text. keep=false leaves the style text and anchor out; labels=false means clean cast crops (default).
 */
export function buildPrompt({ style, action, others = '', cast = [], keep = true, labels = false, interior = false }) {
  const s = parts.styles[style] || FALLBACK.styles.photo;
  const picture = s.picture;
  const n = cast.length;
  const a = (action || '').trim();
  const o = (others || '').trim();

  let body = a;

  if (o) {
    body += n > 0
      ? ` Besides the ${n} named, the only other people in the ${picture} are these: ${o}`
      : ` The only people in the ${picture} are these: ${o}`;
  } else if (n > 0) {
    body += ` There ${n === 1 ? 'is' : 'are'} exactly ${n} ${n === 1 ? 'person' : 'people'} in the ${picture}; nobody else.`;
  } else {
    body += ` There is nobody in the ${picture}.`;
  }

  if (n > 0) {
    const fill = {
      which: n === 1 ? 'Image 2 is a' : `Images 2 to ${n + 1} are`,
      listing: cast.map((id, k) => `image ${k + 2} is ${id}`).join(', '),
      picture,
      printed: labels ? ', with their name printed below' : '',
      labels: labels ? ` The names are labels only and appear nowhere in the ${picture}.` : '',
      drawn: style === 'photo' ? '' : ', drawn in the same ligne claire style'
    };
    const note = (parts.cast_note || FALLBACK.cast_note).replace(/\{(\w+)\}/g, (_, k) => fill[k] ?? '');
    body += ' ' + note.replace('a reference photographs', 'a reference photograph');
  }

  if (!keep) {
    return body;
  }

  const anchorKey = style === 'photo' ? (interior ? 'photo_interior' : 'photo_exterior') : 'ligne-claire';
  const anchor = parts.anchors?.[anchorKey] || FALLBACK.anchors[anchorKey];
  let keepText = s.keep;
  if (style === 'photo' && interior) {
    keepText = parts.keep_interior || FALLBACK.keep_interior || s.keep;
  }

  return `${anchor} Within this exact architecture: ${body} ${keepText}`;
}
