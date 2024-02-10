const parser_state = { 
    default: ["default", false], 
    general: ["General", false], 
    metadata: ["Metadata", false], 
    difficulty: ["Difficulty", false], 
    events: ["Events", true], 
    timing_points: ["TimingPoints", true], 
    colors: ["Colours", false], 
    hit_objects: ["HitObjects", true] 
};
const parse_beatmap = (input) => {
    const meta = {};
    let state = parser_state.default;
    const lines = input.split("\n");
    lines.map(x => x.trim()).forEach(line => {
        switch (line) {
            case "[General]":
                state = parser_state.general;
                meta.General = {};
                return;
            case "[Events]":
                state = parser_state.events;
                meta.Events = [];
                return;
        }
        if(state[1]) {
            // csv
            const values = line.split(",");
            meta[state[0]].push(values);
        } else {
            // key:value
            const [k, v] = line.split(":");
            if (!k) return;
            meta[state[0]][k] = v;
        }
    });
    return meta;
}

const ex = `
[General]
Hello:World
[Events]
woa,h   
th,is was really, e
asy, to implement
`;

const meta = {
    beatmaps: {
        "example.osz": ex
    }
};

const Game = () => {
    const beatmaps = Object.keys(meta.beatmaps)
        .map(k => [k.split(".")[0], parse_beatmap(meta.beatmaps[k])]);
    console.log("Current beatmaps:", beatmaps);
};

Game();