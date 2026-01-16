<script lang="ts">
    import type { CharaData } from "../types";
    import Chara from "../components/Chara.svelte";
    import Filter from "../components/Filter.svelte";
    import { stateStorage } from "../localstorage.svelte";
    import { charaCardsData, factorsData, skillsData } from "../data";
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
    }
    const { trainedCharas, onHome }: Props = $props();

    const display = stateStorage("display", { stats: true, factors: true });
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
            const encoded = encodeCharas(trainedCharasFiltered);
            const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
            await navigator.clipboard.writeText(url);
            exportMessage = "Link copied to clipboard!";
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

    function processImport() {
        try {
            // Extract hash from URL or use as-is
            let encoded = importText.trim();
            if (encoded.includes("#")) {
                encoded = encoded.split("#")[1];
            }
            const imported = decodeCharas(encoded);
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

    let filters = $state({
        blues: {
            speed: false,
            stamina: false,
            power: false,
            guts: false,
            wit: false,
            stars: 1,
        },
        reds: {
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
        greens: { stars: 0 },
        whites: { stars: 1 } as {
            [key: string]: boolean | number;
            stars: number;
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
            if (f?.type === 4) whiteNames.add(f.name);
        });
        return Array.from(whiteNames).sort();
    });

    const trainedCharasFiltered = $derived(
        trainedCharas
            .filter((chara) => {
                let isDisplayed = true;

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

                // Blues
                const selectedBlues = Object.entries(filters.blues)
                    .filter(([k, v]) => k !== "stars" && v)
                    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
                if (selectedBlues.length > 0) {
                    const hasBlue = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 1 &&
                            selectedBlues.includes(f.name) &&
                            f.rarity >= filters.blues.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasBlue;
                }

                // Reds
                const selectedReds = Object.entries(filters.reds)
                    .filter(([k, v]) => k !== "stars" && v)
                    .map(
                        ([k]) =>
                            (nameMap as Record<string, string>)[k] ||
                            k.charAt(0).toUpperCase() + k.slice(1),
                    );
                if (selectedReds.length > 0) {
                    const hasRed = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 2 &&
                            selectedReds.includes(f.name) &&
                            f.rarity >= filters.reds.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasRed;
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

                // Whites
                const selectedWhites = Object.entries(filters.whites)
                    .filter(([k, v]) => k !== "stars" && v)
                    .map(([k]) => k);
                if (selectedWhites.length > 0) {
                    const hasAllWhites = selectedWhites.every((skill) =>
                        allFactors.some((id) => {
                            const f = factorsData[id];
                            return (
                                f?.type === 4 &&
                                f.name === skill &&
                                f.rarity >= filters.whites.stars
                            );
                        }),
                    );
                    isDisplayed = isDisplayed && hasAllWhites;
                }

                return isDisplayed;
            })
            .sort((a, b) => b.create_time.localeCompare(a.create_time)),
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
                    </ul>
                </div>

                <Filter {filters} {availableWhites} />
            </div>
        </div>
    </nav>

    <div class="row row-cols-1 row-cols-lg-2 g-5 py-4">
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

    .skill-icon {
        object-fit: cover;
        border: 1px solid #dee2e6;
    }

    .skill-icon:hover {
        transform: scale(1.1);
        transition: transform 0.2s;
    }
</style>
