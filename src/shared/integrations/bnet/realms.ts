export const WOW_REALMS = [
    { name: "Dun Modr", slug: "dun-modr" },
    { name: "Sanguino", slug: "sanguino" },
    { name: "Shen'dralar", slug: "shendralar" },
    { name: "Zul'jin", slug: "zuljin" },
    { name: "Uldum", slug: "uldum" },
    { name: "Los Errantes", slug: "los-errantes" },
    { name: "C'Thun", slug: "cthun" },
    { name: "Exodar", slug: "exodar" },
    { name: "Minahonda", slug: "minahonda" },
    { name: "Tyrande", slug: "tyrande" },
    { name: "Colinas Pardas", slug: "colinas-pardas" },
    { name: "Silvermoon", slug: "silvermoon" },
    { name: "Draenor", slug: "draenor" },
    { name: "Kazzak", slug: "kazzak" },
    { name: "Twisting Nether", slug: "twisting-nether" },
    { name: "Tarren Mill", slug: "tarren-mill" },
    { name: "Stormscale", slug: "stormscale" },
    { name: "Ravencrest", slug: "ravencrest" },
    { name: "Ragnaros", slug: "ragnaros" },
    { name: "Hyjal", slug: "hyjal" },
] as const;

export type Realm = (typeof WOW_REALMS)[number];
