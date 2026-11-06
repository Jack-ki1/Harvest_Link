# HarvestLink asset manifest

## Procedural scene assets
The 3D scene is authored in React Three Fiber/Three.js: farm terrain, organized crop rows, stylized farmer figures, produce crates, farm and collection buildings, sorting hub, restaurant, delivery lorries, feature-phone prop and chapter hotspots. These are original project geometry; no third-party GLB is downloaded or required.

| Asset | Source | License / attribution |
|---|---|---|
| Farm, crop rows, terrain | Original procedural geometry | Original code |
| Farmer characters | Original procedural geometry | Original code |
| Farm, collection hub, buyer building | Original procedural geometry | Original code |
| Crates, produce props and delivery vehicle | Original procedural geometry | Original code |
| Feature-phone prop and signage | Original procedural geometry | Original code |
| Interface icons | lucide-react | ISC license |
| Product images | Existing starterProducts Unsplash image URLs | Remote images subject to Unsplash terms; replace with owned/licensed local assets for production |
| Web fonts | Google Fonts DM Sans, Manrope, Playfair Display | Open Font License |

## Replacing / adding GLB assets
1. Place approved .glb/.gltf files under public/models and textures under public/textures.
2. Load using @react-three/drei useGLTF or GLTFLoader from Three.js.
3. Normalize model scale, pivot and materials in a dedicated component.
4. Record source URL, creator, exact license, attribution and modifications here.
5. Optimize geometry, use compressed textures (KTX2/Basis), Draco where beneficial, and add LOD for distant assets.
6. Do not bundle scraped models or images. Verify commercial redistribution and modification rights before use.
