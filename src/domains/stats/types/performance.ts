export type PerformanceMetric = {
  label: string;
  score: number | null;
  rank: number | null;
};

export type CharacterPerformancePayload = {
  character: {
    id: string;
    name: string;
    realm: string;
    realmSlug: string;
    region: string;
    className: string | null;
    specName: string | null;
    itemLevel: number | null;
  };
  links: {
    raiderIo: string;
    warcraftLogs: string;
  };
  rio: {
    mythicPlusScore: number | null;
    mythicPlusColor: string | null;
    raidProgression: string | null;
  } | null;
  wcl: {
    itemLevel: number | null;
    mythicPlus: PerformanceMetric | null;
    raidAllStars: PerformanceMetric | null;
    raidProgression: string[];
  } | null;
};
