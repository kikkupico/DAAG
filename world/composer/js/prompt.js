// Scene prompt assembly. The style prompts and cast note come from world/panels/pipeline.py
// through /api/prompt; the copies here are only a fallback when the server cannot import it.

const FALLBACK = {
  styles: {
    photo: {
      picture: 'photograph',
      keep: 'Image 1 is a rough 3D render of the place, a guide to what is where and nothing more. Turn it into a real ' +
        'photograph of the same place: keep its camera, framing and light, and the position, shape and size of every ' +
        'building, hill, tree, bush and object, but repaint every surface with the detail of a real photograph ' +
        "instead of copying the render's flat colours, smooth slopes, speckled foliage and repeating textures. The " +
        'ground is worn earth and gravel with stones, ruts, footprints and dust, merging into its verges with no hard ' +
        'straight edge. Hillsides and banks are dry Mediterranean ground: stony soil, pale limestone breaking ' +
        'through, dry grass and low scrub. Trees and bushes have real leaves, branches and gaps. Plaster walls show ' +
        'stains, scuffs and patching; roof tiles vary in tone and sit unevenly. Hellenistic Greece, 3rd century BC; ' +
        'nothing modern. Every building is in daily use, clean and well kept: no ruin, no weeds between the stones. ' +
        'Nothing is added that image 1 does not show: no other buildings, trees or hills. People at true scale, with ' +
        'real shadows on the ground.'
    },
    'ligne-claire': {
      picture: 'illustration',
      keep: 'Draw image 1 as a Franco-Belgian ligne claire comic illustration in the manner of Hergé and Edgar P. Jacobs: clean ' +
        'black ink outlines of even weight, flat areas of clear colour with no gradients, no hatching and very little ' +
        'shading, detailed accurate architecture, readable figures. Keep its camera, framing, buildings, objects and layout ' +
        'exactly. Hellenistic Greece, 3rd century BC; nothing modern. Every building is in daily use, clean and well kept. ' +
        'Everything behind the people stays as it is in image 1, the same hills, trees, bushes and buildings, with nothing ' +
        'built that image 1 does not show. Daylight; people at true scale, with their shadows on the ground. One single ' +
        'illustration filling the frame: no lettering, no title, no speech balloons, no captions, no logos, no signature, ' +
        'no panel border.'
    }
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
 * The prompt for one shot, assembled as pipeline.request() does: style text, the shot's prompt, who is
 * whom, then the head count. keep=false leaves the style text out; labels=true means the cast pictures
 * go with their names printed below (the pipeline's default).
 */
export function buildPrompt({ style, action, others, cast, keep = true, labels = true }) {
  const s = parts.styles[style] || FALLBACK.styles.photo;
  const picture = s.picture;
  const n = cast.length;
  let prompt = keep ? `${s.keep} ${action.trim()}` : action.trim();

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
    prompt += ' ' + note.replace('a reference photographs', 'a reference photograph');
  }

  const o = others.trim();
  if (o) {
    prompt += n > 0
      ? ` Besides the ${n} named, the only other people in the ${picture} are these: ${o}`
      : ` The only people in the ${picture} are these: ${o}`;
  } else if (n > 0) {
    prompt += ` There ${n === 1 ? 'is' : 'are'} exactly ${n} ${n === 1 ? 'person' : 'people'} in the ${picture}; nobody else.`;
  } else {
    prompt += ` There is nobody in the ${picture}.`;
  }
  return prompt;
}
