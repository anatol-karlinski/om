A practical way to do this without ML is template matching on a normalized stroke. You store each user-defined shape as a polyline, put the freehand drawing through the same cleanup, then pick the template whose points are closest.

What you are actually comparing
A drawing is a sequence of points (x, y) over time. Raw points are a bad match for a template because:

the user started at a different place
they drew bigger or smaller
they drew faster or slower (uneven point spacing)
they may have rotated the shape
they may have drawn clockwise vs counterclockwise
So you never compare raw strokes. You convert both the template and the new drawing into the same canonical form, then measure distance.

Pipeline
1. Capture a polyline
Record pointer/touch moves as an ordered list of points. Ignore time for matching; time is only useful later for extras like “was this a scribble?”

If the first and last points are close, treat the stroke as closed (circle, square, triangle). If not, keep it open (that matters if you later add arrows or checkmarks).

2. Resample to a fixed number of points
Walk the path by arc length and emit N points equally spaced along it (often N = 64 or 128).

This is the most important step. Fast corners and slow sides no longer change the representation. A slow, careful square and a quick square become comparable.

3. Normalize position and size
Compute the centroid (average of the resampled points).
Translate so the centroid is at the origin.
Scale so the shape fits a unit box, or so the average distance from the centroid is 1.
Now location and size drop out. A tiny triangle in the corner matches a large triangle in the middle.

4. Normalize rotation (optional)
Decide whether orientation matters.

If a diamond should still count as a square: search for the rotation that best aligns the drawing with the template.
If a square and a diamond are different shapes: skip this, or only try a few angles.
A simple approach: try many angles, or do a coarse-to-fine search, and keep the rotation with the smallest point-to-point error. Classic gesture recognizers do this with a golden-section search over angle.

A more geometric version of the same idea is Procrustes alignment: after centering and scaling, rotate so the two point sets overlap as much as possible.

5. Make start point and drawing direction irrelevant
Users will not start at the same vertex, and they may reverse direction.

Two workable fixes:

Ordered matching: treat the resampled points as a loop. Cyclically rotate which point is “first,” and also try the reversed sequence. Keep the best alignment.
Unordered matching: forget order and treat the stroke as a point cloud. For each point, use nearest-neighbor distance to the other set. This is more forgiving of extra wiggles and of starting in the middle of an edge.
For simple closed shapes, unordered matching is often more robust. Ordered matching is better when stroke order is part of the identity (letters, arrows).

6. Score similarity
After alignment, compute a distance:

Average Euclidean distance between corresponding points (after the best cyclic shift), or
Sum of nearest-neighbor distances (point-cloud version), optionally symmetric: drawing→template and template→drawing.
The recognized shape is the template with the smallest distance.

Add a reject threshold. If even the best template is still far away, return “unknown” instead of forcing a triangle onto a scribble.

You can convert distance to a 0–1 confidence, e.g. 1 / (1 + distance), but the threshold on raw distance is what actually keeps false matches down.

How the user defines a shape
Each shape is just another stroke that went through the same pipeline.

When the user “defines a circle,” they draw it once (or a few times). You store the normalized point set, not a geometric equation.

Multiple examples of the same shape help: store several templates named circle, and at recognition time take the minimum distance to any of them. That absorbs sloppy vs neat drawings.

You do not need a perfect geometric circle. A hand-drawn loop becomes the circle prototype.

Why this beats “detect corners and classify”
A second family of algorithms extracts features:

circularity 4π * area / perimeter² (~1 for a circle)
number of sharp corners (after smoothing)
side-length ratios
bounding-box aspect ratio
That works if the only allowed shapes are circle / square / triangle. It fails as soon as the user can define arbitrary shapes (heart, arrow, house). Your requirement is user-defined templates, so template distance should be the core, not a geometry quiz.

You can still use those features as filters:

very low circularity → don’t even compare against the circle template
open stroke → skip closed-only templates
That speeds things up and reduces confusion between a bad circle and a rounded square.

Practical details that make or break it
Smooth before resampling. A little moving-average or Chaikin-style smoothing removes tremor so corners don’t explode into extra points.

Find corners only for debugging or extra features. Douglas–Peucker simplification is useful to see “this looks like 3 vertices,” but do not make recognition depend on counting corners alone. A rounded triangle will under-count; a shaky square will over-count.

One stroke first. Get unistroke matching solid before multi-stroke shapes. A square drawn as four lines is a different problem (you must group strokes, or concatenate them, or use a point-cloud matcher that ignores stroke breaks).

Closed-path repair. If endpoints are within a few percent of the shape’s size, snap them together before resampling. Circles and polygons benefit a lot from this.

Scale of the distance. Because you normalized size, distances are comparable across drawings. Tune the “unknown” cutoff on a handful of examples: good squares, bad squares, and random scribbles.

Ties. Square vs rectangle, or triangle vs arrowhead, will be close. If two templates score similarly, you can:

prefer the one with fewer points / simpler geometry, or
fall back to a cheap feature (aspect ratio, number of high-curvature points)
Minimal algorithm to implement first
Resample to N points.
Translate to centroid, scale to unit size.
For each template:
try original and reversed point order
try several starting offsets (or nearest-neighbor distances)
optionally try several rotations
record best distance
Return the nearest template if it is under the threshold.
That is the $1 / $P gesture-recognizer family in plain terms: normalize, align, nearest template. It is a good JavaScript starting point because it is only geometry and a few loops, and it already supports user-defined shapes.

Once that works, add smoothing, a reject threshold, and then either rotation search or a small feature filter to separate look-alikes.