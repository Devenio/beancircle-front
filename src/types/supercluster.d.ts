declare module 'supercluster' {
  export default class Supercluster<P = unknown> {
    constructor(options?: { radius?: number; maxZoom?: number });
    load(features: GeoJSON.Feature<GeoJSON.Point, P>[]): void;
    getClusters(
      bbox: [number, number, number, number],
      zoom: number,
    ): GeoJSON.Feature<GeoJSON.Point, P & { cluster?: boolean; point_count?: number }>[];
  }
}
