declare interface Window {
  OML2D: {
    loadOml2d: (config: {
      models: {
        path: string;
        position: [number, number];
        scale: number;
        stageStyle?: {
          height?: number;
        };
      }[];
    }) => void;
  };
}
