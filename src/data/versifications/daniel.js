// LXX-only chapter helper for the Greek additions. Generates a versification
// entry per verse where the LXX (Theodotion) numbers the verse identically
// to the Vulgate/deuterocanonical ENG reference. mt is null because the
// chapter is absent from the Hebrew text.
//
// Edition note: Göttingen Ziegler-Munnich (1999) and Rahlfs-Hanhart (2006)
// both PRINT Susanna and Bel & the Dragon as standalone books titled
// ΣΟΥΣΑΝΝΑ and ΒΗΛ ΚΑΙ ΔΡΑΚΩΝ rather than as Daniel chapters 13 and 14.
// The Vulgate / NRSV-with-Apocrypha / NABRE traditions append them as Daniel
// 13 and 14, which is what we model here so user input like "Daniel 13:1"
// can be parsed canonically. The verse counts (64 Susanna, 42 Bel) and
// numbering match Hanhart's printed Theodotion text.
const lxxOnlyChapter = (chapter, verseCount) => {
    const out = {}
    for (let v = 1; v <= verseCount; v++) {
        const ref = `${chapter}:${v}`
        out[ref] = { lxx: ref, mt: null, eng: ref }
    }
    return out
}

module.exports = {
    // Chapter 3: Include all LXX verses, with mt/eng set to null where no correspondence exists
    "3:1": {
        lxx: "3:1",
        mt: "3:1",
        eng: "3:1",
    },
    "3:2": {
        lxx: "3:2",
        mt: "3:2",
        eng: "3:2",
    },
    "3:3": {
        lxx: "3:3",
        mt: "3:3",
        eng: "3:3",
    },
    "3:4": {
        lxx: "3:4",
        mt: "3:4",
        eng: "3:4",
    },
    "3:5": {
        lxx: "3:5",
        mt: "3:5",
        eng: "3:5",
    },
    "3:6": {
        lxx: "3:6",
        mt: "3:6",
        eng: "3:6",
    },
    "3:7": {
        lxx: "3:7",
        mt: "3:7",
        eng: "3:7",
    },
    "3:8": {
        lxx: "3:8",
        mt: "3:8",
        eng: "3:8",
    },
    "3:9": {
        lxx: "3:9",
        mt: "3:9",
        eng: "3:9",
    },
    "3:10": {
        lxx: "3:10",
        mt: "3:10",
        eng: "3:10",
    },
    "3:11": {
        lxx: "3:11",
        mt: "3:11",
        eng: "3:11",
    },
    "3:12": {
        lxx: "3:12",
        mt: "3:12",
        eng: "3:12",
    },
    "3:13": {
        lxx: "3:13",
        mt: "3:13",
        eng: "3:13",
    },
    "3:14": {
        lxx: "3:14",
        mt: "3:14",
        eng: "3:14",
    },
    "3:15": {
        lxx: "3:15",
        mt: "3:15",
        eng: "3:15",
    },
    "3:16": {
        lxx: "3:16",
        mt: "3:16",
        eng: "3:16",
    },
    "3:17": {
        lxx: "3:17",
        mt: "3:17",
        eng: "3:17",
    },
    "3:18": {
        lxx: "3:18",
        mt: "3:18",
        eng: "3:18",
    },
    "3:19": {
        lxx: "3:19",
        mt: "3:19",
        eng: "3:19",
    },
    "3:20": {
        lxx: "3:20",
        mt: "3:20",
        eng: "3:20",
    },
    "3:21": {
        lxx: "3:21",
        mt: "3:21",
        eng: "3:21",
    },
    "3:22": {
        lxx: "3:22",
        mt: "3:22",
        eng: "3:22",
    },
    "3:23": {
        lxx: "3:23",
        mt: "3:23",
        eng: "3:23",
    },
    "3:24": {
        lxx: "3:91",
        mt: "3:24",
        eng: "3:24",
    },
    "3:25": {
        lxx: "3:92",
        mt: "3:25",
        eng: "3:25",
    },
    "3:26": {
        lxx: "3:93",
        mt: "3:26",
        eng: "3:26",
    },
    "3:27": {
        lxx: "3:94",
        mt: "3:27",
        eng: "3:27",
    },
    "3:28": {
        lxx: "3:95",
        mt: "3:28",
        eng: "3:28",
    },
    "3:29": {
        lxx: "3:96",
        mt: "3:29",
        eng: "3:29",
    },
    "3:30": {
        lxx: "3:97",
        mt: "3:30",
        eng: "3:30",
    },
    // Additional LXX verses in Chapter 3 (Prayer of Azariah and Song of the Three Young Men)
    "3:24a": {
        lxx: "3:24",
        mt: null,
        eng: null,
    },
    "3:25a": {
        lxx: "3:25",
        mt: null,
        eng: null,
    },
    "3:26a": {
        lxx: "3:26",
        mt: null,
        eng: null,
    },
    "3:27a": {
        lxx: "3:27",
        mt: null,
        eng: null,
    },
    "3:28a": {
        lxx: "3:28",
        mt: null,
        eng: null,
    },
    "3:29a": {
        lxx: "3:29",
        mt: null,
        eng: null,
    },
    "3:30a": {
        lxx: "3:30",
        mt: null,
        eng: null,
    },
    "3:31a": {
        lxx: "3:31",
        mt: null,
        eng: null,
    },
    "3:32a": {
        lxx: "3:32",
        mt: null,
        eng: null,
    },
    "3:33a": {
        lxx: "3:33",
        mt: null,
        eng: null,
    },
    "3:34": {
        lxx: "3:34",
        mt: null,
        eng: null,
    },
    "3:35": {
        lxx: "3:35",
        mt: null,
        eng: null,
    },
    "3:36": {
        lxx: "3:36",
        mt: null,
        eng: null,
    },
    "3:37": {
        lxx: "3:37",
        mt: null,
        eng: null,
    },
    "3:38": {
        lxx: "3:38",
        mt: null,
        eng: null,
    },
    "3:39": {
        lxx: "3:39",
        mt: null,
        eng: null,
    },
    "3:40": {
        lxx: "3:40",
        mt: null,
        eng: null,
    },
    "3:41": {
        lxx: "3:41",
        mt: null,
        eng: null,
    },
    "3:42": {
        lxx: "3:42",
        mt: null,
        eng: null,
    },
    "3:43": {
        lxx: "3:43",
        mt: null,
        eng: null,
    },
    "3:44": {
        lxx: "3:44",
        mt: null,
        eng: null,
    },
    "3:45": {
        lxx: "3:45",
        mt: null,
        eng: null,
    },
    "3:46": {
        lxx: "3:46",
        mt: null,
        eng: null,
    },
    "3:47": {
        lxx: "3:47",
        mt: null,
        eng: null,
    },
    "3:48": {
        lxx: "3:48",
        mt: null,
        eng: null,
    },
    "3:49": {
        lxx: "3:49",
        mt: null,
        eng: null,
    },
    "3:50": {
        lxx: "3:50",
        mt: null,
        eng: null,
    },
    "3:51": {
        lxx: "3:51",
        mt: null,
        eng: null,
    },
    "3:52": {
        lxx: "3:52",
        mt: null,
        eng: null,
    },
    "3:53": {
        lxx: "3:53",
        mt: null,
        eng: null,
    },
    "3:54": {
        lxx: "3:54",
        mt: null,
        eng: null,
    },
    "3:55": {
        lxx: "3:55",
        mt: null,
        eng: null,
    },
    "3:56": {
        lxx: "3:56",
        mt: null,
        eng: null,
    },
    "3:57": {
        lxx: "3:57",
        mt: null,
        eng: null,
    },
    "3:58": {
        lxx: "3:58",
        mt: null,
        eng: null,
    },
    "3:59": {
        lxx: "3:59",
        mt: null,
        eng: null,
    },
    "3:60": {
        lxx: "3:60",
        mt: null,
        eng: null,
    },
    "3:61": {
        lxx: "3:61",
        mt: null,
        eng: null,
    },
    "3:62": {
        lxx: "3:62",
        mt: null,
        eng: null,
    },
    "3:63": {
        lxx: "3:63",
        mt: null,
        eng: null,
    },
    "3:64": {
        lxx: "3:64",
        mt: null,
        eng: null,
    },
    "3:65": {
        lxx: "3:65",
        mt: null,
        eng: null,
    },
    "3:66": {
        lxx: "3:66",
        mt: null,
        eng: null,
    },
    "3:67": {
        lxx: "3:67",
        mt: null,
        eng: null,
    },
    "3:68": {
        lxx: "3:68",
        mt: null,
        eng: null,
    },
    "3:69": {
        lxx: "3:69",
        mt: null,
        eng: null,
    },
    "3:70": {
        lxx: "3:70",
        mt: null,
        eng: null,
    },
    "3:71": {
        lxx: "3:71",
        mt: null,
        eng: null,
    },
    "3:72": {
        lxx: "3:72",
        mt: null,
        eng: null,
    },
    "3:73": {
        lxx: "3:73",
        mt: null,
        eng: null,
    },
    "3:74": {
        lxx: "3:74",
        mt: null,
        eng: null,
    },
    "3:75": {
        lxx: "3:75",
        mt: null,
        eng: null,
    },
    "3:76": {
        lxx: "3:76",
        mt: null,
        eng: null,
    },
    "3:77": {
        lxx: "3:77",
        mt: null,
        eng: null,
    },
    "3:78": {
        lxx: "3:78",
        mt: null,
        eng: null,
    },
    "3:79": {
        lxx: "3:79",
        mt: null,
        eng: null,
    },
    "3:80": {
        lxx: "3:80",
        mt: null,
        eng: null,
    },
    "3:81": {
        lxx: "3:81",
        mt: null,
        eng: null,
    },
    "3:82": {
        lxx: "3:82",
        mt: null,
        eng: null,
    },
    "3:83": {
        lxx: "3:83",
        mt: null,
        eng: null,
    },
    "3:84": {
        lxx: "3:84",
        mt: null,
        eng: null,
    },
    "3:85": {
        lxx: "3:85",
        mt: null,
        eng: null,
    },
    "3:86": {
        lxx: "3:86",
        mt: null,
        eng: null,
    },
    "3:87": {
        lxx: "3:87",
        mt: null,
        eng: null,
    },
    "3:88": {
        lxx: "3:88",
        mt: null,
        eng: null,
    },
    "3:89": {
        lxx: "3:89",
        mt: null,
        eng: null,
    },
    "3:90": {
        lxx: "3:90",
        mt: null,
        eng: null,
    },
    // Chapter 4
    "3:31": {
        lxx: "4:34a",
        mt: "3:31",
        eng: "4:1",
    },
    "3:32": {
        lxx: "4:34b",
        mt: "3:32",
        eng: "4:2",
    },
    "3:33": {
        lxx: "4:34c",
        mt: "3:33",
        eng: "4:3",
    },
    "4:1": {
        lxx: "4:34a",
        mt: "3:31",
        eng: "4:1",
    },
    "4:2": {
        lxx: "4:34b",
        mt: "3:32",
        eng: "4:2",
    },
    "4:3": {
        lxx: "4:34c",
        mt: "3:33",
        eng: "4:3",
    },
    "4:4": {
        lxx: "4:1",
        mt: "4:1",
        eng: "4:4",
    },
    "4:5": {
        lxx: "4:2",
        mt: "4:2",
        eng: "4:5",
    },
    "4:6": {
        lxx: "4:3",
        mt: "4:3",
        eng: "4:6",
    },
    "4:7": {
        lxx: "4:4",
        mt: "4:4",
        eng: "4:7",
    },
    "4:8": {
        lxx: "4:5",
        mt: "4:5",
        eng: "4:8",
    },
    "4:9": {
        lxx: "4:6",
        mt: "4:6",
        eng: "4:9",
    },
    "4:10": {
        lxx: "4:7",
        mt: "4:7",
        eng: "4:10",
    },
    "4:11": {
        lxx: "4:8",
        mt: "4:8",
        eng: "4:11",
    },
    "4:12": {
        lxx: "4:9",
        mt: "4:9",
        eng: "4:12",
    },
    "4:13": {
        lxx: "4:10",
        mt: "4:10",
        eng: "4:13",
    },
    "4:14": {
        lxx: "4:11",
        mt: "4:11",
        eng: "4:14",
    },
    "4:15": {
        lxx: "4:12",
        mt: "4:12",
        eng: "4:15",
    },
    "4:16": {
        lxx: "4:13",
        mt: "4:13",
        eng: "4:16",
    },
    "4:17": {
        lxx: "4:14",
        mt: "4:14",
        eng: "4:17",
    },
    "4:18": {
        lxx: "4:15",
        mt: "4:15",
        eng: "4:18",
    },
    "4:19": {
        lxx: "4:16",
        mt: "4:16",
        eng: "4:19",
    },
    "4:20": {
        lxx: "4:17",
        mt: "4:17",
        eng: "4:20",
    },
    "4:21": {
        lxx: "4:18",
        mt: "4:18",
        eng: "4:21",
    },
    "4:22": {
        lxx: "4:19",
        mt: "4:19",
        eng: "4:22",
    },
    "4:23": {
        lxx: "4:20",
        mt: "4:20",
        eng: "4:23",
    },
    "4:24": {
        lxx: "4:21",
        mt: "4:21",
        eng: "4:24",
    },
    "4:25": {
        lxx: "4:22",
        mt: "4:22",
        eng: "4:25",
    },
    "4:26": {
        lxx: "4:23",
        mt: "4:23",
        eng: "4:26",
    },
    "4:27": {
        lxx: "4:24",
        mt: "4:24",
        eng: "4:27",
    },
    "4:28": {
        lxx: "4:25",
        mt: "4:25",
        eng: "4:28",
    },
    "4:29": {
        lxx: "4:26",
        mt: "4:26",
        eng: "4:29",
    },
    "4:30": {
        lxx: "4:27",
        mt: "4:27",
        eng: "4:30",
    },
    "4:31": {
        lxx: "4:28",
        mt: "4:28",
        eng: "4:31",
    },
    "4:32": {
        lxx: "4:29",
        mt: "4:29",
        eng: "4:32",
    },
    "4:33": {
        lxx: "4:30",
        mt: "4:30",
        eng: "4:33",
    },
    "4:34": {
        lxx: "4:31",
        mt: "4:31",
        eng: "4:34",
    },
    "4:35": {
        lxx: "4:32",
        mt: "4:32",
        eng: "4:35",
    },
    "4:36": {
        lxx: "4:33",
        mt: "4:33",
        eng: "4:36",
    },
    "4:37": {
        lxx: "4:34",
        mt: "4:34",
        eng: "4:37",
    },
    // Chapter 5
    // Edition note (verified against Göttingen XVI,2 2026-08-24): both the OG
    // (Munnich) and Theodotion texts print the Darius-the-Mede verse as 5:31
    // and number chapter 6 as 1-28, i.e. the ENGLISH division — the MT-style
    // 6:1-29 appears only as the parenthetical alternative. So lxx follows eng
    // here while mt keeps the +1 offset.
    "5:31": {
        lxx: "5:31",
        mt: "6:1",
        eng: "5:31",
    },
    // Chapter 6
    "6:1": {
        lxx: "6:1",
        mt: "6:2",
        eng: "6:1",
    },
    "6:2": {
        lxx: "6:2",
        mt: "6:3",
        eng: "6:2",
    },
    "6:3": {
        lxx: "6:3",
        mt: "6:4",
        eng: "6:3",
    },
    "6:4": {
        lxx: "6:4",
        mt: "6:5",
        eng: "6:4",
    },
    "6:5": {
        lxx: "6:5",
        mt: "6:6",
        eng: "6:5",
    },
    "6:6": {
        lxx: "6:6",
        mt: "6:7",
        eng: "6:6",
    },
    "6:7": {
        lxx: "6:7",
        mt: "6:8",
        eng: "6:7",
    },
    "6:8": {
        lxx: "6:8",
        mt: "6:9",
        eng: "6:8",
    },
    "6:9": {
        lxx: "6:9",
        mt: "6:10",
        eng: "6:9",
    },
    "6:10": {
        lxx: "6:10",
        mt: "6:11",
        eng: "6:10",
    },
    "6:11": {
        lxx: "6:11",
        mt: "6:12",
        eng: "6:11",
    },
    "6:12": {
        lxx: "6:12",
        mt: "6:13",
        eng: "6:12",
    },
    "6:13": {
        lxx: "6:13",
        mt: "6:14",
        eng: "6:13",
    },
    "6:14": {
        lxx: "6:14",
        mt: "6:15",
        eng: "6:14",
    },
    "6:15": {
        lxx: "6:15",
        mt: "6:16",
        eng: "6:15",
    },
    "6:16": {
        lxx: "6:16",
        mt: "6:17",
        eng: "6:16",
    },
    "6:17": {
        lxx: "6:17",
        mt: "6:18",
        eng: "6:17",
    },
    "6:18": {
        lxx: "6:18",
        mt: "6:19",
        eng: "6:18",
    },
    "6:19": {
        lxx: "6:19",
        mt: "6:20",
        eng: "6:19",
    },
    "6:20": {
        lxx: "6:20",
        mt: "6:21",
        eng: "6:20",
    },
    "6:21": {
        lxx: "6:21",
        mt: "6:22",
        eng: "6:21",
    },
    "6:22": {
        lxx: "6:22",
        mt: "6:23",
        eng: "6:22",
    },
    "6:23": {
        lxx: "6:23",
        mt: "6:24",
        eng: "6:23",
    },
    "6:24": {
        lxx: "6:24",
        mt: "6:25",
        eng: "6:24",
    },
    "6:25": {
        lxx: "6:25",
        mt: "6:26",
        eng: "6:25",
    },
    "6:26": {
        lxx: "6:26",
        mt: "6:27",
        eng: "6:26",
    },
    "6:27": {
        lxx: "6:27",
        mt: "6:28",
        eng: "6:27",
    },
    "6:28": {
        lxx: "6:28",
        mt: "6:29",
        eng: "6:28",
    },

    // Daniel 13: Susanna (Theodotion). 64 verses, LXX-only, identical numbering
    // in Rahlfs and Göttingen Ziegler-Munnich (1999).
    ...lxxOnlyChapter(13, 64),

    // Daniel 14: Bel and the Dragon (Theodotion). 42 verses, LXX-only.
    ...lxxOnlyChapter(14, 42),
}
