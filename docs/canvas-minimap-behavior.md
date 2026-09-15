# Canvas minimap

- Reference: user-provided gray overview examples, 2026-09-14.
- Image silhouettes use one uniform scale for both axes; preserve image aspect ratios, relative coordinates, spacing and overlap.
- Overview bounds include all image bounds and the current visible world rectangle, with 10px minimum inset. A single image retains its shape and surrounding canvas context.
- Neutral gray silhouettes support both themes. The outlined rectangle shows the actual visible canvas based on viewport translation, zoom and measured canvas size.
- Drag inside the viewport frame preserves the grab offset and pans the canvas. Click outside recenters; continuing to drag pans from that location. Zoom is unchanged.
- Freeze the overview projection during pointer capture so viewport-bound updates cannot cause drag feedback drift. Release/cancel clears direct-manipulation state.
- ResizeObserver tracks canvas and minimap sizes. Arrow keys pan by 10% of the visible area.
- Verified with real single/multiple images, mixed aspect ratios, image dragging, both themes, minimap pointer dragging/click navigation and keyboard navigation.
