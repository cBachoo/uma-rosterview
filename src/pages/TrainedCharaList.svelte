<script lang="ts">
    import type { CharaData } from "../types";
    import Chara from "../components/Chara.svelte";
    import Filter from "../components/Filter.svelte";
    import { stateStorage } from "../localstorage.svelte";
    import { charaCardsData, factorsData } from "../data";
    import {
        encodeCharas,
        decodeCharas,
        getEncodedFromUrl,
        setEncodedToUrl,
        clearUrlEncoding,
    } from "../utils/encoding";

    interface Props {
        trainedCharas: CharaData[];
        onHome?: () => void;
        onAffinityClick?: () => void;
        onPlannerClick?: () => void;
    }
    const { trainedCharas, onHome, onAffinityClick, onPlannerClick }: Props =
        $props();

    const display = stateStorage("display", {
        stats: true,
        factors: true,
        racesWon: false,
    });
    function onDisplayClick(event: Event, key: string) {
        event.preventDefault();
        display.value[key] = !display.value[key];
    }

    // Export/Import state
    let exportMessage = $state("");
    let showImportModal = $state(false);
    let importText = $state("");
    let importError = $state("");

    async function handleExport() {
        try {
            const encoded = await encodeCharas(trainedCharasFiltered);
            const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
            await navigator.clipboard.writeText(url);
            const savings = encoded.startsWith("z") ? " (compressed)" : "";
            exportMessage = `Link copied to clipboard!${savings}`;
            setTimeout(() => (exportMessage = ""), 3000);
        } catch (err) {
            exportMessage = "Failed to copy";
            setTimeout(() => (exportMessage = ""), 3000);
        }
    }

    function handleImport() {
        showImportModal = true;
        importText = "";
        importError = "";
    }

    async function processImport() {
        try {
            // Extract hash from URL or use as-is
            let encoded = importText.trim();
            if (encoded.includes("#")) {
                encoded = encoded.split("#")[1];
            }
            const imported = await decodeCharas(encoded);
            if (imported.length === 0) {
                importError = "No valid characters found in the link";
                return;
            }
            // Emit event or merge with existing data
            importError = `Successfully decoded ${imported.length} character(s)`;
            showImportModal = false;
            // For now, just set to URL hash to show in app
            setEncodedToUrl(encoded);
            window.location.reload();
        } catch (err) {
            importError = "Invalid link format";
        }
    }

    function closeImportModal() {
        showImportModal = false;
    }

    let searchQuery = $state("");
    let sortBy = $state<
        | "date-desc"
        | "date-asc"
        | "rank-desc"
        | "rank-asc"
        | "skills-desc"
        | "skills-asc"
    >("date-desc");

    interface FilterItem {
        id: string;
        stat: string;
        min: number;
        max: number;
    }

    let filters = $state({
        blues: [] as FilterItem[],
        reds: [] as FilterItem[],
        totalBlues: { min: 0, max: 9 },
        totalReds: { min: 0, max: 9 },
        greens: { stars: 0 },
        whites: {} as { [key: string]: number },
        whitesIncludeParents: false,
        lineageMode: false,
        simpleBlues: {
            speed: false,
            stamina: false,
            power: false,
            guts: false,
            wit: false,
            stars: 1,
        },
        simpleReds: {
            turf: false,
            dirt: false,
            frontRunner: false,
            paceChaser: false,
            lateSurger: false,
            endCloser: false,
            sprint: false,
            mile: false,
            medium: false,
            long: false,
            stars: 1,
        },
    });

    const availableWhites = $derived(() => {
        const factorIds = new Set<number>();
        trainedCharas.forEach((chara) => {
            chara.factor_id_array.forEach((id) => factorIds.add(id));
            chara.succession_chara_array.forEach((s) =>
                s.factor_id_array.forEach((id) => factorIds.add(id)),
            );
        });
        const whiteNames = new Set<string>();
        factorIds.forEach((id) => {
            const f = factorsData[id];
            // Type 4 = skill, Type 5 = race, Type 6 = scenario
            if (f?.type === 4 || f?.type === 5 || f?.type === 6)
                whiteNames.add(f.name);
        });
        return Array.from(whiteNames).sort();
    });

    // Sum rarity for all factors of a given type from an ID array, grouped by name
    function starsByName(ids: number[], type: number): Record<string, number> {
        const result: Record<string, number> = {};
        for (const id of ids) {
            const f = factorsData[id];
            if (f?.type === type) {
                result[f.name] = (result[f.name] || 0) + f.rarity;
            }
        }
        return result;
    }

    const trainedCharasFiltered = $derived(
        trainedCharas
            .filter((chara) => {
                let isDisplayed = true;

                // Search filter
                if (
                    searchQuery &&
                    !charaCardsData[chara.card_id]?.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                ) {
                    isDisplayed = false;
                }

                const allFactors = chara.factor_id_array;
                const p1Ids =
                    chara.succession_chara_array[0]?.factor_id_array ?? [];
                const p2Ids =
                    chara.succession_chara_array[1]?.factor_id_array ?? [];

                // Blues filtering
                if (filters.lineageMode) {
                    if (filters.blues.length > 0) {
                        const unit = starsByName(allFactors, 1);
                        const p1 = starsByName(p1Ids, 1);
                        const p2 = starsByName(p2Ids, 1);
                        for (const filter of filters.blues) {
                            const total =
                                (unit[filter.stat] || 0) +
                                (p1[filter.stat] || 0) +
                                (p2[filter.stat] || 0);
                            if (total < filter.min || total > filter.max) {
                                isDisplayed = false;
                                break;
                            }
                        }
                    }
                } else {
                    const sb = filters.simpleBlues;
                    const hasBlueSelection =
                        sb.speed || sb.stamina || sb.power || sb.guts || sb.wit;
                    if (hasBlueSelection) {
                        const stars = sb.stars;
                        const matchesAnyBlue = allFactors.some((id) => {
                            const f = factorsData[id];
                            if (!f || f.type !== 1) return false;
                            return (
                                (sb.speed &&
                                    f.name === "Speed" &&
                                    f.rarity >= stars) ||
                                (sb.stamina &&
                                    f.name === "Stamina" &&
                                    f.rarity >= stars) ||
                                (sb.power &&
                                    f.name === "Power" &&
                                    f.rarity >= stars) ||
                                (sb.guts &&
                                    f.name === "Guts" &&
                                    f.rarity >= stars) ||
                                (sb.wit &&
                                    f.name === "Wit" &&
                                    f.rarity >= stars)
                            );
                        });
                        if (!matchesAnyBlue) isDisplayed = false;
                    }
                }

                // Reds filtering
                if (filters.lineageMode) {
                    if (filters.reds.length > 0) {
                        const unit = starsByName(allFactors, 2);
                        const p1 = starsByName(p1Ids, 2);
                        const p2 = starsByName(p2Ids, 2);
                        for (const filter of filters.reds) {
                            const total =
                                (unit[filter.stat] || 0) +
                                (p1[filter.stat] || 0) +
                                (p2[filter.stat] || 0);
                            if (total < filter.min || total > filter.max) {
                                isDisplayed = false;
                                break;
                            }
                        }
                    }
                } else {
                    const sr = filters.simpleReds;
                    const hasRedSelection =
                        sr.turf ||
                        sr.dirt ||
                        sr.frontRunner ||
                        sr.paceChaser ||
                        sr.lateSurger ||
                        sr.endCloser ||
                        sr.sprint ||
                        sr.mile ||
                        sr.medium ||
                        sr.long;
                    if (hasRedSelection) {
                        const stars = sr.stars;
                        const matchesAnyRed = allFactors.some((id) => {
                            const f = factorsData[id];
                            if (!f || f.type !== 2) return false;
                            return (
                                (sr.turf &&
                                    f.name === "Turf" &&
                                    f.rarity >= stars) ||
                                (sr.dirt &&
                                    f.name === "Dirt" &&
                                    f.rarity >= stars) ||
                                (sr.frontRunner &&
                                    f.name === "Front Runner" &&
                                    f.rarity >= stars) ||
                                (sr.paceChaser &&
                                    f.name === "Pace Chaser" &&
                                    f.rarity >= stars) ||
                                (sr.lateSurger &&
                                    f.name === "Late Surger" &&
                                    f.rarity >= stars) ||
                                (sr.endCloser &&
                                    f.name === "End Closer" &&
                                    f.rarity >= stars) ||
                                (sr.sprint &&
                                    f.name === "Sprint" &&
                                    f.rarity >= stars) ||
                                (sr.mile &&
                                    f.name === "Mile" &&
                                    f.rarity >= stars) ||
                                (sr.medium &&
                                    f.name === "Medium" &&
                                    f.rarity >= stars) ||
                                (sr.long &&
                                    f.name === "Long" &&
                                    f.rarity >= stars)
                            );
                        });
                        if (!matchesAnyRed) isDisplayed = false;
                    }
                }

                // Total Blues (lineage mode only) — sum ALL blue stars across unit + parents
                if (
                    filters.lineageMode &&
                    (filters.totalBlues.min > 0 || filters.totalBlues.max < 9)
                ) {
                    const totalBlueStars =
                        Object.values(starsByName(allFactors, 1)).reduce(
                            (a, b) => a + b,
                            0,
                        ) +
                        Object.values(starsByName(p1Ids, 1)).reduce(
                            (a, b) => a + b,
                            0,
                        ) +
                        Object.values(starsByName(p2Ids, 1)).reduce(
                            (a, b) => a + b,
                            0,
                        );
                    if (
                        totalBlueStars < filters.totalBlues.min ||
                        totalBlueStars > filters.totalBlues.max
                    ) {
                        isDisplayed = false;
                    }
                }

                // Total Reds (lineage mode only) — sum ALL red stars across unit + parents
                if (
                    filters.lineageMode &&
                    (filters.totalReds.min > 0 || filters.totalReds.max < 9)
                ) {
                    const totalRedStars =
                        Object.values(starsByName(allFactors, 2)).reduce(
                            (a, b) => a + b,
                            0,
                        ) +
                        Object.values(starsByName(p1Ids, 2)).reduce(
                            (a, b) => a + b,
                            0,
                        ) +
                        Object.values(starsByName(p2Ids, 2)).reduce(
                            (a, b) => a + b,
                            0,
                        );
                    if (
                        totalRedStars < filters.totalReds.min ||
                        totalRedStars > filters.totalReds.max
                    ) {
                        isDisplayed = false;
                    }
                }

                // Greens — only filter when stars > 1 (0 or 1 = no filter)
                if (filters.greens.stars > 1) {
                    const hasGreen = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 3 && f.rarity >= filters.greens.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasGreen;
                }

                // Whites (type 4 = skill, 5 = race, 6 = scenario)
                const selectedWhites = Object.entries(filters.whites)
                    .filter(([_, v]) => v > 0)
                    .map(([k, v]) => ({ name: k, minStars: v }));
                if (selectedWhites.length > 0) {
                    const whiteStars = (ids: number[], name: string) =>
                        ids.reduce((sum, id) => {
                            const f = factorsData[id];
                            return (
                                sum +
                                (f &&
                                (f.type === 4 ||
                                    f.type === 5 ||
                                    f.type === 6) &&
                                f.name === name
                                    ? f.rarity
                                    : 0)
                            );
                        }, 0);

                    if (filters.whitesIncludeParents) {
                        const hasAllWhites = selectedWhites.every(
                            ({ name, minStars }) =>
                                whiteStars(allFactors, name) +
                                    whiteStars(p1Ids, name) +
                                    whiteStars(p2Ids, name) >=
                                minStars,
                        );
                        isDisplayed = isDisplayed && hasAllWhites;
                    } else {
                        const hasAllWhites = selectedWhites.every(
                            ({ name, minStars }) =>
                                whiteStars(allFactors, name) >= minStars,
                        );
                        isDisplayed = isDisplayed && hasAllWhites;
                    }
                }

                return isDisplayed;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "date-desc":
                        return b.create_time.localeCompare(a.create_time);
                    case "date-asc":
                        return a.create_time.localeCompare(b.create_time);
                    case "rank-desc":
                        return (b.rank_score || 0) - (a.rank_score || 0);
                    case "rank-asc":
                        return (a.rank_score || 0) - (b.rank_score || 0);
                    case "skills-desc":
                        return b.skill_array.length - a.skill_array.length;
                    case "skills-asc":
                        return a.skill_array.length - b.skill_array.length;
                    default:
                        return 0;
                }
            }),
    );
