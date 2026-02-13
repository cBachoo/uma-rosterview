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
    } from "../encoding";

    interface Props {
        trainedCharas: CharaData[];
        onHome?: () => void;
        onAffinityClick?: () => void;
    }
    const { trainedCharas, onHome, onAffinityClick }: Props = $props();

    const display = stateStorage("display", { stats: true, factors: true, racesWon: false });
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

                // Debug: log first character's factors
                if (trainedCharas.indexOf(chara) === 0) {
                    console.log("First chara card_id:", chara.card_id);
                    console.log("First chara factors:", chara.factor_id_array);
                    console.log(
                        "Factor lookup results:",
                        chara.factor_id_array.map((id) => ({
                            id,
                            factor: factorsData[id],
                        })),
                    );
                }

                // Factor filters
                const nameMap = {
                    frontRunner: "Front Runner",
                    paceChaser: "Pace Chaser",
                    lateSurger: "Late Surger",
                    endCloser: "End Closer",
                };

                const allFactors = chara.factor_id_array;

                // Blues - Dynamic filters
                if (filters.blues.length > 0) {
                    // Get blue factors from lineage
                    const currentBlue = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 1);
                    const parent1Blue =
                        chara.succession_chara_array[0]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 1);
                    const parent2Blue =
                        chara.succession_chara_array[1]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 1);

                    // Calculate stars per stat
                    const statStars = {
                        Speed: 0,
                        Stamina: 0,
                        Power: 0,
                        Guts: 0,
                        Wit: 0,
                    };
                    [currentBlue, parent1Blue, parent2Blue].forEach((f) => {
                        if (f && f.name in statStars) {
                            statStars[f.name as keyof typeof statStars] +=
                                f.rarity;
                        }
                    });

                    // Check each filter
                    for (const filter of filters.blues) {
                        const statValue =
                            statStars[filter.stat as keyof typeof statStars] ||
                            0;
                        if (statValue < filter.min || statValue > filter.max) {
                            isDisplayed = false;
                            break;
                        }
                    }
                }

                // Reds - Dynamic filters
                if (filters.reds.length > 0) {
                    // Get red factors from lineage
                    const currentRed = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 2);
                    const parent1Red =
                        chara.succession_chara_array[0]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 2);
                    const parent2Red =
                        chara.succession_chara_array[1]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 2);

                    // Calculate stars per aptitude
                    const aptStars = {
                        Turf: 0,
                        Dirt: 0,
                        "Front Runner": 0,
                        "Pace Chaser": 0,
                        "Late Surger": 0,
                        "End Closer": 0,
                        Sprint: 0,
                        Mile: 0,
                        Medium: 0,
                        Long: 0,
                    };
                    [currentRed, parent1Red, parent2Red].forEach((f) => {
                        if (f && f.name in aptStars) {
                            aptStars[f.name as keyof typeof aptStars] +=
                                f.rarity;
                        }
                    });

                    // Check each filter
                    for (const filter of filters.reds) {
                        const aptValue =
                            aptStars[filter.stat as keyof typeof aptStars] || 0;
                        if (aptValue < filter.min || aptValue > filter.max) {
                            isDisplayed = false;
                            break;
                        }
                    }
                }

                // Total Blues filter - sum stars for the blue factor
                if (filters.totalBlues.min > 0 || filters.totalBlues.max < 9) {
                    // Get blue factors from lineage
                    const currentBlue = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 1);
                    const parent1Blue =
                        chara.succession_chara_array[0]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 1);
                    const parent2Blue =
                        chara.succession_chara_array[1]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 1);

                    // Sum the stars for the blue factor (unit + parent1 + parent2)
                    const totalBlueStars =
                        (currentBlue?.rarity || 0) +
                        (parent1Blue?.rarity || 0) +
                        (parent2Blue?.rarity || 0);

                    if (
                        totalBlueStars < filters.totalBlues.min ||
                        totalBlueStars > filters.totalBlues.max
                    ) {
                        isDisplayed = false;
                    }
                }

                // Total Reds filter - sum stars for the red factor
                if (filters.totalReds.min > 0 || filters.totalReds.max < 9) {
                    // Get red factors from lineage
                    const currentRed = chara.factor_id_array
                        .map((id) => factorsData[id])
                        .find((f) => f?.type === 2);
                    const parent1Red =
                        chara.succession_chara_array[0]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 2);
                    const parent2Red =
                        chara.succession_chara_array[1]?.factor_id_array
                            .map((id) => factorsData[id])
                            .find((f) => f?.type === 2);

                    // Sum the stars for the red factor (unit + parent1 + parent2)
                    const totalRedStars =
                        (currentRed?.rarity || 0) +
                        (parent1Red?.rarity || 0) +
                        (parent2Red?.rarity || 0);

                    if (
                        totalRedStars < filters.totalReds.min ||
                        totalRedStars > filters.totalReds.max
                    ) {
                        isDisplayed = false;
                    }
                }

                // Greens - only filter when stars > 1 (0 or 1 means no filter)
                if (filters.greens.stars > 1) {
                    const hasGreen = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 3 && f.rarity >= filters.greens.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasGreen;
                }

                // Whites - each skill now has its own min stars value
                // Type 4 = skill, Type 5 = race, Type 6 = scenario
                const selectedWhites = Object.entries(filters.whites)
                    .filter(([_, v]) => v > 0)
                    .map(([k, v]) => ({ name: k, minStars: v }));
                if (selectedWhites.length > 0) {
                    if (filters.whitesIncludeParents) {
                        // Get ONE matching white factor from each unit (current + parents)
                        const hasAllWhites = selectedWhites.every(
                            ({ name, minStars }) => {
                                // Find the white factor from current unit
                                const currentWhite = chara.factor_id_array
                                    .map((id) => factorsData[id])
                                    .find(
                                        (f) =>
                                            f &&
                                            (f.type === 4 ||
                                                f.type === 5 ||
                                                f.type === 6) &&
                                            f.name === name,
                                    );

                                // Find the white factor from parent 1
                                const parent1White =
                                    chara.succession_chara_array[0]?.factor_id_array
                                        .map((id) => factorsData[id])
                                        .find(
                                            (f) =>
                                                f &&
                                                (f.type === 4 ||
                                                    f.type === 5 ||
                                                    f.type === 6) &&
                                                f.name === name,
                                        );

                                // Find the white factor from parent 2
                                const parent2White =
                                    chara.succession_chara_array[1]?.factor_id_array
                                        .map((id) => factorsData[id])
                                        .find(
                                            (f) =>
                                                f &&
                                                (f.type === 4 ||
                                                    f.type === 5 ||
                                                    f.type === 6) &&
                                                f.name === name,
                                        );

                                // Sum their rarities
                                const totalStars =
                                    (currentWhite?.rarity || 0) +
                                    (parent1White?.rarity || 0) +
                                    (parent2White?.rarity || 0);

                                // Debug for first chara
                                if (
                                    trainedCharas.indexOf(chara) === 0 &&
                                    selectedWhites.length > 0
                                ) {
                                    console.log("=== White Spark Debug ===");
                                    console.log("Skill:", name);
                                    console.log(
                                        "Current:",
                                        currentWhite?.name,
                                        currentWhite?.rarity,
                                    );
                                    console.log(
                                        "Parent 1:",
                                        parent1White?.name,
                                        parent1White?.rarity,
                                    );
                                    console.log(
                                        "Parent 2:",
                                        parent2White?.name,
                                        parent2White?.rarity,
                                    );
                                    console.log(
                                        "Total stars:",
                                        totalStars,
                                        "Required:",
                                        minStars,
                                    );
                                }

                                return totalStars >= minStars;
                            },
                        );
                        isDisplayed = isDisplayed && hasAllWhites;
                    } else {
                        // Original: check only current unit
                        const hasAllWhites = selectedWhites.every(
                            ({ name, minStars }) =>
                                allFactors.some((id) => {
                                    const f = factorsData[id];
                                    return (
                                        (f?.type === 4 ||
                                            f?.type === 5 ||
                                            f?.type === 6) &&
                                        f.name === name &&
                                        f.rarity >= minStars
                                    );
                                }),
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
    <nav class="navbar sticky-top navbar-expand bg-body-tertiary">
        <div class="container-fluid">
            <!-- Left side: Home, Export/Import -->
            <div class="d-flex gap-2 align-items-center">
                {#if onHome}
                    <button
                        class="btn btn-slate-light btn-sm"
                        onclick={onHome}
                        title="Back to upload"
                    >
                        Home
                    </button>
                {/if}

                {#if onAffinityClick}
                    <button
                        class="btn btn-primary btn-sm"
                        onclick={onAffinityClick}
                        title="Open affinity calculator"
                    >
                        Affinity Calculator
                    </button>
                {/if}

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
            </div>

            <!-- Right side: Display, Filters -->
            <div class="d-flex gap-2 align-items-center">
                <div class="dropdown">
                    <button
                        class="btn dropdown-toggle"
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
                    placeholder="Search characters..."
                    bind:value={searchQuery}
                    style="width: 200px;"
                />

                <select
                    class="form-select form-select-sm"
                    bind:value={sortBy}
                    style="width: 180px;"
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
</style>
