// Scene prompt assembly. The style prompts and cast note come from world/panels/pipeline.py
// through /api/prompt; the copies here are only a fallback when the server cannot import it.

const FALLBACK = {
  styles: {
    photo: {
      picture: 'photograph',
      keep: 'Image 1 is a 3D previs guide for camera framing, focal perspective, and spatial layout. Turn it into a real ' +
        'photograph of the same place: keep its camera, framing and light, and the position, shape and size of every ' +
        'building, hill, tree, bush and object, repainting every surface with the authentic detail of a real photograph. ' +
        'Every building is in daily civic use, clean and well kept, ' +
        'with dressed ashlar limestone masonry and natural tile. The ground is worn earth and gravel with scattered stones, ' +
        'ruts, footprints and dust, merging into verges with dry grass and low Mediterranean scrub. Trees and bushes have ' +
        'natural leaves, branches and growth. Render only the structures, trees, and terrain visible in image 1. People at ' +
        'true scale, with real cast shadows on the ground.'
    },
    'ligne-claire': {
      picture: 'illustration',
      keep: 'Draw image 1 as a Franco-Belgian bande dessinée illustration in the classic ligne claire tradition of ' +
        'Jacques Martin (Alix), Hergé (Tintin), and Edgar P. Jacobs. Graphic style: uniform, unbroken black ink ' +
        'outlines of consistent fine weight defining all architectural lines, figures, and landscape elements, with ' +
        'zero sketchiness and no cross-hatching. Flat, unshaded gouache color planes with clean matte tones; no ' +
        'photographic gradients, blurs, or halftone dots. Cast shadows are flat, hard-edged geometric shapes filled ' +
        'with a single uniform darker tone. Keep the camera, framing, buildings, and layout of image 1 exactly. ' +
        'Every building is in daily use and well kept. Figures at ' +
        'true scale with expressive, clear graphic readability. One single illustration filling the frame: no lettering, ' +
        'no title, no speech balloons, no sound effects, no captions, no logos, no signature, no panel border.'
    }
  },
  keep_interior: 'Image 1 is a 3D previs guide for camera framing, perspective, and architectural layout. Turn it into a real ' +
    'photograph of the enclosed interior space: keep its camera, framing and light, and the position, shape and size ' +
    'of every wall, column, bench, doorway, and interior object. Solid architectural enclosure: finely dressed ashlar ' +
    'limestone masonry, smooth plaster walls, and worn flagstone flooring showing natural foot-traffic wear. The light ' +
    'outside comes in through open doorways and openings and lights the interior surfaces softly. ' +
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
    'ligne-claire': 'A Franco-Belgian ligne claire comic illustration repainting the exact 3D architecture, landscape, and composition ' +
      'of Image 1 without adding, moving, or removing any buildings, walls, columns, or furniture.'
  },
  // render.py's light presets as the picture should show them (pipeline.LIGHTS)
  lights: {
    morning: 'Clear morning: the sun fairly low in a cloudless pale blue sky, fresh soft light, long shadows and a light ' +
      'haze in the distance.',
    golden: 'Golden hour: the sun just above the horizon in a cloudless sky, warm amber light raking across every surface, ' +
      'very long shadows and a warm haze in the distance.',
    late: 'Late afternoon on a clear day: the sun low, warm light, long shadows and a soft haze in the distance.',
    noon: 'Midday in summer: the sun high in a clear deep blue sky, bright hard light, short dark shadows under things.',
    overcast: 'A fully overcast day: an even grey sky with no sun, soft light with no cast shadows, muted colours and a ' +
      'grey haze in the distance.',
    cloudy_sun: 'A bright day with scattered white clouds: sunshine between the clouds, clear shadows, blue sky.',
    evening_cloud: 'Sunset under a heavily clouded grey sky: the sun hidden, dim warm light low on the horizon, soft ' +
      'shadows and muted colours.',
    dusk: 'Dusk just after sunset: the sun below the horizon, a pale pink and lilac afterglow sky, dim soft light with no ' +
      'sun shadows.',
    moonlit: 'Night under a bright high moon in a clear starry sky: cool silvery-blue moonlight, deep soft shadows, dark ' +
      'and desaturated colours; no sunlight and no daylight anywhere.'
  },
  light_note: 'Time of day and weather, as in image 1. {}',
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
 * whom, time of day and weather (light: a render.py light preset), then style text. keep=false leaves the style text and
 * anchor out; labels=false means clean cast crops (default).
 */
export function buildPrompt({ style, action, others = '', cast = [], keep = true, labels = false, interior = false, light = '' }) {
  const stylesObj = (parts && parts.styles) || FALLBACK.styles;
  const s = stylesObj[style] || FALLBACK.styles.photo;
  const picture = s.picture || 'photograph';
  const n = Array.isArray(cast) ? cast.length : 0;
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
      drawn: style === 'photo' ? '' : ', translated into this ligne claire comic style with expressive ink linework and matching flat-coloured clothes'
    };
    const note = (parts?.cast_note || FALLBACK.cast_note).replace(/\{(\w+)\}/g, (_, k) => fill[k] ?? '');
    body += ' ' + note.replace('a reference photographs', 'a reference photograph');
  }

  const lights = (parts && parts.lights) || FALLBACK.lights || {};
  const lightText = lights[light];
  if (lightText) {
    body += ' ' + (parts?.light_note || FALLBACK.light_note).replace('{}', lightText);
  }

  if (!keep) {
    return body;
  }

  const anchorKey = style === 'photo' ? (interior ? 'photo_interior' : 'photo_exterior') : 'ligne-claire';
  const anchors = (parts && parts.anchors) || FALLBACK.anchors || {};
  const anchor = anchors[anchorKey] || FALLBACK.anchors[anchorKey] || '';
  let keepText = s.keep || FALLBACK.styles.photo.keep;
  if (style === 'photo' && interior) {
    keepText = parts?.keep_interior || FALLBACK.keep_interior || keepText;
  }

  return `${anchor} Within this exact architecture: ${body} ${keepText}`;
}