</script>

<div>
    <nav class="navbar navbar-expand-lg bg-slate mb-3">
        <div class="container-fluid">
            <!-- Left side: Title + Nav links -->
            <div class="d-flex gap-2 align-items-center">
                {#if onHome}
                    <button
                        class="btn btn-slate-light btn-sm"
                        onclick={onHome}
                        title="Back to upload"
                    >
                        ← Home
                    </button>
                {/if}

                <span class="navbar-brand mb-0 h1">Roster</span>

                <div class="vr mx-1"></div>

                <a class="nav-link active" href="#/">Roster</a>
                <a class="nav-link" href="#/affinity">Affinity</a>
                <a class="nav-link" href="#/planner">Planner</a>
            </div>

            <!-- Right side: Controls -->
            <div class="ms-auto d-flex gap-2 align-items-center">
                <div class="btn-group">
                    <button
                        class="btn btn-slate btn-sm"
                        onclick={handleExport}
                        title="Copy shareable link"
                    >
                        Export
                    </button>
                    <button
                        class="btn btn-slate-light btn-sm"
                        onclick={handleImport}
                        title="Import from link"
                    >
                        Import
                    </button>
                </div>
                {#if exportMessage}
                    <span class="badge bg-success">{exportMessage}</span>
                {/if}

                <div class="dropdown">
                    <button
                        class="btn btn-slate-light btn-sm dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        data-bs-auto-close="outside"
                        aria-expanded="false"
                    >
                        Display
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <button
                                class="dropdown-item"
                                onclickcapture={(e) =>
                                    onDisplayClick(e, "stats")}
                            >
                                <div class="form-check">
                                    <input
                                        class="form-check-input"
                                        type="checkbox"
                                        id="displayStats"
                                        bind:checked={display.value.stats}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="displayStats">Stats</label
                                    >
                                </div>
                            </button>
                        </li>
                        <li>
                            <button
                                class="dropdown-item"
                                onclickcapture={(e) =>
                                    onDisplayClick(e, "factors")}
                            >
                                <div class="form-check">
                                    <input
                                        class="form-check-input"
                                        type="checkbox"
                                        id="displaySparks"
                                        bind:checked={display.value.factors}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="displaySparks">Sparks</label
                                    >
                                </div>
                            </button>
                        </li>
                        <li>
                            <button
                                class="dropdown-item"
                                onclickcapture={(e) =>
                                    onDisplayClick(e, "racesWon")}
                            >
                                <div class="form-check">
                                    <input
                                        class="form-check-input"
                                        type="checkbox"
                                        id="displayracesWon"
                                        bind:checked={display.value.racesWon}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="displayracesWon">Races</label
                                    >
                                </div>
                            </button>
                        </li>
                    </ul>
                </div>

                <Filter {filters} {availableWhites} />

                <input
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Search..."
                    bind:value={searchQuery}
                    style="width: 150px;"
                />

                <select
                    class="form-select form-select-sm"
                    bind:value={sortBy}
                    style="width: 150px;"
                >
                    <option value="date-desc">Latest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="rank-desc">Highest Rank</option>
                    <option value="rank-asc">Lowest Rank</option>
                    <option value="skills-desc">Most Skills</option>
                    <option value="skills-asc">Fewest Skills</option>
                </select>
            </div>
        </div>
    </nav>

    <div class="row row-cols-1 row-cols-lg-4 g-3 py-4">
        {#each trainedCharasFiltered as chara (chara.chara_seed)}
            <div class="col">
                <Chara charaData={chara} display={display.value} {filters}
                ></Chara>
            </div>
        {/each}
    </div>

    <!-- Import Modal -->
    {#if showImportModal}
        <div class="modal-backdrop fade show" onclick={closeImportModal}></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Import Characters</h5>
                        <button
                            type="button"
                            class="btn-close"
                            onclick={closeImportModal}
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="importInput" class="form-label"
                                >Paste the shared link:</label
                            >
                            <input
                                type="text"
                                class="form-control"
                                id="importInput"
                                bind:value={importText}
                                placeholder="https://...#encoded-data"
                            />
                        </div>
                        {#if importError}
                            <div class="alert alert-warning">{importError}</div>
                        {/if}
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            onclick={closeImportModal}>Cancel</button
                        >
                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick={processImport}>Import</button
                        >
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Footer -->
<footer class="text-center py-4 mt-5 border-top">
    <div class="container">
        <p class="text-muted mb-0">Contributors: Bachoo, Terumi</p>
    </div>
</footer>

<style>
    .btn-slate {
        background-color: #475569;
        border-color: #475569;
        color: white;
    }

    .btn-slate:hover {
        background-color: #334155;
        border-color: #334155;
        color: white;
    }

    .btn-slate-light {
        background-color: #94a3b8;
        border-color: #94a3b8;
        color: white;
    }

    .btn-slate-light:hover {
        background-color: #64748b;
        border-color: #64748b;
        color: white;
    }

    .btn-group .btn-slate-light {
        border-right-color: rgba(255, 255, 255, 0.3);
    }

    .btn-group .btn-slate-light:last-child {
        border-right-color: #94a3b8;
    }

    .bg-slate {
        background-color: #475569 !important;
    }

    .navbar-brand {
        color: white !important;
        font-weight: bold;
    }

    .nav-link {
        color: rgba(255, 255, 255, 0.8) !important;
    }

    .nav-link:hover {
        color: white !important;
    }

    .nav-link.active {
        color: white !important;
        font-weight: bold;
    }

    .vr {
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        height: 1.5rem;
    }
</style>
